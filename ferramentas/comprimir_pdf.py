import subprocess
import os
import shutil
import tempfile
import sys
from fastapi import APIRouter, UploadFile, Form, Response, HTTPException
from typing import List
from utils.logger import registrar_log

router = APIRouter()

# --- CONFIGURAÇÃO DO MOTOR ---
system_gs = shutil.which("gswin64c")
custom_gs = r"C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe"

if system_gs:
    GHOSTSCRIPT_CMD = system_gs
elif os.path.exists(custom_gs):
    GHOSTSCRIPT_CMD = custom_gs
else:
    GHOSTSCRIPT_CMD = "gswin64c"
    print("⚠️ AVISO: Ghostscript não encontrado automaticamente.")

@router.post("/api/comprimir")
async def comprimir_pdf(
    files: List[UploadFile], 
    level: str = Form(default="recommended"), 
    grayscale: str = Form(default="false")
):
    file_obj = files[0]
    original_name = file_obj.filename.replace(".pdf", "")
    
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.pdf")
    output_path = os.path.join(temp_dir, "output.pdf")

    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file_obj.file, buffer)

        # --- CONFIGURAÇÃO DE NÍVEIS ---
        
        # QFactor: Controla a qualidade visual (compressão JPEG)
        # 0.2 = Baixa qualidade (Arquivo pequeno)
        # 1.0 = Qualidade original
        
        if level == "extreme":
            target_dpi = "72"
            q_factor = "0.2" # Agressivo na compressão, mas mantendo a cor
            pdf_settings = "/screen"
        elif level == "low": 
            target_dpi = "300"
            q_factor = "0.75"
            pdf_settings = "/prepress"
        else: # recommended
            target_dpi = "150"
            q_factor = "0.45"
            pdf_settings = "/ebook"

        args = [
            GHOSTSCRIPT_CMD,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={pdf_settings}",
            
            # --- FORÇANDO O REDIMENSIONAMENTO ---
            "-dColorImageDownsampleThreshold=1.0",
            "-dGrayImageDownsampleThreshold=1.0",
            "-dMonoImageDownsampleThreshold=1.0",
            
            # --- FORÇA BRUTA PARA SCANS ---
            # Obriga a converter tudo para JPEG (DCTEncode)
            # Isso reduz drasticamente o tamanho de scans, mesmo coloridos.
            
            "-dAutoFilterColorImages=false",
            "-dColorImageFilter=/DCTEncode",
            
            "-dAutoFilterGrayImages=false",
            "-dGrayImageFilter=/DCTEncode",
            
            # Configura DPI alvo
            "-dDownsampleColorImages=true",
            f"-dColorImageResolution={target_dpi}",
            "-dColorImageDownsampleType=/Bicubic",
            
            "-dDownsampleGrayImages=true",
            f"-dGrayImageResolution={target_dpi}",
            "-dGrayImageDownsampleType=/Bicubic",
            
            "-dNOPAUSE", "-dQUIET", "-dBATCH", "-dSAFER"
        ]
        
        # --- LÓGICA DE COR CORRIGIDA ---
        # Só converte para cinza se o usuário REALMENTE PEDIU
        if grayscale.lower() == 'true':
            args.extend([
                "-sColorConversionStrategy=Gray",
                "-dProcessColorModel=/DeviceGray"
            ])

        args.append(f"-sOutputFile={output_path}")

        # --- INJEÇÃO DE POSTSCRIPT (Qualidade JPEG Manual) ---
        c_string = f"<</ColorImageDict <</QFactor {q_factor} /Blend 1 /HSamples [2 1 1 2] /VSamples [2 1 1 2]>> /GrayImageDict <</QFactor {q_factor} /Blend 1 /HSamples [2 1 1 2] /VSamples [2 1 1 2]>> >> setdistillerparams"
        
        final_args = args + ["-c", c_string, "-f", input_path]

        # Executa
        startupinfo = None
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

        process = subprocess.run(
            final_args, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            startupinfo=startupinfo
        )

        if process.returncode != 0:
            error_msg = process.stderr.decode('utf-8', errors='ignore')
            print(f"❌ Erro GS: {error_msg}")
            raise HTTPException(status_code=500, detail="Falha na compressão.")

        if not os.path.exists(output_path):
             raise HTTPException(status_code=500, detail="Arquivo não gerado.")

        # --- CÁLCULO DA VITÓRIA ---
        tamanho_original = os.path.getsize(input_path)
        tamanho_final = os.path.getsize(output_path)
        
        # Evita divisão por zero
        if tamanho_original > 0:
            economia_pct = 100 - ((tamanho_final / tamanho_original) * 100)
        else:
            economia_pct = 0

        # Formata para enviar no cabeçalho
        headers = {
            "Content-Disposition": f"attachment; filename={original_name}_OTIMIZADO.pdf",
            # A LINHA MÁGICA ABAIXO 👇
            "Access-Control-Expose-Headers": "X-Original-Size, X-Final-Size, X-Economy-Percent",
            # Nossos dados
            "X-Original-Size": str(tamanho_original),
            "X-Final-Size": str(tamanho_final),
            "X-Economy-Percent": f"{economia_pct:.1f}"
        }

        with open(output_path, "rb") as f:
            optimized_content = f.read()

        # Registro de log para auditoria
        await registrar_log(f"Comprimiu o PDF '{original_name}.pdf' (Nível: {level}, Cinza: {grayscale}). Economia: {economia_pct:.1f}%")

        return Response(
            content=optimized_content,
            media_type="application/pdf",
            headers=headers
        )

    except Exception as e:
        print(f"Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)