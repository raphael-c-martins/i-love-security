import io
import base64
import traceback
from fastapi import APIRouter, UploadFile, File, Response
from PIL import Image
from rembg import remove
from utils.logger import registrar_log

router = APIRouter()

@router.post("/api/remover-fundo")
async def remover_fundo(files: list[UploadFile] = File(...)):
    # Pega o primeiro arquivo
    file_obj = files[0]
    original_name = file_obj.filename.rsplit('.', 1)[0]
    
    content = await file_obj.read()
    
    try:
        # Abrir imagem original
        img = Image.open(io.BytesIO(content)).convert("RGBA")
        
        # O REMBG aceita PIL Image e retorna PIL Image com fundo transparente
        output_img = remove(img)
        
        out_buffer = io.BytesIO()
        output_img.save(out_buffer, "PNG")
        b64_str = base64.b64encode(out_buffer.getvalue()).decode('utf-8')
        
        bytes_in = len(content)
        bytes_out = len(out_buffer.getvalue())
        await registrar_log(f"[SUCESSO] Fundo removido de: {file_obj.filename} usando IA (rembg). ({bytes_in} bytes -> {bytes_out} bytes)")
        
        return {
            "success": True,
            "filename": f"{original_name}_Sem_Fundo.png",
            "image_b64": f"data:image/png;base64,{b64_str}"
        }
        
    except Exception as e:
        await registrar_log(f"[ERRO] Remover fundo falhou: {str(e)}\n{traceback.format_exc()}")
        return Response(content="Erro ao processar imagem", status_code=500)
