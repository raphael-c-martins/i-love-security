from fastapi import APIRouter, UploadFile, Response
from typing import List
from utils.logger import registrar_log
from pdf2docx import Converter
import os
import tempfile
import subprocess
import asyncio
import fitz
import docx
from docx.shared import Inches

# Imports condicionais para Windows
if os.name == 'nt':
    import pythoncom  # Necessário para COM em threads no Windows
    import winreg
    import win32com.client
    from docx2pdf import convert
else:
    pythoncom = None
    winreg = None
    win32com = None
    convert = None

router = APIRouter()

# --- ROTA 1: PDF PARA WORD (DOCX) ---
@router.post("/api/pdf-para-word")
async def pdf_para_word(files: List[UploadFile]):
    file_obj = files[0]
    original_name = file_obj.filename.replace(".pdf", "")
    
    file_content = await file_obj.read()
    bytes_in = len(file_content)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
        tmp_pdf.write(file_content)
        tmp_pdf_path = tmp_pdf.name

    tmp_pdf_path = os.path.abspath(tmp_pdf_path)
    tmp_docx_path = os.path.abspath(tmp_pdf_path.replace(".pdf", ".docx"))

    def is_pdf_corrupted(pdf_path):
        try:
            doc = fitz.open(pdf_path)
            texto_total = ""
            for i in range(min(3, len(doc))):
                texto_total += doc[i].get_text()
            
            if not texto_total:
                return False
                
            unprintable = sum(1 for c in texto_total if not c.isprintable() and c not in '\n\r\t')
            ratio = unprintable / len(texto_total)
            
            return ratio > 0.05 # Se > 5% lixo, é corrompido
        except UnicodeEncodeError:
            return True
        except Exception:
            return False

    def rasterize_pdf_to_docx(pdf_path, docx_path):
        doc = docx.Document()
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(0.5)
            section.bottom_margin = Inches(0.5)
            section.left_margin = Inches(0.5)
            section.right_margin = Inches(0.5)

        pdf = fitz.open(pdf_path)
        for page in pdf:
            pix = page.get_pixmap(dpi=150)
            img_path = pdf_path.replace(".pdf", f"_page_{page.number}.jpg")
            pix.save(img_path)
            doc.add_picture(img_path, width=Inches(7.2))
            os.remove(img_path)
        doc.save(docx_path)

    def disable_pdf_warning():
        if os.name != 'nt':
            return
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Office\16.0\Word\Options")
            winreg.SetValueEx(key, "DisableConvertPdfWarning", 0, winreg.REG_DWORD, 1)
            winreg.CloseKey(key)
        except Exception as e:
            print(f"Erro ao configurar registro para Word: {e}")

    word = None
    try:
        # Verifica se o arquivo está quebrado estruturalmente (camada de texto corrompida)
        if is_pdf_corrupted(tmp_pdf_path):
            print("Detectado PDF corrompido. Iniciando fallback via rasterização (Image->Word).")
            rasterize_pdf_to_docx(tmp_pdf_path, tmp_docx_path)
        else:
            if os.name == 'nt':
                disable_pdf_warning()
                pythoncom.CoInitialize()
                
                # DispatchEx garante uma nova instância isolada que não conflita com Word aberto do usuário
                word = win32com.client.DispatchEx("Word.Application")
                word.Visible = False
                word.DisplayAlerts = False
                
                # Abre o PDF forçando a leitura sem caixas de diálogo
                doc = word.Documents.Open(tmp_pdf_path, ConfirmConversions=False, ReadOnly=True)
                doc.SaveAs2(tmp_docx_path, FileFormat=16) # 16 = wdFormatDocumentDefault
                doc.Close()
                word.Quit()
                word = None
            else:
                # No Linux, usa pdf2docx
                cv = Converter(tmp_pdf_path)
                cv.convert(tmp_docx_path, start=0, end=None)
                cv.close()

        with open(tmp_docx_path, "rb") as f:
            docx_content = f.read()

    except Exception as e:
        print(f"Erro na conversão PDF->Word via COM: {e}")
        return Response(content=f"Erro na conversão: {str(e)}", status_code=500)

    finally:
        try:
            if os.name == 'nt' and word:
                word.Quit()
        except Exception:
            pass
        if os.name == 'nt':
            pythoncom.CoUninitialize()
        
        if os.path.exists(tmp_pdf_path): os.remove(tmp_pdf_path)
        if os.path.exists(tmp_docx_path): os.remove(tmp_docx_path)

    # Registro de log para auditoria
    bytes_out = len(docx_content)
    await registrar_log(f"Converteu PDF '{original_name}.pdf' para Word (.docx) ({bytes_in} bytes -> {bytes_out} bytes)")

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
    file_content = await file_obj.read()
    bytes_in = len(file_content)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp_docx:
        tmp_docx.write(file_content)
        tmp_docx_path = os.path.abspath(tmp_docx.name)

    tmp_pdf_path = tmp_docx_path.replace(".docx", ".pdf")

    try:
        if os.name == 'nt':
            # Inicializa COM para esta thread (crítico no Windows/FastAPI)
            pythoncom.CoInitialize()
            
            # Converte
            convert(tmp_docx_path, tmp_pdf_path)
        else:
            # Converte usando LibreOffice no Linux (thread separada para HA)
            diretorio_saida = os.path.dirname(tmp_docx_path)
            cmd = ['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir', diretorio_saida, tmp_docx_path]

            def _run_libreoffice():
                return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)

            process = await asyncio.to_thread(_run_libreoffice)
            if process.returncode != 0:
                error_msg = process.stderr.decode('utf-8', errors='ignore')
                print(f"❌ Erro LibreOffice: {error_msg}")
                raise Exception(f"Erro no LibreOffice (código {process.returncode}): {error_msg}")
            
            if not os.path.exists(tmp_pdf_path):
                raise Exception("LibreOffice converteu o arquivo, mas o PDF de saída não foi gerado.")
        
        with open(tmp_pdf_path, "rb") as f:
            pdf_content = f.read()

    except Exception as e:
        print(f"Erro na conversão Word->PDF: {e}")
        return Response(content=str(e), status_code=500)
        
    finally:
        # Limpeza
        if os.path.exists(tmp_docx_path): os.remove(tmp_docx_path)
        if os.path.exists(tmp_pdf_path): os.remove(tmp_pdf_path)
        if os.name == 'nt':
            pythoncom.CoUninitialize()

    # Registro de log para auditoria
    bytes_out = len(pdf_content)
    await registrar_log(f"Converteu Word '{original_name}.docx' para PDF ({bytes_in} bytes -> {bytes_out} bytes)")

    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={original_name}.pdf"}
    )
