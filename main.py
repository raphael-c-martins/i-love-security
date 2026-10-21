# --- I LOVE SECURITY ---
# Este servidor roda localmente garantindo 100% de privacidade.
# Para rodar o servidor de forma simplificada, basta dar
# um duplo clique no arquivo 'iniciar-servidor-local.bat' na
# raiz do projeto e escolher a opção [1].
# A interface do servidor será suprimida no terminal.
# Para desligar, abra o .bat e escolha a opção [2].
# -----------------------------

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

# IMPORTAÇÃO CORRIGIDA (Usando underlines em vez de hífens)
from ferramentas import juntar_pdf, dividir_pdf, comprimir_pdf, conversao_img, conversao_word, organizar_pdf, remover_fundo, ferramentas_imagem, conversao_pdf_tiff, feedback, logs_frontend
from utils.limpeza import limpar_temps_do_sistema
from fastapi.responses import PlainTextResponse
from utils.seguranca import aplicar_cabecalhos_seguranca, requisicao_cross_site_bloqueada, obter_ip_cliente

# Intervalo da varredura de arquivos temporários esquecidos (15 minutos)
INTERVALO_LIMPEZA_SEGUNDOS = 15 * 60


async def _executar_limpeza():
    """Apaga originais de usuários que ficaram em disco além do prazo."""
    try:
        jobs = await asyncio.to_thread(ferramentas_imagem.limpar_jobs_expirados)
        temps = await asyncio.to_thread(limpar_temps_do_sistema)
        if jobs or temps:
            await registrar_log(f"[LIMPEZA] Temporários expirados removidos: {jobs} job(s) de TIF, {temps} pasta(s) temporária(s).")
    except Exception as e:
        print(f"Erro na limpeza de temporários: {e}")


async def _loop_limpeza():
    while True:
        await _executar_limpeza()
        await asyncio.sleep(INTERVALO_LIMPEZA_SEGUNDOS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    tarefa = asyncio.create_task(_loop_limpeza())
    try:
        yield
    finally:
        tarefa.cancel()


app = FastAPI(lifespan=lifespan)

# Sem CORSMiddleware: interface e API são servidas pela mesma origem, então
# nenhum outro site precisa (nem deve) conseguir ler as respostas desta API.

from fastapi import Request
from utils.logger import client_ip_var, registrar_log

@app.middleware("http")
async def log_client_ip(request: Request, call_next):
    # IP real do cliente: cabeçalhos do Nginx só são aceitos quando a conexão vem do próprio proxy
    ip = obter_ip_cliente(request)

    # Seta o IP no contexto atual e guarda o token para resetar depois
    token = client_ip_var.set(ip)
    try:
        if requisicao_cross_site_bloqueada(request):
            await registrar_log(f"[SEGURANCA] Envio de outro site bloqueado (CSRF): {request.method} {request.url.path}")
            response = PlainTextResponse("Requisição de outro site bloqueada.", status_code=403)
        else:
            response = await call_next(request)
        aplicar_cabecalhos_seguranca(response)
        return response
    finally:
        client_ip_var.reset(token)

# Apontando para a pasta VISUAL
app.mount("/visual", StaticFiles(directory="visual"), name="visual")

# Conectando os módulos (Note os underlines aqui também)
app.include_router(juntar_pdf.router)
app.include_router(dividir_pdf.router)
app.include_router(comprimir_pdf.router)
app.include_router(conversao_img.router)
app.include_router(conversao_word.router)
app.include_router(organizar_pdf.router)
app.include_router(remover_fundo.router)
app.include_router(ferramentas_imagem.router)
app.include_router(conversao_pdf_tiff.router)
app.include_router(feedback.router)
app.include_router(logs_frontend.router)

@app.get("/health")
async def health_check():
    """Endpoint de Health Check para monitoramento de disponibilidade (HA)."""
    return {"status": "ok"}

@app.get("/")
async def read_index():
    from fastapi.responses import FileResponse
    return FileResponse('index.html')

@app.get("/imagens")
async def read_imagens():
    from fastapi.responses import FileResponse
    return FileResponse('imagens.html')

@app.get("/tif")
async def read_tif():
    from fastapi.responses import FileResponse
    return FileResponse('tif.html')

@app.get("/tif/{tool_slug}")
async def read_tif_tool(tool_slug: str):
    """Rota direta para ferramentas da suíte TIF (ex: /tif/recortar, /tif/comprimir)."""
    from fastapi.responses import FileResponse
    return FileResponse('tif.html')

@app.get("/imagens/{tool_slug}")
async def read_imagens_tool(tool_slug: str):
    """Rota direta para ferramentas da suíte de Imagens (ex: /imagens/remover-fundo)."""
    from fastapi.responses import FileResponse
    return FileResponse('imagens.html')

@app.get("/pdf/{tool_slug}")
async def read_pdf_tool(tool_slug: str):
    """Rota direta para ferramentas de PDF com prefixo /pdf/."""
    from fastapi.responses import FileResponse
    return FileResponse('index.html')

# Rotas diretas amigáveis na raiz para ferramentas de PDF
ROOT_PDF_SLUGS = [
    "juntar", "juntar-pdf",
    "dividir", "dividir-pdf",
    "comprimir", "comprimir-pdf",
    "organizar", "organizar-pdf",
    "pdf-imagem", "pdf-para-imagem",
    "pdf-word", "pdf-para-word",
    "pdf-tiff", "pdf-para-tiff"
]

for _slug in ROOT_PDF_SLUGS:
    @app.get(f"/{_slug}")
    async def read_root_pdf_slug():
        from fastapi.responses import FileResponse
        return FileResponse('index.html')

if __name__ == "__main__":
    import sys
    port = 8001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    uvicorn.run(app, host="0.0.0.0", port=port)