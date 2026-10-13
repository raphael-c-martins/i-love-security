from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from typing import Optional
from utils.logger import registrar_log

router = APIRouter()

class FrontendLog(BaseModel):
    level: str = Field(..., description="Nível do log (info, warning, error)")
    mensagem: str = Field(..., description="A mensagem de erro ou detalhe do fallback")
    detalhes: Optional[str] = Field(None, description="Stack trace ou nome do erro JS")

@router.post("/api/log-frontend")
async def receber_log_frontend(log_data: FrontendLog, request: Request):
    """
    Recebe logs críticos (falhas, fallbacks de APIs experimentais) disparados
    pelos clientes no navegador e os escreve no log de auditoria interno.
    """
    cliente_ip = request.client.host if request.client else "Desconhecido"
    
    # Formata a mensagem para o nosso auditor de SRE
    msg_auditoria = f"[FRONTEND {log_data.level.upper()}] IP {cliente_ip} - {log_data.mensagem}"
    if log_data.detalhes:
        msg_auditoria += f" | Detalhes: {log_data.detalhes}"
        
    await registrar_log(msg_auditoria)
    return {"status": "ok"}
