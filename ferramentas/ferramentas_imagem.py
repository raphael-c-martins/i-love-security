import io
import os
import uuid
import shutil
import base64
import zipfile
from fastapi import APIRouter, UploadFile, File, Form, Response, BackgroundTasks
from fastapi.responses import FileResponse
from PIL import Image
from utils.logger import registrar_log
from utils.logger import registrar_log

router = APIRouter()

@router.post("/api/converter-imagem")
async def converter_imagem(files: list[UploadFile] = File(...)):
    """Converte imagens para JPG em lote e retorna um ZIP."""
    out_buffer = io.BytesIO()
    
    try:
        with zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for i, file_obj in enumerate(files):
                original_name = file_obj.filename.rsplit('.', 1)[0]
                content = await file_obj.read()
                
                try:
                    img = Image.open(io.BytesIO(content))
                    if img.mode in ('RGBA', 'P', 'LA'):
                        img = img.convert('RGB')
                        
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, "JPEG", quality=90)
                    
                    zip_file.writestr(f"{original_name}_Convertido.jpg", img_buffer.getvalue())
                except Exception as ex:
                    print(f"Erro ao converter {file_obj.filename}: {ex}")
        
        await registrar_log(f"[SUCESSO] Conversão de {len(files)} imagens para JPG.")
        
        return Response(
            content=out_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=Imagens_Convertidas.zip"
            }
        )
    except Exception as e:
        await registrar_log(f"[ERRO] Conversão de imagem falhou: {str(e)}")
        return Response(content="Erro ao converter imagens", status_code=500)

@router.post("/api/comprimir-tif")
async def comprimir_tif(files: list[UploadFile] = File(...)):
    """Comprime arquivos TIF. Se houver mais de um, retorna um ZIP."""
    out_buffer = io.BytesIO()
    
    try:
        if len(files) == 1:
            # Comprimir arquivo único
            file_obj = files[0]
            original_name = file_obj.filename.rsplit('.', 1)[0]
            content = await file_obj.read()
            original_size = len(content)
            
            img = Image.open(io.BytesIO(content))
            frames = []
            max_width = 1800
            
            for i in range(getattr(img, 'n_frames', 1)):
                img.seek(i)
                frame = img.copy()
                if frame.mode != 'RGB':
                    frame = frame.convert('RGB')
                
                width, height = frame.size
                if width > max_width:
                    ratio = max_width / width
                    new_size = (max_width, int(height * ratio))
                    resample_mode = getattr(Image, 'BICUBIC', getattr(Image.Resampling, 'BICUBIC', 3))
                    frame = frame.resize(new_size, resample_mode)
                
                frames.append(frame)
                
            if not frames:
                return Response(content="Nenhum frame válido encontrado no arquivo TIF.", status_code=400)
            
            # Salvar com compressão jpeg
            frames[0].save(
                out_buffer, 
                save_all=True, 
                append_images=frames[1:], 
                format="TIFF", 
                compression="jpeg",
                quality=65
            )
            
            final_size = out_buffer.tell()
            economy = int((1 - (final_size / original_size)) * 100) if original_size > 0 else 0
            
            await registrar_log(f"[SUCESSO] TIF '{file_obj.filename}' Comprimido. Orig: {original_size}B -> Final: {final_size}B")
            
            return Response(
                content=out_buffer.getvalue(),
                media_type="image/tiff",
                headers={
                    "Content-Disposition": f"attachment; filename={original_name}_Comprimido.tif",
                    "X-Original-Size": str(original_size),
                    "X-Final-Size": str(final_size),
                    "X-Economy-Percent": str(economy)
                }
            )
            
        else:
            # Se enviar vários, comprimir todos e zipar
            with zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for file_obj in files:
                    original_name = file_obj.filename.rsplit('.', 1)[0]
                    content = await file_obj.read()
                    
                    try:
                        img = Image.open(io.BytesIO(content))
                        frames = []
                        max_width = 1800
                        for i in range(getattr(img, 'n_frames', 1)):
                            img.seek(i)
                            frame = img.copy()
                            if frame.mode != 'RGB':
                                frame = frame.convert('RGB')
                            width, height = frame.size
                            if width > max_width:
                                ratio = max_width / width
                                new_size = (max_width, int(height * ratio))
                                resample_mode = getattr(Image, 'BICUBIC', getattr(Image.Resampling, 'BICUBIC', 3))
                                frame = frame.resize(new_size, resample_mode)
                            frames.append(frame)
                            
                        if frames:
                            tif_buffer = io.BytesIO()
                            frames[0].save(
                                tif_buffer, 
                                save_all=True, 
                                append_images=frames[1:], 
                                format="TIFF", 
                                compression="jpeg",
                                quality=65
                            )
                            zip_file.writestr(f"{original_name}_Comprimido.tif", tif_buffer.getvalue())
                    except Exception as ex:
                        print(f"Erro ao comprimir {file_obj.filename}: {ex}")
                        
            await registrar_log(f"[SUCESSO] Compressão em lote de {len(files)} TIFs.")
            return Response(
                content=out_buffer.getvalue(),
                media_type="application/zip",
                headers={
                    "Content-Disposition": "attachment; filename=TIFs_Comprimidos.zip"
                }
            )

    except Exception as e:
        await registrar_log(f"[ERRO] Compressão TIF falhou: {str(e)}")
        return Response(content="Erro ao comprimir TIF", status_code=500)


TEMP_TIF_DIR = "ferramentas/temp_tif"

def cleanup_job_dir(path: str):
    if os.path.exists(path):
        shutil.rmtree(path)

@router.post("/api/upload-tif-preview")
async def upload_tif_preview(file: UploadFile = File(...)):
    """Salva TIF para reordenação e retorna miniaturas em base64"""
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(TEMP_TIF_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    input_tif = os.path.join(job_dir, "original.tif")
    try:
        with open(input_tif, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        pages_b64 = []
        with Image.open(input_tif) as img:
            for i in range(getattr(img, 'n_frames', 1)):
                img.seek(i)
                frame = img.copy()
                if frame.mode != 'RGB':
                    frame = frame.convert('RGB')
                    
                # Redimensiona para ser leve no frontend
                width, height = frame.size
                max_w = 400
                if width > max_w:
                    ratio = max_w / width
                    frame = frame.resize((max_w, int(height * ratio)))
                    
                out_io = io.BytesIO()
                frame.save(out_io, format="JPEG", quality=75)
                b64_str = base64.b64encode(out_io.getvalue()).decode('utf-8')
                pages_b64.append(f"data:image/jpeg;base64,{b64_str}")
                
        return {"job_id": job_id, "pages": pages_b64, "filename": file.filename}
    except Exception as e:
        cleanup_job_dir(job_dir)
        return {"error": f"Erro processando TIF: {str(e)}"}

@router.post("/api/organizar-tif")
async def organizar_tif_route(
    background_tasks: BackgroundTasks,
    job_id: str = Form(...),
    page_order: str = Form(...) # Ex: "0,2,1"
):
    """Reordena o TIF com base no job_id"""
    job_dir = os.path.join(TEMP_TIF_DIR, job_id)
    if not os.path.exists(job_dir):
        return Response(content="Sessão inválida ou expirada.", status_code=400)
        
    input_tif = os.path.join(job_dir, "original.tif")
    output_tif = os.path.join(job_dir, "TIF_Organizado.tif")
    
    try:
        order = [int(x) for x in page_order.split(",") if x.strip() != ""]
        if not order:
            return Response(content="Ordem inválida.", status_code=400)
            
        with Image.open(input_tif) as img:
            new_frames = []
            for idx in order:
                if idx < getattr(img, 'n_frames', 1):
                    img.seek(idx)
                    frame = img.copy()
                    if frame.mode != 'RGB':
                        frame = frame.convert('RGB')
                    new_frames.append(frame)
                    
            if new_frames:
                new_frames[0].save(
                    output_tif,
                    save_all=True,
                    append_images=new_frames[1:],
                    format="TIFF",
                    compression="jpeg",
                    quality=80
                )
        
        await registrar_log(f"[SUCESSO] TIF Organizado via Job {job_id[:8]}")
        
        # Agendamos limpeza para ocorrer após retornar a resposta
        background_tasks.add_task(cleanup_job_dir, job_dir)
        
        return FileResponse(
            output_tif, 
            media_type='image/tiff', 
            filename="TIF_Organizado.tif"
        )
    except Exception as e:
        background_tasks.add_task(cleanup_job_dir, job_dir)
        return Response(content=f"Erro ao organizar TIF: {str(e)}", status_code=500)
