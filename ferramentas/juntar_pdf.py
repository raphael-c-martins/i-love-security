from fastapi import APIRouter, UploadFile, Response, HTTPException
from typing import List
import fitz
import io
from datetime import datetime
from utils.logger import registrar_log

router = APIRouter()

@router.post("/api/juntar")
async def juntar_pdfs(files: List[UploadFile]):
    try:
        out_buffer = io.BytesIO()
        doc_final = fitz.open()

        nomes_entrada = []

        total_bytes_in = 0
        for file in files:
            nomes_entrada.append(file.filename)
            content = await file.read()
            total_bytes_in += len(content)
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
        bytes_out = len(out_buffer.getvalue())
        await registrar_log(f"Unificou {len(files)} PDFs. ENTRADA: {', '.join(nomes_entrada)} -> SAÍDA: {final_filename} ({total_bytes_in} bytes -> {bytes_out} bytes)")

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

    except Exception as e:
        await registrar_log(f"[ERRO] Falha ao juntar PDFs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao juntar PDFs: {str(e)}")