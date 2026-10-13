import subprocess
import asyncio
import os
import shutil
import tempfile
import sys
import urllib.parse
import fitz  # PyMuPDF engine para fallback nativo
from fastapi import APIRouter, UploadFile, Form, Response, HTTPException
from typing import List
from utils.logger import registrar_log

router = APIRouter()

def get_ghostscript_cmd():
    """Busca dinamicamente o executável do Ghostscript no sistema."""
    if os.name == 'nt':
        system_gs = shutil.which("gswin64c") or shutil.which("gswin32c")
        if system_gs:
            return system_gs

        gs_dir = r"C:\Program Files\gs"
        if os.path.exists(gs_dir):
            for root, _, files in os.walk(gs_dir):
                if "gswin64c.exe" in files:
                    return os.path.join(root, "gswin64c.exe")
                if "gswin32c.exe" in files:
                    return os.path.join(root, "gswin32c.exe")
        return "gswin64c"
    else:
        system_gs = shutil.which("gs")
        return system_gs if system_gs else "gs"

GHOSTSCRIPT_CMD = get_ghostscript_cmd()

def comprimir_pdf_fitz(input_path: str, output_path: str, level: str, is_grayscale: bool) -> bool:
    """Motor de fallback de alta disponibilidade usando PyMuPDF (fitz)."""
    try:
        doc = fitz.open(input_path)
        
        if level == "extreme":
            quality = 45
            dpi = 92
        elif level == "low":
            quality = 80
            dpi = 180
        else: # recommended
            quality = 65
            dpi = 128

        for page in doc:
            # Recompressão e otimização de imagens na página
            for img_info in page.get_images(full=True):
                xref = img_info[0]
                try:
                    pix = fitz.Pixmap(doc, xref)
                    
                    # Converte para tons de cinza se solicitado
                    if is_grayscale and pix.colorspace and pix.colorspace.name != "DeviceGray":
                        pix = fitz.Pixmap(fitz.csGRAY, pix)
                        
                    # Recalcula imagens com qualidade ajustada
                    new_bytes = pix.tobytes("jpeg", quality=quality)
                    page.replace_image(xref, stream=new_bytes)
                except Exception:
                    continue

        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception as err:
        print(f"❌ Erro Fallback PyMuPDF: {err}")
        return False

@router.post("/api/comprimir")
async def comprimir_pdf(
    files: List[UploadFile], 
    level: str = Form(default="recommended"), 
    grayscale: str = Form(default="false")
):
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")
        
    file_obj = files[0]
    raw_name = file_obj.filename or "documento.pdf"
    original_name = raw_name.rsplit(".", 1)[0]
    
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.pdf")
    output_path = os.path.join(temp_dir, "output.pdf")

    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file_obj.file, buffer)

        tamanho_original = os.path.getsize(input_path)
        is_grayscale = grayscale.lower() == 'true'

        # --- CONFIGURAÇÃO DE NÍVEIS DE COMPRESSÃO ---
        if level == "extreme":
            target_dpi = "92"
            q_factor = "2.15"
            pdf_settings = "/screen"
        elif level == "low": 
            target_dpi = "180"
            q_factor = "0.7"
            pdf_settings = "/prepress"
        else: # recommended
            target_dpi = "128"
            q_factor = "1.45"
            pdf_settings = "/ebook"

        base_args = [
            GHOSTSCRIPT_CMD,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={pdf_settings}",
            "-dColorImageDownsampleThreshold=1.0",
            "-dGrayImageDownsampleThreshold=1.0",
            "-dMonoImageDownsampleThreshold=1.0",
            "-dAutoFilterColorImages=false",
            "-dColorImageFilter=/DCTEncode",
            "-dAutoFilterGrayImages=false",
            "-dGrayImageFilter=/DCTEncode",
            "-dDownsampleColorImages=true",
            f"-dColorImageResolution={target_dpi}",
            "-dColorImageDownsampleType=/Bicubic",
            "-dDownsampleGrayImages=true",
            f"-dGrayImageResolution={target_dpi}",
            "-dGrayImageDownsampleType=/Bicubic",
            "-dNOPAUSE", "-dQUIET", "-dBATCH", "-dSAFER"
        ]

        if is_grayscale:
            base_args.extend([
                "-sColorConversionStrategy=Gray",
                "-dProcessColorModel=/DeviceGray"
            ])

        base_args.append(f"-sOutputFile={output_path}")

        # --- ESTÁGIO 1: Ghostscript com Injeção de PostScript Avançada ---
        c_string = f"<</ColorImageDict <</QFactor {q_factor} /Blend 1 /HSamples [2 1 1 2] /VSamples [2 1 1 2]>> /GrayImageDict <</QFactor {q_factor} /Blend 1 /HSamples [2 1 1 2] /VSamples [2 1 1 2]>> >> setdistillerparams"
        stage1_args = base_args + ["-c", c_string, "-f", input_path]

        startupinfo = None
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

        def _run_cmd(cmd_list):
            return subprocess.run(
                cmd_list, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                startupinfo=startupinfo
            )

        success = False
        res = await asyncio.to_thread(_run_cmd, stage1_args)

        if res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            success = True
        else:
            # --- ESTÁGIO 2: Ghostscript Modo Seguro (Sem setdistillerparams) ---
            print("⚠️ Estágio 1 falhou. Tentando Estágio 2 (Ghostscript Modo Seguro)...")
            stage2_args = base_args + ["-f", input_path]
            res2 = await asyncio.to_thread(_run_cmd, stage2_args)
            if res2.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                success = True

        # --- ESTÁGIO 3: Fallback PyMuPDF (Alta Disponibilidade Nível 3) ---
        if not success:
            print("⚠️ Ghostscript falhou ou não produziu resultado. Executando Estágio 3 (PyMuPDF Engine)...")
            success = await asyncio.to_thread(comprimir_pdf_fitz, input_path, output_path, level, is_grayscale)

        if not success or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise HTTPException(status_code=500, detail="Não foi possível processar a compressão deste PDF.")

        # --- CÁLCULO DE ESTATÍSTICAS E CABEÇALHOS SEGUROS ---
        tamanho_final = os.path.getsize(output_path)
        economia_pct = 100 - ((tamanho_final / tamanho_original) * 100) if tamanho_original > 0 else 0

        # Formatação de filename RFC 5987 para prevenir erros de encode em cabeçalhos HTTP
        safe_ascii_name = original_name.encode('ascii', errors='ignore').decode('ascii').strip() or "documento"
        encoded_filename = urllib.parse.quote(f"{original_name}_OTIMIZADO.pdf")
        content_disposition = f'attachment; filename="{safe_ascii_name}_OTIMIZADO.pdf"; filename*=UTF-8\'\'{encoded_filename}'

        headers = {
            "Content-Disposition": content_disposition,
            "Access-Control-Expose-Headers": "X-Original-Size, X-Final-Size, X-Economy-Percent",
            "X-Original-Size": str(tamanho_original),
            "X-Final-Size": str(tamanho_final),
            "X-Economy-Percent": f"{economia_pct:.1f}"
        }

        with open(output_path, "rb") as f:
            optimized_content = f.read()

        await registrar_log(
            f"Comprimiu o PDF '{original_name}.pdf' (Nível: {level}, Cinza: {is_grayscale}). "
            f"Economia: {economia_pct:.1f}% ({tamanho_original} bytes -> {tamanho_final} bytes)"
        )

        return Response(
            content=optimized_content,
            media_type="application/pdf",
            headers=headers
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao comprimir PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)