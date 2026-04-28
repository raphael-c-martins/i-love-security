import io
import base64
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
        
        # O REMBG pede bytes ou PIL Image. A função remove aceita diretamente bytes e retorna bytes, 
        # ou aceita PIL Image e retorna PIL Image. Vamos passar PIL Image.
        output_img = remove(img)
        
        # Converter para base64 para retornar a imagem processada (para a UI visual) 
        # Mas como a requisição quer a resposta final para download ou preview?
        # A nova UI "Antes/Depois" espera as duas imagens em Base64 ou a UI passa o blob original.
        # A API pode retornar um JSON com a imagem resultante em base64, ou os bytes direto.
        # A melhor UX é retornar o JSON com as informações, mas se o script.js nativo 
        # for usado, ele espera um Blob. 
        # Como mudamos para a nova interface visual, ela vai esperar um JSON com base64.
        # Vamos retornar JSON com base64 para ser flexível.
        
        out_buffer = io.BytesIO()
        output_img.save(out_buffer, "PNG")
        b64_str = base64.b64encode(out_buffer.getvalue()).decode('utf-8')
        
        await registrar_log(f"[SUCESSO] Fundo removido de: {file_obj.filename} usando IA (rembg).")
        
        return {
            "success": True,
            "filename": f"{original_name}_Sem_Fundo.png",
            "image_b64": f"data:image/png;base64,{b64_str}"
        }
        
    except Exception as e:
        await registrar_log(f"[ERRO] Remover fundo falhou: {str(e)}")
        return Response(content="Erro ao processar imagem", status_code=500)
