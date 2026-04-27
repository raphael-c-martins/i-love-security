# --- I LOVE SECURITY ---
# Este servidor roda localmente garantindo 100% de privacidade.
# Para rodar o servidor de forma simplificada, basta dar
# um duplo clique no arquivo 'iniciar_sistema.bat' na
# raiz do projeto e escolher a opção [1].
# A interface do servidor será suprimida no terminal.
# Para desligar, abra o .bat e escolha a opção [2].
# -----------------------------

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# IMPORTAÇÃO CORRIGIDA (Usando underlines em vez de hífens)
from ferramentas import juntar_pdf, dividir_pdf, comprimir_pdf, conversao_img, conversao_word, organizar_pdf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apontando para a pasta VISUAL
app.mount("/visual", StaticFiles(directory="visual"), name="visual")

# Conectando os módulos (Note os underlines aqui também)
app.include_router(juntar_pdf.router)
app.include_router(dividir_pdf.router)
app.include_router(comprimir_pdf.router)
app.include_router(conversao_img.router)
app.include_router(conversao_word.router)
app.include_router(organizar_pdf.router)

@app.get("/")
async def read_index():
    from fastapi.responses import FileResponse
    return FileResponse('index.html')

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)