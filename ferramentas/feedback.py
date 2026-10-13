import os
import json
from datetime import datetime
from fastapi import APIRouter, Request, Form
from fastapi.responses import JSONResponse

router = APIRouter()

FEEDBACK_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "feedbacks")

# Garante que a pasta feedbacks exista
os.makedirs(FEEDBACK_DIR, exist_ok=True)
# Cria .gitkeep para manter a pasta no git, mas ignora o conteúdo
with open(os.path.join(FEEDBACK_DIR, ".gitkeep"), "w") as f:
    pass

async def salvar_feedback(tipo: str, mensagem: str, user_agent: str = "Desconhecido"):
    """
    Salva o feedback enviado pelo usuário em um arquivo JSON.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    feedback_id = f"feedback_{timestamp}"
    
    data = {
        "id": feedback_id,
        "tipo": tipo,
        "mensagem": mensagem,
        "user_agent": user_agent,
        "data": datetime.now().isoformat()
    }
    
    file_path = os.path.join(FEEDBACK_DIR, f"{feedback_id}.json")
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True, feedback_id
    except Exception as e:
        print(f"Erro ao salvar feedback: {e}")
        return False, str(e)

from pydantic import BaseModel
from typing import Optional

class FeedbackSchema(BaseModel):
    tipo: str
    mensagem: str
    nome: Optional[str] = None
    email: Optional[str] = None

@router.post("/api/feedback")
async def receber_feedback(request: Request, feedback_data: FeedbackSchema):
    user_agent = request.headers.get('user-agent', 'Desconhecido')
    # Opcionalmente poderíamos incluir nome e email no arquivo, mas o foco é tipo e mensagem
    mensagem_completa = feedback_data.mensagem
    if feedback_data.nome:
        mensagem_completa = f"Nome: {feedback_data.nome}\n" + mensagem_completa
    if feedback_data.email:
        mensagem_completa = f"Email: {feedback_data.email}\n" + mensagem_completa
        
    sucesso, info = await salvar_feedback(feedback_data.tipo, mensagem_completa, user_agent)
    
    if sucesso:
        return JSONResponse(status_code=200, content={"success": True, "id": info})
    else:
        return JSONResponse(status_code=500, content={"success": False, "error": info})

