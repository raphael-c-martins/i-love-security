"""
Testes do Recortar TIF com a opção de separar cada página em um arquivo.

Rodar a partir da raiz do projeto:
    python -m unittest discover -s tests -v
"""
import io
import os
import sys
import zipfile
import unittest

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RAIZ)

from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from ferramentas import ferramentas_imagem
from test_seguranca import BaseIsolada


def _tif_bytes(paginas: int = 3, modo: str = "L", dpi=(300, 300)) -> bytes:
    frames = [Image.new(modo, (40, 40), color=(i % 2) if modo == "1" else i * 60) for i in range(paginas)]
    buf = io.BytesIO()
    frames[0].save(buf, format="TIFF", save_all=True, append_images=frames[1:], dpi=dpi)
    return buf.getvalue()


class TestRecortarTifSeparado(BaseIsolada):

    def setUp(self):
        super().setUp()
        app = FastAPI()
        app.include_router(ferramentas_imagem.router)
        self.client = TestClient(app)

    def _enviar(self, conteudo: bytes) -> str:
        r = self.client.post(
            "/api/upload-tif-preview",
            files={"file": ("doc.tif", conteudo, "image/tiff")},
            data={"only_first": "false"},
        )
        self.assertEqual(r.status_code, 200)
        return r.json()["job_id"]

    def _recortar(self, job_id, ordem, separar="true", nome_base="Contrato Social"):
        return self.client.post("/api/organizar-tif", data={
            "job_id": job_id, "page_order": ordem, "separar": separar, "nome_base": nome_base,
        })

    def test_separar_gera_zip_com_um_tif_por_pagina(self):
        job_id = self._enviar(_tif_bytes(5))
        r = self._recortar(job_id, "0,2,4")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers["content-type"], "application/zip")
        self.assertEqual(r.headers["x-total-files"], "3")

        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            nomes = zf.namelist()
            self.assertEqual(nomes, [
                "Contrato Social_pagina_001.tif",
                "Contrato Social_pagina_003.tif",
                "Contrato Social_pagina_005.tif",
            ])
            for nome in nomes:
                with Image.open(io.BytesIO(zf.read(nome))) as img:
                    self.assertEqual(getattr(img, "n_frames", 1), 1)
                    # DPI original preservada (documentos escaneados)
                    self.assertEqual(tuple(round(v) for v in img.info["dpi"]), (300, 300))

        # O original do usuário é apagado após a entrega
        self.assertFalse(os.path.exists(os.path.join(ferramentas_imagem.TEMP_TIF_DIR, job_id)))

    def test_sem_separar_continua_entregando_um_tif(self):
        job_id = self._enviar(_tif_bytes(4))
        r = self._recortar(job_id, "1,3", separar="false")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers["content-type"], "image/tiff")
        with Image.open(io.BytesIO(r.content)) as img:
            self.assertEqual(getattr(img, "n_frames", 1), 2)
            self.assertEqual(tuple(round(v) for v in img.info["dpi"]), (300, 300))

    def test_paginas_pb_mantem_group4(self):
        job_id = self._enviar(_tif_bytes(2, modo="1"))
        r = self._recortar(job_id, "0,1")
        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            for nome in zf.namelist():
                with Image.open(io.BytesIO(zf.read(nome))) as img:
                    self.assertEqual(img.info.get("compression"), "group4")

    def test_nome_base_malicioso_nao_cria_pastas_no_zip(self):
        job_id = self._enviar(_tif_bytes(2))
        r = self._recortar(job_id, "0,1", nome_base='..\\..\\pasta/<arq>:"x"')
        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            for nome in zf.namelist():
                self.assertNotIn("/", nome)
                self.assertNotIn("\\", nome)
                self.assertNotIn("..", nome)
                for c in '<>:"|?*':
                    self.assertNotIn(c, nome)

    def test_pagina_repetida_nao_sobrescreve_no_zip(self):
        job_id = self._enviar(_tif_bytes(3))
        r = self._recortar(job_id, "1,1")
        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            self.assertEqual(len(zf.namelist()), 2)
            self.assertEqual(len(set(zf.namelist())), 2)

    def test_selecao_invalida_retorna_400_e_mantem_arquivo(self):
        job_id = self._enviar(_tif_bytes(2))
        for ordem in ("7,9", "-1", "abc"):
            r = self._recortar(job_id, ordem)
            self.assertEqual(r.status_code, 400, ordem)
        # O usuário ainda pode corrigir a seleção e tentar de novo
        self.assertTrue(os.path.isdir(os.path.join(ferramentas_imagem.TEMP_TIF_DIR, job_id)))
        self.assertEqual(self._recortar(job_id, "0").status_code, 200)

    def test_nome_base_seguro(self):
        f = ferramentas_imagem.nome_base_seguro
        self.assertEqual(f("Escritura Nº 123"), "Escritura Nº 123")
        self.assertEqual(f("../../etc/passwd"), "passwd")
        self.assertEqual(f("C:\\Users\\x\\doc"), "doc")
        self.assertEqual(f(""), "TIF")
        self.assertEqual(f("..."), "TIF")
        self.assertLessEqual(len(f("a" * 500)), 100)


if __name__ == "__main__":
    unittest.main()
