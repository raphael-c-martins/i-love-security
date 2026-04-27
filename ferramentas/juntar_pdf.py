from fastapi import APIRouter, UploadFile, Response
from typing import List
import fitz
import io
from datetime import datetime
from utils.logger import registrar_log

router = APIRouter()

@router.post("/api/juntar")
async def juntar_pdfs(files: List[UploadFile]):
    out_buffer = io.BytesIO()
    doc_final = fitz.open()

    nomes_entrada = []

    for file in files:
        nomes_entrada.append(file.filename)
        content = await file.read()
        # Abre cada PDF da memória
        doc_temp = fitz.open(stream=content, filetype="pdf")
        doc_final.insert_pdf(doc_temp)
        doc_temp.close()

    doc_final.save(out_buffer)
    doc_final.close()

    # Gera nome exato para sincronia com frontend
    timestamp = datetime.now().strftime("%Hh%Mm%Ss")
    final_filename = f"Junto_{timestamp}.pdf"

    # Log detalhado
    await registrar_log(f"Unificou {len(files)} PDFs. ENTRADA: {', '.join(nomes_entrada)} -> SAÍDA: {final_filename}")

    headers = {
        "Content-Disposition": f"attachment; filename={final_filename}",
        "Access-Control-Expose-Headers": "X-Filename",
        "X-Filename": final_filename
    }

    return Response(
        content=out_buffer.getvalue(),
        media_type="application/pdf",
        headers=headers
    )