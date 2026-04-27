import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import PyPDF2
from utils.logger import registrar_log

router = APIRouter()

@router.post("/api/organizar")
async def organizar_pdf(
    file: UploadFile = File(...),
    page_order: str = Form(...) # Ex: "0,2,1,5" (Implying: Old Pg 0, Old Pg 2, Old Pg 1, Old Pg 5. Missing indices are deleted)
):
    try:
        # Lê o arquivo PDF original
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        pdf_writer = PyPDF2.PdfWriter()

        # Processa a ordem solicitada
        # page_order vem como string "0,1,2,..."
        indices = [int(i) for i in page_order.split(",") if i.strip()]
        
        num_pages = len(pdf_reader.pages)

        for idx in indices:
            if 0 <= idx < num_pages:
                pdf_writer.add_page(pdf_reader.pages[idx])
            else:
                print(f"Aviso: Índice de página inválido {idx} ignorado.")

        # Gera o novo PDF
        output_buffer = io.BytesIO()
        pdf_writer.write(output_buffer)
        output_buffer.seek(0)

        # Nome do arquivo de saída
        filename = file.filename.replace(".pdf", "_organizado.pdf")
        
        # Registro de log para auditoria
        await registrar_log(f"Reorganizou páginas do PDF '{file.filename}' (Saída: {filename})")

        # Retorna o PDF como stream
        return StreamingResponse(
            output_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        print(f"Erro ao organizar PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")
