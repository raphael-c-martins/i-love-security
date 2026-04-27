import os
import socket
import asyncio
from datetime import datetime

# Diretório base para os logs
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")

# Garante que a pasta logs existe
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

def _escrever_log(mensagem: str):
    """
    Função interna síncrona para escrita em arquivo.
    """
    agora = datetime.now()
    nome_arquivo = agora.strftime("%Y-%m-%d.log")
    caminho_arquivo = os.path.join(LOG_DIR, nome_arquivo)
    
    timestamp = agora.strftime("%H:%M:%S")
    hostname = socket.gethostname()
    
    linha_log = f"[{timestamp}] [{hostname}] {mensagem}\n"
    
    with open(caminho_arquivo, "a", encoding="utf-8") as f:
        f.write(linha_log)

async def registrar_log(mensagem: str):
    """
    Registra um log de forma assíncrona para não travar a aplicação.
    Conforme Protocolo de Engenharia Sênior (HA).
    """
    try:
        # Executa a escrita em uma thread separada para manter a interface responsiva
        await asyncio.to_thread(_escrever_log, mensagem)
    except Exception as e:
        # Em caso de erro no log, imprimimos no console para não derrubar a aplicação principal
        print(f"Erro ao registrar log: {e}")
