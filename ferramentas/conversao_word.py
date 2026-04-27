from fastapi import APIRouter, UploadFile, Response
from typing import List
from utils.logger import registrar_log
from pdf2docx import Converter
from docx2pdf import convert
import os
import tempfile
import pythoncom  # Necessário para COM em threads no Windows

router = APIRouter()

# --- ROTA 1: PDF PARA WORD (DOCX) ---
@router.post("/api/pdf-para-word")
async def pdf_para_word(files: List[UploadFile]):
    file_obj = files[0]
    original_name = file_obj.filename.replace(".pdf", "")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
        tmp_pdf.write(await file_obj.read())
        tmp_pdf_path = tmp_pdf.name

    tmp_docx_path = tmp_pdf_path.replace(".pdf", ".docx")

    try:
        cv = Converter(tmp_pdf_path)
        cv.convert(tmp_docx_path)
        cv.close()

        with open(tmp_docx_path, "rb") as f:
            docx_content = f.read()

    finally:
        if os.path.exists(tmp_pdf_path): os.remove(tmp_pdf_path)
        if os.path.exists(tmp_docx_path): os.remove(tmp_docx_path)

    # Registro de log para auditoria
    await registrar_log(f"Converteu PDF '{original_name}.pdf' para Word (.docx)")

    return Response(
        content=docx_content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={original_name}.docx"}
    )

# --- ROTA 2: WORD (DOCX) PARA PDF ---
@router.post("/api/word-para-pdf")
async def word_para_pdf(files: List[UploadFile]):
    file_obj = files[0]
    original_name = file_obj.filename.replace(".docx", "")
    
    # docx2pdf requer caminhos absolutos no Windows
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp_docx:
        tmp_docx.write(await file_obj.read())
        tmp_docx_path = os.path.abspath(tmp_docx.name)

    tmp_pdf_path = tmp_docx_path.replace(".docx", ".pdf")

    try:
        # Inicializa COM para esta thread (crítico no Windows/FastAPI)
        pythoncom.CoInitialize()
        
        # Converte
        convert(tmp_docx_path, tmp_pdf_path)
        
        with open(tmp_pdf_path, "rb") as f:
            pdf_content = f.read()

    except Exception as e:
        print(f"Erro na conversão Word->PDF: {e}")
        return Response(content=str(e), status_code=500)
        
    finally:
        # Limpeza
        if os.path.exists(tmp_docx_path): os.remove(tmp_docx_path)
        if os.path.exists(tmp_pdf_path): os.remove(tmp_pdf_path)
        pythoncom.CoUninitialize()

    # Registro de log para auditoria
    await registrar_log(f"Converteu Word '{original_name}.docx' para PDF")

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={original_name}.pdf"}
    )
