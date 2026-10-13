import io
import os
import uuid
import shutil
import base64
import zipfile
import asyncio
import tempfile
import urllib.parse
import gc
from fastapi import APIRouter, UploadFile, File, Form, Response, BackgroundTasks
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from typing import List
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
from utils.logger import registrar_log

router = APIRouter()

# Mapeamento de extensão de saída → formato PIL e mime type
_FORMAT_MAP = {
    "jpg":  {"pil": "JPEG", "ext": "jpg",  "mime": "image/jpeg"},
    "jpeg": {"pil": "JPEG", "ext": "jpg",  "mime": "image/jpeg"},
    "png":  {"pil": "PNG",  "ext": "png",  "mime": "image/png"},
    "webp": {"pil": "WEBP", "ext": "webp", "mime": "image/webp"},
    "bmp":  {"pil": "BMP",  "ext": "bmp",  "mime": "image/bmp"},
    "gif":  {"pil": "GIF",  "ext": "gif",  "mime": "image/gif"},
    "tiff": {"pil": "TIFF", "ext": "tif",  "mime": "image/tiff"},
    "tif":  {"pil": "TIFF", "ext": "tif",  "mime": "image/tiff"},
}

@router.post("/api/converter-imagem")
async def converter_imagem(
    files: List[UploadFile] = File(...),
    formato: str = Form(default="jpg")   # Formato de saída escolhido pelo usuário
):
    """Converte imagens em lote para o formato escolhido e retorna um ZIP."""
    # Resolve o formato — fallback seguro para JPG se vier algo inválido
    fmt_key  = formato.lower().strip()
    fmt_info = _FORMAT_MAP.get(fmt_key, _FORMAT_MAP["jpg"])
    pil_fmt  = fmt_info["pil"]   # ex: "JPEG", "PNG", "WEBP"
    out_ext  = fmt_info["ext"]   # ex: "jpg", "png"

    out_buffer = io.BytesIO()

    try:
        with zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            total_imagens_geradas = 0
            total_bytes_in = 0
            ultima_imagem_nome = None
            ultima_imagem_bytes = None

            for file_obj in files:
                original_name = file_obj.filename.rsplit('.', 1)[0]
                content = await file_obj.read()
                total_bytes_in += len(content)

                try:
                    img = Image.open(io.BytesIO(content))
                    
                    # Lógica para extrair todos os frames de TIF multi-página ou imagens animadas
                    n_frames = getattr(img, 'n_frames', 1)
                    frames = []
                    
                    # Se for GIF animado e estivermos convertendo pra GIF, não queremos quebrar frames, queremos salvar como está.
                    # Mas se a conversão for para JPG/PNG etc, quebramos nos frames.
                    if img.format == 'GIF' and pil_fmt == 'GIF':
                        frames = [img] # Salva como único pra preservar animação se PIL deixar
                    else:
                        for i in range(n_frames):
                            img.seek(i)
                            frames.append(img.copy())

                    for idx, frame in enumerate(frames):
                        # Se tiver mais de um frame, adiciona o índice no nome
                        sufixo = f"_{idx+1}" if n_frames > 1 else ""
                        nome_arquivo_final = f"{original_name}_Convertido{sufixo}.{out_ext}"
                        
                        # Conversão de modo de cor
                        if pil_fmt in ("PNG", "TIFF", "WEBP"):
                            if frame.mode not in ("RGB", "RGBA", "L", "LA", "P"):
                                frame = frame.convert("RGBA")
                        elif pil_fmt == "GIF":
                            frame = frame.convert("P")
                        else:
                            if frame.mode in ("RGBA", "P", "LA"):
                                frame = frame.convert("RGB")

                        img_buffer = io.BytesIO()

                        # Parâmetros extras de qualidade por formato
                        save_kwargs = {}
                        if pil_fmt == "JPEG":
                            save_kwargs["quality"] = 90
                        elif pil_fmt == "WEBP":
                            save_kwargs["quality"] = 88
                        elif pil_fmt == "TIFF":
                            save_kwargs["compression"] = "tiff_adobe_deflate"

                        frame.save(img_buffer, pil_fmt, **save_kwargs)
                        
                        # Guarda dados para caso seja arquivo único
                        img_bytes = img_buffer.getvalue()
                        zip_file.writestr(nome_arquivo_final, img_bytes)
                        
                        total_imagens_geradas += 1
                        ultima_imagem_nome = nome_arquivo_final
                        ultima_imagem_bytes = img_bytes

                except Exception as ex:
                    print(f"[WARN] Erro ao converter '{file_obj.filename}': {ex}")

        # Calcula os bytes de saída dependendo do cenário
        bytes_out = len(ultima_imagem_bytes) if (total_imagens_geradas == 1 and ultima_imagem_bytes) else len(out_buffer.getvalue())
        await registrar_log(
            f"[SUCESSO] Conversão de {len(files)} imagem(ns) (Gerou {total_imagens_geradas} arquivos finais) para {pil_fmt}. ({total_bytes_in} bytes -> {bytes_out} bytes)"
        )

        # Se só gerou 1 imagem no total, não precisa de ZIP
        if total_imagens_geradas == 1 and ultima_imagem_bytes:
            return Response(
                content=ultima_imagem_bytes,
                media_type=fmt_info["mime"],
                headers={
                    "Content-Disposition": f'attachment; filename="{ultima_imagem_nome}"'
                }
            )
        
        # Caso contrário, retorna o ZIP completo
        return Response(
            content=out_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=Imagens_Convertidas_{pil_fmt}.zip"
            }
        )
    except Exception as e:
        await registrar_log(f"[ERRO] Conversão de imagem falhou: {str(e)}")
        return Response(content=f"Erro ao converter imagens: {str(e)}", status_code=500)


def _cleanup_dir(d: str):
    """Remove diretório temporário de forma segura."""
    if d and os.path.exists(d):
        shutil.rmtree(d, ignore_errors=True)


def _comprimir_tif_file_sync(input_path: str, output_path: str, level: str, is_gray: bool) -> tuple[int, int, int]:
    """Processamento de compressão TIF executado em thread pool (HA).
    Evita estouro de RAM processando a partir do disco e previne SEGFAULT garantindo
    que Group4 seja aplicado exclusivamente se todos os frames forem 1-bit bilevel."""
    Image.MAX_IMAGE_PIXELS = None
    original_size = os.path.getsize(input_path)

    if level == "extreme":
        max_width = 1200
    elif level == "low":
        max_width = 2000
    else:  # recommended
        max_width = 1600

    img = Image.open(input_path)
    n_frames = getattr(img, 'n_frames', 1)
    processed_frames = []

    resample_bilinear = getattr(Image, 'BILINEAR', getattr(Image.Resampling, 'BILINEAR', 2))

    for i in range(n_frames):
        img.seek(i)
        frame = img.copy()

        # Normalização de modos e canais de cor
        if is_gray:
            if frame.mode != 'L':
                frame = frame.convert('L')
        else:
            # Preserva cores
            if frame.mode in ('RGBA', 'LA'):
                # Elimina canal alfa criando fundo branco neutro
                bg = Image.new('RGB', frame.size, (255, 255, 255))
                alpha = frame.split()[-1]
                bg.paste(frame, mask=alpha)
                frame = bg
            elif frame.mode == 'P':
                frame = frame.convert('RGB')
            elif frame.mode == 'CMYK':
                frame = frame.convert('RGB')
            elif frame.mode not in ('1', 'L', 'RGB'):
                frame = frame.convert('RGB')

        # Redimensionamento proporcional
        width, height = frame.size
        if width > max_width:
            ratio = max_width / width
            new_size = (max_width, max(1, int(height * ratio)))
            if frame.mode == '1':
                frame = frame.resize(new_size, Image.NEAREST)
            else:
                frame = frame.resize(new_size, resample_bilinear)

        processed_frames.append(frame)

    img.close()

    if not processed_frames:
        raise ValueError("Nenhum frame válido encontrado no arquivo TIF.")

    # SEGURANÇA CRÍTICA CONTRA CRASH EM C (libtiff Fax3SetupState / SIGSEGV):
    # A compressão Group 4 (CCITT Fax 4) exige obrigatoriamente 1 bit por pixel (modo '1').
    # Se algum frame for escala de cinza ('L') ou colorido ('RGB'), group4 é terminantemente proibido.
    all_bilevel = all(f.mode == '1' for f in processed_frames)

    if all_bilevel:
        candidate_compressions = ["group4", "tiff_adobe_deflate", "tiff_lzw", None]
    else:
        # Para documentos com cinza ou cor, Adobe Deflate (ZIP) oferece máxima compressão sem perdas
        candidate_compressions = ["tiff_adobe_deflate", "tiff_lzw", None]

    saved = False
    last_err = None
    for comp in candidate_compressions:
        try:
            save_kwargs = {
                "save_all": True,
                "append_images": processed_frames[1:],
                "format": "TIFF"
            }
            if comp is not None:
                save_kwargs["compression"] = comp

            processed_frames[0].save(output_path, **save_kwargs)
            saved = True
            break
        except Exception as err:
            last_err = err
            continue

    # Liberação imediata de memória
    del processed_frames
    gc.collect()

    if not saved or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError(f"Falha ao salvar TIFF comprimido: {last_err}")

    final_size = os.path.getsize(output_path)
    economy = int((1 - (final_size / original_size)) * 100) if original_size > 0 else 0

    return original_size, final_size, economy


def _comprimir_multiplos_tifs_files_sync(input_files: list[tuple[str, str]], output_zip_path: str, max_width: int):
    """Comprime múltiplos TIFs salvando diretamente no arquivo ZIP em disco."""
    Image.MAX_IMAGE_PIXELS = None
    resample_bilinear = getattr(Image, 'BILINEAR', getattr(Image.Resampling, 'BILINEAR', 2))

    with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for original_name, in_path in input_files:
            try:
                img = Image.open(in_path)
                n_frames = getattr(img, 'n_frames', 1)
                frames = []
                for i in range(n_frames):
                    img.seek(i)
                    frame = img.copy()
                    if frame.mode in ('RGBA', 'LA'):
                        bg = Image.new('RGB', frame.size, (255, 255, 255))
                        alpha = frame.split()[-1]
                        bg.paste(frame, mask=alpha)
                        frame = bg
                    elif frame.mode not in ('RGB', 'L', '1'):
                        frame = frame.convert('RGB')

                    width, height = frame.size
                    if width > max_width:
                        ratio = max_width / width
                        new_size = (max_width, max(1, int(height * ratio)))
                        if frame.mode == '1':
                            frame = frame.resize(new_size, Image.NEAREST)
                        else:
                            frame = frame.resize(new_size, resample_bilinear)
                    frames.append(frame)
                img.close()

                if frames:
                    all_bilevel = all(f.mode == '1' for f in frames)
                    comp = "group4" if all_bilevel else "tiff_adobe_deflate"
                    temp_single = in_path + "_out.tif"
                    frames[0].save(
                        temp_single,
                        save_all=True,
                        append_images=frames[1:],
                        format="TIFF",
                        compression=comp
                    )
                    zip_file.write(temp_single, arcname=f"{original_name}_Comprimido.tif")
                    if os.path.exists(temp_single):
                        os.remove(temp_single)
                    del frames
                    gc.collect()
            except Exception as ex:
                print(f"[WARN] Erro ao comprimir {original_name}: {ex}")


@router.post("/api/comprimir-tif")
async def comprimir_tif(
    files: list[UploadFile] = File(...),
    level: str = Form(default="recommended"),
    grayscale: str = Form(default="false")
):
    """Comprime arquivos TIF usando streaming em disco temporário (HA) para evitar consumo excessivo de RAM."""
    is_gray = grayscale.lower() == "true"
    temp_dir = tempfile.mkdtemp(prefix="tif_compress_")

    if level == "extreme":
        max_width = 1200
    elif level == "low":
        max_width = 2000
    else:  # recommended
        max_width = 1600

    try:
        if len(files) == 1:
            file_obj = files[0]
            original_name = file_obj.filename.rsplit('.', 1)[0]
            input_path = os.path.join(temp_dir, "input.tif")
            output_path = os.path.join(temp_dir, "output.tif")

            # Salva o upload em disco via streaming em blocos de 4MB (evita duplicar 1.25GB na RAM)
            with open(input_path, "wb") as f_out:
                while chunk := await file_obj.read(4 * 1024 * 1024):
                    f_out.write(chunk)

            original_size, final_size, economy = await asyncio.to_thread(
                _comprimir_tif_file_sync, input_path, output_path, level, is_gray
            )

            await registrar_log(
                f"[SUCESSO] TIF '{file_obj.filename}' Comprimido ({level}, gray={is_gray}). "
                f"({original_size} bytes -> {final_size} bytes, economia {economy}%)"
            )

            safe_ascii_name = original_name.encode('ascii', errors='ignore').decode('ascii').strip() or "documento"
            encoded_filename = urllib.parse.quote(f"{original_name}_Comprimido.tif")
            content_disposition = f'attachment; filename="{safe_ascii_name}_Comprimido.tif"; filename*=UTF-8\'\'{encoded_filename}'

            return FileResponse(
                path=output_path,
                media_type="image/tiff",
                headers={
                    "Content-Disposition": content_disposition,
                    "Access-Control-Expose-Headers": "X-Original-Size, X-Final-Size, X-Economy-Percent",
                    "X-Original-Size": str(original_size),
                    "X-Final-Size": str(final_size),
                    "X-Economy-Percent": str(economy)
                },
                background=BackgroundTask(_cleanup_dir, temp_dir)
            )

        else:
            input_files = []
            total_bytes_in = 0
            for idx, file_obj in enumerate(files):
                original_name = file_obj.filename.rsplit('.', 1)[0]
                in_path = os.path.join(temp_dir, f"input_{idx}.tif")
                with open(in_path, "wb") as f_out:
                    while chunk := await file_obj.read(4 * 1024 * 1024):
                        f_out.write(chunk)
                total_bytes_in += os.path.getsize(in_path)
                input_files.append((original_name, in_path))

            output_zip = os.path.join(temp_dir, "TIFs_Comprimidos.zip")
            await asyncio.to_thread(_comprimir_multiplos_tifs_files_sync, input_files, output_zip, max_width)

            bytes_out = os.path.getsize(output_zip)
            await registrar_log(f"[SUCESSO] Compressão em lote de {len(files)} TIFs. ({total_bytes_in} bytes -> {bytes_out} bytes)")

            return FileResponse(
                path=output_zip,
                media_type="application/zip",
                headers={
                    "Content-Disposition": 'attachment; filename="TIFs_Comprimidos.zip"'
                },
                background=BackgroundTask(_cleanup_dir, temp_dir)
            )

    except Exception as e:
        _cleanup_dir(temp_dir)
        await registrar_log(f"[ERRO] Compressão TIF falhou: {str(e)}")
        return Response(content=f"Erro ao comprimir TIF: {str(e)}", status_code=500)


TEMP_TIF_DIR = "ferramentas/temp_tif"


def cleanup_job_dir(path: str):
    if os.path.exists(path):
        shutil.rmtree(path)


def _gerar_preview_tif_sync(content: bytes, only_first: bool, job_id: str = None, filename: str = ""):
    Image.MAX_IMAGE_PIXELS = None
    if only_first:
        with Image.open(io.BytesIO(content)) as img:
            img.seek(0)
            frame = img.copy()
            if frame.mode != 'RGB':
                frame = frame.convert('RGB')

            width, height = frame.size
            max_w = 400
            if width > max_w:
                ratio = max_w / width
                frame = frame.resize((max_w, int(height * ratio)), Image.NEAREST)

            out_io = io.BytesIO()
            frame.save(out_io, format="JPEG", quality=70)
            b64_str = base64.b64encode(out_io.getvalue()).decode('utf-8')
            return {
                "job_id": None,
                "pages": [f"data:image/jpeg;base64,{b64_str}"],
                "filename": filename
            }

    job_dir = os.path.join(TEMP_TIF_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    input_tif = os.path.join(job_dir, "original.tif")
    with open(input_tif, "wb") as buffer:
        buffer.write(content)

    pages_b64 = []
    with Image.open(input_tif) as img:
        for i in range(getattr(img, 'n_frames', 1)):
            img.seek(i)
            frame = img.copy()
            if frame.mode != 'RGB':
                frame = frame.convert('RGB')

            width, height = frame.size
            max_w = 400
            if width > max_w:
                ratio = max_w / width
                frame = frame.resize((max_w, int(height * ratio)), Image.NEAREST)

            out_io = io.BytesIO()
            frame.save(out_io, format="JPEG", quality=70)
            b64_str = base64.b64encode(out_io.getvalue()).decode('utf-8')
            pages_b64.append(f"data:image/jpeg;base64,{b64_str}")

    return {"job_id": job_id, "pages": pages_b64, "filename": filename}


@router.post("/api/upload-tif-preview")
async def upload_tif_preview(
    file: UploadFile = File(...),
    only_first: bool = Form(default=False)
):
    """Salva TIF para reordenação e retorna miniaturas em base64 executado em thread pool (HA)."""
    try:
        content = await file.read()
        job_id = str(uuid.uuid4()) if not only_first else None
        res = await asyncio.to_thread(_gerar_preview_tif_sync, content, only_first, job_id, file.filename)
        return res
    except Exception as e:
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
            all_bw = True
            for idx in order:
                if idx < getattr(img, 'n_frames', 1):
                    img.seek(idx)
                    frame = img.copy()
                    
                    # Verificação de fidelidade: mantemos o modo original
                    if frame.mode != '1':
                        all_bw = False
                        
                    new_frames.append(frame)
                    
            if new_frames:
                # Lógica de Inteligência de Compressão:
                # 1. Se tudo for P&B (Mode 1), Group 4 mantém o tamanho original (~30MB).
                # 2. Se houver cor, Adobe Deflate preserva fidelidade sem inflar como o JPEG.
                comp = "group4" if all_bw else "tiff_adobe_deflate"
                
                new_frames[0].save(
                    output_tif,
                    save_all=True,
                    append_images=new_frames[1:],
                    format="TIFF",
                    compression=comp
                )
        
        bytes_in = os.path.getsize(input_tif)
        bytes_out = os.path.getsize(output_tif)
        await registrar_log(f"[SUCESSO] TIF Organizado via Job {job_id[:8]} ({bytes_in} bytes -> {bytes_out} bytes)")
        
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
