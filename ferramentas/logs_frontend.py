from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from typing import Literal, Optional
from utils.logger import registrar_log

router = APIRouter()

class FrontendLog(BaseModel):
    level: Literal["info", "warning", "error"] = Field(..., description="Nível do log")
    mensagem: str = Field(..., max_length=1000, description="A mensagem de erro ou detalhe do fallback")
    detalhes: Optional[str] = Field(None, max_length=4000, description="Stack trace ou nome do erro JS")


def _linha_unica(texto: str) -> str:
    """Impede que o navegador injete linhas falsas no log de auditoria."""
    # split() sem argumentos quebra em qualquer espaço em branco, inclusive quebras de linha
    return " ".join(texto.split())

@router.post("/api/log-frontend")
async def receber_log_frontend(log_data: FrontendLog, request: Request):
    """
    Recebe logs críticos (falhas, fallbacks de APIs experimentais) disparados
    pelos clientes no navegador e os escreve no log de auditoria interno.
    """
    cliente_ip = request.client.host if request.client else "Desconhecido"

    # Formata a mensagem para o nosso auditor de SRE
    msg_auditoria = f"[FRONTEND {log_data.level.upper()}] IP {cliente_ip} - {_linha_unica(log_data.mensagem)}"
    if log_data.detalhes:
        msg_auditoria += f" | Detalhes: {_linha_unica(log_data.detalhes)}"

    await registrar_log(msg_auditoria)
    return {"status": "ok"}
