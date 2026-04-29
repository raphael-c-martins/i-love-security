from fastapi import APIRouter, UploadFile, Response, Form
from typing import List
from utils.logger import registrar_log
import fitz  # PyMuPDF
from pdf2docx import Converter # Biblioteca nova para o Word
import io
import zipfile
import os
import tempfile

router = APIRouter()

# --- ROTA 1: PDF PARA IMAGEM (JPG, PNG, WEBP) ---
@router.post("/api/pdf-para-jpg")
async def pdf_para_imagem(
    files: List[UploadFile], 
    formato: str = Form(default="jpg") # jpg, png, webp
):
    # Mapeamento de formatos e MIME types
    fmt = formato.lower().strip()
    if fmt not in ["jpg", "jpeg", "webp"]:
        fmt = "jpg"
    
    mime_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp"
    }
    mime_type = mime_types.get(fmt, "image/jpeg")
    
    # Ajustes de qualidade
    jpg_quality = 85 if fmt in ["jpg", "jpeg"] else None
    
    # Lista para armazenar as imagens geradas: (nome_arquivo, bytes)
    imagens_geradas = []
    nomes_pdfs_processados = []

    for file_obj in files:
        original_filename = file_obj.filename
        nomes_pdfs_processados.append(original_filename)
        base_name = os.path.splitext(original_filename)[0]
        
        content = await file_obj.read()
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            
            for i, page in enumerate(doc):
                # DPI 150 = Boa qualidade visual e tamanho decente
                pix = page.get_pixmap(dpi=150, alpha=False)
                
                if fmt in ["jpg", "jpeg"]:
                    img_data = pix.tobytes("jpg", jpg_quality=jpg_quality)
                else:
                    img_data = pix.tobytes(fmt)
                
                # Se for apenas 1 página e apenas 1 arquivo, o nome é limpo.
                # Se tiver mais páginas ou mais arquivos, adicionamos contexto ao nome.
                if len(files) == 1 and doc.page_count == 1:
                    nome_final = f"{base_name}.{fmt}"
                else:
                    # Se o PDF tem múltiplas páginas, indica a página
                    sufixo_pag = f"_pag_{i+1}" if doc.page_count > 1 else ""
                    nome_final = f"{base_name}{sufixo_pag}.{fmt}"
                
                imagens_geradas.append((nome_final, img_data))
            
            doc.close()
        except Exception as e:
            await registrar_log(f"[ERRO] Falha ao ler PDF '{original_filename}': {str(e)}")

    # Registro de log consolidado
    await registrar_log(f"Converteu {len(files)} PDF(s) ({', '.join(nomes_pdfs_processados)}) para {len(imagens_geradas)} imagens {fmt.upper()}")

    # Decisão de Retorno: Arquivo Único vs ZIP
    if len(imagens_geradas) == 1:
        nome_arquivo, dados = imagens_geradas[0]
        return Response(
            content=dados,
            media_type=mime_type,
            headers={"Content-Disposition": f'attachment; filename="{nome_arquivo}"'}
        )
    else:
        # Se houver mais de uma imagem, retorna um ZIP
        out_buffer = io.BytesIO()
        with zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for nome, dados in imagens_geradas:
                zip_file.writestr(nome, dados)
        
        # Nome do ZIP baseado no primeiro arquivo ou genérico
        zip_name = f"Imagens_{os.path.splitext(files[0].filename)[0]}.zip" if len(files) == 1 else "Imagens_Convertidas.zip"
        
        return Response(
            content=out_buffer.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={zip_name}"}
        )

# --- ROTA REMOVIDA: PDF PARA WORD (Movida para conversao_word.py) ---
# O código antigo foi removido para evitar conflitos de rota.

# --- ROTA 3: JPG PARA PDF (Futuro) ---
@router.post("/api/jpg-para-pdf")
async def jpg_para_pdf(files: List[UploadFile]):
    out_buffer = io.BytesIO()
    doc_final = fitz.open()

    for file in files:
        content = await file.read()
        # Abre a imagem da memória
        img_doc = fitz.open(stream=content, filetype="jpeg") # fitz detecta tipo, mas hint ajuda
        
        # Converte para PDF (in-memory)
        pdf_bytes = img_doc.convert_to_pdf()
        img_pdf = fitz.open("pdf", pdf_bytes)
        
        # Insere no documento final
        doc_final.insert_pdf(img_pdf)
        
        img_doc.close()
        img_pdf.close()

    doc_final.save(out_buffer)
    doc_final.close()

    # Registro de log para auditoria
    await registrar_log(f"Converteu {len(files)} imagens para PDF unificado")

    return Response(
        content=out_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Imagens_Unificadas.pdf"}
    )