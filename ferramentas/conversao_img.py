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
    out_buffer = io.BytesIO()
    file_obj = files[0]
    original_name = file_obj.filename.replace(".pdf", "")
    
    content = await file_obj.read()
    doc = fitz.open(stream=content, filetype="pdf")

    # Mapeamento de formatos para PyMuPDF
    fmt = formato.lower()
    if fmt not in ["jpg", "jpeg", "png", "webp"]:
        fmt = "jpg"
    
    # Ajustes de qualidade
    jpg_quality = 85 if fmt in ["jpg", "jpeg"] else None

    with zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for i, page in enumerate(doc):
            # DPI 150 = Boa qualidade visual e tamanho decente
            pix = page.get_pixmap(dpi=150, alpha=(fmt=="png")) # Alpha channel para PNG
            
            if fmt in ["jpg", "jpeg"]:
                img_data = pix.tobytes("jpg", jpg_quality=jpg_quality)
            else:
                img_data = pix.tobytes(fmt)
                
            zip_file.writestr(f"{original_name}_pag_{i+1}.{fmt}", img_data)

    doc.close()
    
    # Registro de log para auditoria
    await registrar_log(f"Converteu PDF '{original_name}.pdf' para imagens ({formato.upper()})")

    return Response(
        content=out_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=Imagens_{original_name}.zip"}
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