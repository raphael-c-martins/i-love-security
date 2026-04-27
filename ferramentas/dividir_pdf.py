from fastapi import APIRouter, UploadFile, Form, Response
from typing import List
import fitz  # PyMuPDF
import io
import zipfile
from utils.logger import registrar_log

router = APIRouter()

@router.post("/api/dividir")
async def dividir_pdf(
    files: List[UploadFile], 
    ranges: str = Form(default=""),
    merge_pages: str = Form(default="false") # Recebemos o status da caixinha (true/false)
):
    out_buffer = io.BytesIO()
    file_obj = files[0]
    original_name = file_obj.filename.replace(".pdf", "")
    
    content = await file_obj.read()
    doc = fitz.open(stream=content, filetype="pdf")
    total_pages = len(doc)
    
    # 1. PROCESSAR OS INTERVALOS (Ranges)
    pages_to_extract = []
    
    if not ranges or ranges.strip() == "":
        # Se não escolheu nada, assume TODAS as páginas
        pages_to_extract = list(range(total_pages))
    else:
        # Processa "1-3, 5, 8"
        parts = ranges.split(',')
        for part in parts:
            part = part.strip()
            if '-' in part:
                try:
                    start, end = map(int, part.split('-'))
                    # Ajusta do índice humano (1) para Python (0)
                    # Garante que start é menor que end
                    safe_start = max(0, min(start, end) - 1)
                    safe_end = min(total_pages, max(start, end))
                    pages_to_extract.extend(range(safe_start, safe_end))
                except ValueError:
                    continue 
            else:
                try:
                    p = int(part) - 1
                    if 0 <= p < total_pages:
                        pages_to_extract.append(p)
                except ValueError:
                    continue
        
        # Remove duplicatas e ordena (Ex: usuario clicou na 5 depois na 1)
        pages_to_extract = sorted(list(set(pages_to_extract)))

    # Se a lista estiver vazia (erro de digitação), pega tudo
    if not pages_to_extract:
        pages_to_extract = list(range(total_pages))

    # 2. DECISÃO: JUNTAR OU SEPARAR?
    should_merge = merge_pages.lower() == 'true'

    if should_merge:
        # --- CENÁRIO A: Juntar tudo num único PDF (Comportamento antigo) ---
        new_doc = fitz.open()
        for p in pages_to_extract:
            new_doc.insert_pdf(doc, from_page=p, to_page=p)
        
        # Salva como PDF único
        new_doc.save(out_buffer)
        new_doc.close()
        
        # Registro de log para auditoria
        await registrar_log(f"Dividiu o arquivo PDF '{original_name}.pdf' (Saída: PDF Único)")

        return Response(
            content=out_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={original_name}_SELECIONADO.pdf"}
        )

    else:
        # --- CENÁRIO B: Criar um ZIP com vários arquivos (O que estava faltando) ---
        with zipfile.ZipFile(out_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for p in pages_to_extract:
                new_doc = fitz.open()
                new_doc.insert_pdf(doc, from_page=p, to_page=p)
                
                # Nome do arquivo individual: "Documento_Pagina_1.pdf"
                pdf_bytes = new_doc.tobytes()
                zip_file.writestr(f"{original_name}_pag_{p+1}.pdf", pdf_bytes)
                new_doc.close()

        # Registro de log para auditoria
        await registrar_log(f"Dividiu o arquivo PDF '{original_name}.pdf' (Saída: Arquivo ZIP)")

        return Response(
            content=out_buffer.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={original_name}_DIVIDIDO.zip"}
        )