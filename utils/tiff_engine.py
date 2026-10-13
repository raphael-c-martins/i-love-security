"""
utils/tiff_engine.py
Mecanismo de alta performance para manipulação de arquivos TIFF e BigTIFF (>4GB)
utilizando a biblioteca especializada tifffile (Christoph Gohlke).
Projetado para operações resilientes de alta disponibilidade (HA) e baixo consumo de memória RAM.
"""

import os
import gc
from typing import List, Dict, Any, Optional
import numpy as np
import tifffile
from PIL import Image


def inspecionar_tiff(caminho_ou_arquivo: str) -> Dict[str, Any]:
    """
    Inspeciona os metadados e a estrutura de um arquivo TIFF em microssegundos sem carregar
    pixels na memória RAM. Suporta arquivos TIFF clássicos e BigTIFF (>4GB).
    """
    try:
        with tifffile.TiffFile(caminho_ou_arquivo) as tif:
            n_pages = len(tif.pages)
            is_bigtiff = getattr(tif, 'is_bigtiff', False)
            
            pages_info = []
            for idx, page in enumerate(tif.pages):
                shape = page.shape  # Ex: (H, W) ou (H, W, C)
                h = shape[0] if len(shape) >= 1 else 0
                w = shape[1] if len(shape) >= 2 else 0
                channels = shape[2] if len(shape) >= 3 else 1
                
                pages_info.append({
                    "page": idx + 1,
                    "width": w,
                    "height": h,
                    "channels": channels,
                    "dtype": str(page.dtype),
                    "compression": str(getattr(page, 'compression', 'unknown'))
                })
                # Inspeciona no máximo os 10 primeiros para não gerar overhead em arquivos com milhares de páginas
                if idx >= 10:
                    break

            return {
                "valido": True,
                "n_pages": n_pages,
                "is_bigtiff": is_bigtiff,
                "pages_sample": pages_info
            }
    except Exception as e:
        return {
            "valido": False,
            "erro": str(e),
            "n_pages": 0,
            "is_bigtiff": False
        }


def mesclar_tiffs_streaming(caminhos_entrada: List[str], caminho_saida: str, compression: str = "deflate") -> int:
    """
    Mescla múltiplos arquivos TIFF em um único arquivo de saída utilizando streaming
    e suporte nativo a BigTIFF (eliminando o limite de 4GB do formato TIFF clássico).
    Consumo de memória RAM constante e previsível página por página.
    
    Retorna o número total de páginas mescladas.
    """
    total_paginas = 0

    with tifffile.TiffWriter(caminho_saida, bigtiff=True) as writer:
        for arq_path in caminhos_entrada:
            if not os.path.exists(arq_path) or os.path.getsize(arq_path) == 0:
                continue

            try:
                with tifffile.TiffFile(arq_path) as tif:
                    for page in tif.pages:
                        arr = page.asarray()
                        
                        # Normalização para formatos padrão de documento
                        if arr.ndim == 2:
                            # 2D Grayscale ou Bilevel
                            writer.write(arr, photometric='minisblack', compression=compression)
                        elif arr.ndim == 3 and arr.shape[2] in (3, 4):
                            # RGB ou RGBA
                            if arr.shape[2] == 4:
                                # Converte RGBA para RGB neutro se necessário
                                arr = arr[:, :, :3]
                            writer.write(arr, photometric='rgb', compression=compression)
                        else:
                            writer.write(arr, compression=compression)

                        total_paginas += 1
                        del arr
            except Exception:
                # Fallback resiliente usando Pillow se o tifffile encontrar compressão proprietária
                try:
                    with Image.open(arq_path) as img:
                        n_frames = getattr(img, 'n_frames', 1)
                        for f_idx in range(n_frames):
                            img.seek(f_idx)
                            frame = img.copy()
                            if frame.mode not in ('RGB', 'L', '1'):
                                frame = frame.convert('RGB')
                            arr = np.array(frame)
                            photo = 'rgb' if frame.mode == 'RGB' else 'minisblack'
                            writer.write(arr, photometric=photo, compression=compression)
                            total_paginas += 1
                            del frame
                            del arr
                except Exception as ex_pil:
                    print(f"[WARN] Falha ao processar {arq_path} no mesclar: {ex_pil}")

            gc.collect()

    return total_paginas
