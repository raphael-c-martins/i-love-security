# ferramentas/conversao_pdf_tiff.py
# Módulo de conversão bidirecional PDF ↔ TIFF Multipáginas
# Um PDF de X páginas gera 1 TIFF com X frames (e vice-versa).

import io
import os
import zipfile
import asyncio
import traceback
import shutil
import urllib.parse
from fastapi import APIRouter, UploadFile, File, Response, Request
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from typing import List
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
import fitz  # PyMuPDF
from utils.logger import registrar_log
from utils.limpeza import criar_dir_temp
from utils.tiff_engine import mesclar_tiffs_streaming, inspecionar_tiff

router = APIRouter()


# ---------------------------------------------------------------------------
# Funções de processamento (síncronas) — executadas em thread pool
# ---------------------------------------------------------------------------

def _pdf_para_tiff_sync(content: bytes, dpi: int = 200) -> bytes:
    """
    Converte um PDF (bytes) em um TIFF multipáginas (bytes).
    Cada página do PDF vira um frame dentro do TIFF.
    """
    Image.MAX_IMAGE_PIXELS = None
    doc = fitz.open(stream=content, filetype="pdf")
    frames = []

    for i, page in enumerate(doc):
        try:
            pix = page.get_pixmap(dpi=dpi, alpha=False)
            # PyMuPDF sempre retorna RGB quando alpha=False
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            frames.append(img)
            del pix
        except Exception as e:
            print(f"[WARN] Erro ao rasterizar página {i+1}: {e}")

    doc.close()

    if not frames:
        raise ValueError("Nenhuma página válida encontrada no PDF.")

    # Adobe Deflate (lossless) é seguro e universal para qualquer tipo de conteúdo.
    # Evitamos Group4 aqui pois ele exige modo '1' (1-bit) e os frames vindos
    # do PyMuPDF são sempre RGB — converter para 1-bit destruiria a qualidade.
    out_buffer = io.BytesIO()
    frames[0].save(
        out_buffer,
        format="TIFF",
        save_all=True,
        append_images=frames[1:],
        compression="tiff_adobe_deflate",
    )

    return out_buffer.getvalue()


def _tiff_para_pdf_sync(content: bytes) -> bytes:
    """
    Converte um TIFF multipáginas (bytes) em um PDF (bytes).
    Cada frame do TIFF vira uma página no PDF.
    """
    Image.MAX_IMAGE_PIXELS = None
    img = Image.open(io.BytesIO(content))
    n_frames = getattr(img, "n_frames", 1)

    doc_final = fitz.open()

    for i in range(n_frames):
        try:
            img.seek(i)
            frame = img.copy()

            # Garante RGB para evitar problemas de modo de cor
            if frame.mode not in ("RGB", "L"):
                frame = frame.convert("RGB")

            # Salva o frame como JPEG temporário em memória
            # para inserir no PDF via PyMuPDF de forma direta e eficiente
            img_buffer = io.BytesIO()
            frame.save(img_buffer, format="JPEG", quality=95)

            # Insere direto na página PDF via PyMuPDF (economiza muita RAM)
            page = doc_final.new_page(width=frame.width, height=frame.height)
            rect = fitz.Rect(0, 0, frame.width, frame.height)
            page.insert_image(rect, stream=img_buffer.getvalue())

            del frame
            del img_buffer
        except Exception as e:
            print(f"[WARN] Erro ao processar frame {i+1} do TIFF: {e}")

    img.close()

    if len(doc_final) == 0:
        doc_final.close()
        raise ValueError("Nenhum frame válido encontrado no TIFF.")

    out_buffer = io.BytesIO()
    doc_final.save(out_buffer, garbage=3, deflate=True)
    doc_final.close()

    return out_buffer.getvalue()


def _juntar_tiffs_sync(contents_list: List[bytes]) -> bytes:
    """
    Recebe uma lista de conteúdos de imagens/TIFF (bytes) e mescla todas as suas páginas
    em um único arquivo TIFF multipáginas.
    """
    frames = []

    for content in contents_list:
        try:
            img = Image.open(io.BytesIO(content))
            n_frames = getattr(img, "n_frames", 1)

            for i in range(n_frames):
                img.seek(i)
                frame = img.copy()
                if frame.mode not in ("RGB", "L"):
                    frame = frame.convert("RGB")
                frames.append(frame)
        except Exception as e:
            print(f"[WARN] Erro ao extrair frame da imagem/TIFF: {e}")

    if not frames:
        raise ValueError("Nenhum frame/imagem válida foi encontrada nos arquivos enviados.")

    out_buffer = io.BytesIO()
    frames[0].save(
        out_buffer,
        format="TIFF",
        save_all=True,
        append_images=frames[1:],
        compression="tiff_adobe_deflate",
    )
    return out_buffer.getvalue()


# ---------------------------------------------------------------------------
# Rotas FastAPI
# ---------------------------------------------------------------------------

@router.post("/api/pdf-para-tif")
async def pdf_para_tif(files: List[UploadFile] = File(...)):
    """
    Converte PDF(s) em TIFF multipáginas.
    - 1 PDF → retorna 1 TIFF direto.
    - Múltiplos PDFs → retorna um ZIP com os TIFFs.
    """
    resultados = []  # (nome_arquivo, bytes_tiff)

    for file_obj in files:
        original_name = file_obj.filename or "documento"
        base_name = os.path.splitext(original_name)[0]

        try:
            content = await file_obj.read()

            if not content:
                await registrar_log(
                    f"[ERRO] PDF '{original_name}' está vazio (0 bytes recebidos)."
                )
                continue

            # Processamento pesado em thread separada (HA)
            tiff_bytes = await asyncio.to_thread(_pdf_para_tiff_sync, content)

            resultados.append((f"{base_name}.tif", tiff_bytes))

            await registrar_log(
                f"[OK] PDF '{original_name}' convertido para TIFF ({len(content)} bytes -> {len(tiff_bytes)} bytes)."
            )
        except Exception as e:
            # Log com traceback completo para diagnóstico
            tb = traceback.format_exc()
            await registrar_log(
                f"[ERRO] Falha ao converter PDF '{original_name}' para TIFF.\n"
                f"  Tipo: {type(e).__name__}\n"
                f"  Mensagem: {str(e)}\n"
                f"  Traceback:\n{tb}"
            )

    if not resultados:
        await registrar_log("[ERRO] Nenhum PDF pôde ser convertido para TIFF (0 resultados).")
        return Response(
            content="Não foi possível converter o arquivo. Verifique se o PDF é válido.",
            status_code=400,
        )

    await registrar_log(
        f"[SUCESSO] Converteu {len(resultados)} PDF(s) para TIFF multipáginas."
    )

    # Retorno inteligente: arquivo direto ou ZIP
    if len(resultados) == 1:
        nome, dados = resultados[0]
        return Response(
            content=dados,
            media_type="image/tiff",
            headers={"Content-Disposition": f'attachment; filename="{nome}"'},
        )
    else:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for nome, dados in resultados:
                zf.writestr(nome, dados)

        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": 'attachment; filename="PDFs_Convertidos_para_TIFF.zip"'
            },
        )


@router.post("/api/tif-para-pdf")
async def tif_para_pdf(files: List[UploadFile] = File(...)):
    """
    Converte TIFF(s) multipáginas em PDF(s).
    - 1 TIFF → retorna 1 PDF direto.
    - Múltiplos TIFFs → retorna um ZIP com os PDFs.
    """
    resultados = []  # (nome_arquivo, bytes_pdf)

    for file_obj in files:
        original_name = file_obj.filename or "documento"
        base_name = os.path.splitext(original_name)[0]

        try:
            content = await file_obj.read()

            if not content:
                await registrar_log(
                    f"[ERRO] TIFF '{original_name}' está vazio (0 bytes recebidos)."
                )
                continue

            # Processamento pesado em thread separada (HA)
            pdf_bytes = await asyncio.to_thread(_tiff_para_pdf_sync, content)

            resultados.append((f"{base_name}.pdf", pdf_bytes))

            await registrar_log(
                f"[OK] TIFF '{original_name}' convertido para PDF ({len(content)} bytes -> {len(pdf_bytes)} bytes)."
            )
        except Exception as e:
            # Log com traceback completo para diagnóstico
            tb = traceback.format_exc()
            await registrar_log(
                f"[ERRO] Falha ao converter TIFF '{original_name}' para PDF.\n"
                f"  Tipo: {type(e).__name__}\n"
                f"  Mensagem: {str(e)}\n"
                f"  Traceback:\n{tb}"
            )

    if not resultados:
        await registrar_log("[ERRO] Nenhum TIFF pôde ser convertido para PDF (0 resultados).")
        return Response(
            content="Não foi possível converter o arquivo. Verifique se o TIFF é válido.",
            status_code=400,
        )

    await registrar_log(
        f"[SUCESSO] Converteu {len(resultados)} TIFF(s) para PDF."
    )

    # Retorno inteligente: arquivo direto ou ZIP
    if len(resultados) == 1:
        nome, dados = resultados[0]
        return Response(
            content=dados,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{nome}"'},
        )
    else:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for nome, dados in resultados:
                zf.writestr(nome, dados)

        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": 'attachment; filename="TIFFs_Convertidos_para_PDF.zip"'
            },
        )


def _cleanup_dir(d: str):
    if d and os.path.exists(d):
        shutil.rmtree(d, ignore_errors=True)


@router.post("/api/juntar-tiffs")
async def juntar_tiffs(request: Request, files: List[UploadFile] = File(...)):
    """
    Recebe múltiplos arquivos TIF/TIFF (ou imagens) e junta todas as suas páginas
    em um único arquivo TIFF multipáginas utilizando tifffile com suporte a BigTIFF (>4GB).
    Processamento em disco e streaming assíncrono para garantir estabilidade e baixo uso de RAM.
    """
    if not files:
        return Response(content="Nenhum arquivo enviado.", status_code=400)

    ip_cliente = request.client.host if request.client else "Desconhecido"
    temp_dir = criar_dir_temp("merge_tif")

    try:
        input_paths = []
        total_bytes = 0

        for idx, f in enumerate(files):
            in_path = os.path.join(temp_dir, f"input_{idx}")
            with open(in_path, "wb") as f_out:
                while chunk := await f.read(4 * 1024 * 1024):
                    f_out.write(chunk)
            
            tamanho = os.path.getsize(in_path)
            if tamanho > 0:
                total_bytes += tamanho
                input_paths.append(in_path)

        if not input_paths:
            _cleanup_dir(temp_dir)
            return Response(content="Os arquivos enviados estão vazios.", status_code=400)

        output_path = os.path.join(temp_dir, "TIF_Juntado.tif")

        # Processamento em thread separada (HA)
        total_paginas = await asyncio.to_thread(
            mesclar_tiffs_streaming, input_paths, output_path, "deflate"
        )

        final_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0

        await registrar_log(
            f"[SUCESSO] Mesclados {len(files)} arquivos TIF ({total_paginas} páginas) em um único TIF multipáginas "
            f"({total_bytes} bytes -> {final_size} bytes) para o IP {ip_cliente}."
        )

        return FileResponse(
            path=output_path,
            media_type="image/tiff",
            headers={
                "Content-Disposition": 'attachment; filename="TIF_Juntado.tif"',
                "X-Total-Pages": str(total_paginas),
                "X-Original-Size": str(total_bytes),
                "X-Final-Size": str(final_size)
            },
            background=BackgroundTask(_cleanup_dir, temp_dir)
        )
    except Exception as e:
        _cleanup_dir(temp_dir)
        tb = traceback.format_exc()
        await registrar_log(f"[ERRO] Falha ao juntar TIFs: {str(e)}\n{tb}")
        return Response(content=f"Erro ao juntar TIFs: {str(e)}", status_code=500)


