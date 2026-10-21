"""
Testes de regressão das correções de segurança e privacidade.

Rodar a partir da raiz do projeto:
    python -m unittest discover -s tests -v

Usam apenas pastas temporárias: nunca tocam em logs/, feedbacks/ ou
ferramentas/temp_tif/ reais.
"""
import io
import os
import sys
import time
import uuid
import shutil
import tempfile
import unittest

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RAIZ)

from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
from fastapi.testclient import TestClient
from PIL import Image

import utils.logger as logger
import utils.limpeza as limpeza
from utils.seguranca import aplicar_cabecalhos_seguranca, requisicao_cross_site_bloqueada, obter_ip_cliente
from ferramentas import ferramentas_imagem, feedback, logs_frontend


class BaseIsolada(unittest.TestCase):
    """Redireciona logs, feedbacks e temp_tif para uma pasta temporária."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="ils_teste_")
        self._orig = {
            "log": logger.LOG_DIR,
            "tif": ferramentas_imagem.TEMP_TIF_DIR,
            "fb": feedback.FEEDBACK_DIR,
        }
        logger.LOG_DIR = os.path.join(self.tmp, "logs")
        os.makedirs(logger.LOG_DIR)
        ferramentas_imagem.TEMP_TIF_DIR = os.path.join(self.tmp, "temp_tif")
        os.makedirs(ferramentas_imagem.TEMP_TIF_DIR)
        feedback.FEEDBACK_DIR = os.path.join(self.tmp, "feedbacks")
        os.makedirs(feedback.FEEDBACK_DIR)

    def tearDown(self):
        logger.LOG_DIR = self._orig["log"]
        ferramentas_imagem.TEMP_TIF_DIR = self._orig["tif"]
        feedback.FEEDBACK_DIR = self._orig["fb"]
        shutil.rmtree(self.tmp, ignore_errors=True)


def _tif_bytes(paginas: int = 3) -> bytes:
    frames = [Image.new("L", (40, 40), color=i * 60) for i in range(paginas)]
    buf = io.BytesIO()
    frames[0].save(buf, format="TIFF", save_all=True, append_images=frames[1:])
    return buf.getvalue()


class TestOrganizarTif(BaseIsolada):
    """Falha corrigida: job_id do navegador permitia apagar qualquer pasta (rmtree)."""

    def setUp(self):
        super().setUp()
        app = FastAPI()
        app.include_router(ferramentas_imagem.router)
        self.client = TestClient(app)
        self.vitima = os.path.join(self.tmp, "pasta_vitima")
        os.makedirs(self.vitima)
        with open(os.path.join(self.vitima, "importante.txt"), "w", encoding="utf-8") as f:
            f.write("não apagar")

    def _organizar(self, job_id):
        return self.client.post("/api/organizar-tif", data={"job_id": job_id, "page_order": "0"})

    def test_caminho_absoluto_nao_apaga_pasta(self):
        r = self._organizar(self.vitima)
        self.assertEqual(r.status_code, 400)
        self.assertTrue(os.path.exists(os.path.join(self.vitima, "importante.txt")))

    def test_caminho_relativo_com_pontos_nao_apaga_pasta(self):
        relativo = os.path.relpath(self.vitima, ferramentas_imagem.TEMP_TIF_DIR)
        for job_id in (relativo, "../pasta_vitima", "..", "../..", "./"):
            r = self._organizar(job_id)
            self.assertEqual(r.status_code, 400, job_id)
        self.assertTrue(os.path.exists(os.path.join(self.vitima, "importante.txt")))

    def test_uuid_inexistente_retorna_400(self):
        self.assertEqual(self._organizar(str(uuid.uuid4())).status_code, 400)

    def test_resolver_job_dir_aceita_somente_uuid(self):
        self.assertIsNone(ferramentas_imagem.resolver_job_dir("../x"))
        self.assertIsNone(ferramentas_imagem.resolver_job_dir(self.vitima))
        self.assertIsNone(ferramentas_imagem.resolver_job_dir("1234"))
        job = str(uuid.uuid4())
        self.assertEqual(
            ferramentas_imagem.resolver_job_dir(job),
            os.path.join(ferramentas_imagem.TEMP_TIF_DIR, job),
        )

    def test_cleanup_ignora_pasta_fora_do_temp_tif(self):
        ferramentas_imagem.cleanup_job_dir(self.vitima)
        self.assertTrue(os.path.exists(self.vitima))

    def test_fluxo_completo_organiza_e_apaga_original(self):
        r = self.client.post(
            "/api/upload-tif-preview",
            files={"file": ("doc.tif", _tif_bytes(3), "image/tiff")},
            data={"only_first": "false"},
        )
        self.assertEqual(r.status_code, 200)
        dados = r.json()
        self.assertEqual(len(dados["pages"]), 3)
        job_dir = os.path.join(ferramentas_imagem.TEMP_TIF_DIR, dados["job_id"])
        self.assertTrue(os.path.isdir(job_dir))

        r = self.client.post("/api/organizar-tif", data={"job_id": dados["job_id"], "page_order": "2,0"})
        self.assertEqual(r.status_code, 200)
        with Image.open(io.BytesIO(r.content)) as img:
            self.assertEqual(getattr(img, "n_frames", 1), 2)
        # O original do usuário não pode ficar em disco depois da entrega
        self.assertFalse(os.path.exists(job_dir))


class TestLimpezaTemporarios(BaseIsolada):
    """Falha corrigida: originais abandonados ficavam em disco indefinidamente."""

    def _criar(self, base, nome, idade_segundos):
        caminho = os.path.join(base, nome)
        os.makedirs(caminho)
        with open(os.path.join(caminho, "original.tif"), "wb") as f:
            f.write(b"x")
        antigo = time.time() - idade_segundos
        os.utime(caminho, (antigo, antigo))
        return caminho

    def test_jobs_expirados_sao_removidos_e_recentes_mantidos(self):
        base = ferramentas_imagem.TEMP_TIF_DIR
        velho = self._criar(base, str(uuid.uuid4()), 3 * 60 * 60)
        novo = self._criar(base, str(uuid.uuid4()), 60)
        removidos = ferramentas_imagem.limpar_jobs_expirados()
        self.assertEqual(removidos, 1)
        self.assertFalse(os.path.exists(velho))
        self.assertTrue(os.path.exists(novo))

    def test_varredura_do_temp_so_remove_pastas_do_projeto(self):
        base = os.path.join(self.tmp, "temp_sistema")
        os.makedirs(base)
        nosso_velho = self._criar(base, "ils_merge_tif_abc", 3 * 60 * 60)
        nosso_novo = self._criar(base, "ils_tif_compress_def", 60)
        de_outro_programa = self._criar(base, "outro_programa_xyz", 3 * 60 * 60)
        removidos = limpeza.limpar_temps_do_sistema(base=base)
        self.assertEqual(removidos, 1)
        self.assertFalse(os.path.exists(nosso_velho))
        self.assertTrue(os.path.exists(nosso_novo))
        self.assertTrue(os.path.exists(de_outro_programa))

    def test_criar_dir_temp_usa_prefixo(self):
        d = limpeza.criar_dir_temp("teste")
        try:
            self.assertTrue(os.path.basename(d).startswith(limpeza.PREFIXO_TEMP))
        finally:
            shutil.rmtree(d, ignore_errors=True)


class TestCabecalhosECsrf(unittest.TestCase):
    """CSP bloqueia recursos externos; envios de outros sites são recusados."""

    def setUp(self):
        app = FastAPI()

        @app.middleware("http")
        async def mw(request: Request, call_next):
            if requisicao_cross_site_bloqueada(request):
                response = PlainTextResponse("bloqueado", status_code=403)
            else:
                response = await call_next(request)
            aplicar_cabecalhos_seguranca(response)
            return response

        @app.get("/")
        async def raiz():
            return {"ok": True}

        @app.post("/api/teste")
        async def api():
            return {"ok": True}

        self.client = TestClient(app)

    def test_csp_restringe_ao_proprio_servidor(self):
        csp = self.client.get("/").headers["content-security-policy"]
        self.assertIn("default-src 'self'", csp)
        self.assertIn("connect-src 'self'", csp)
        self.assertNotIn("http", csp)
        self.assertNotIn("unsafe-eval", csp)

    def test_cabecalhos_basicos(self):
        h = self.client.get("/").headers
        self.assertEqual(h["x-content-type-options"], "nosniff")
        self.assertEqual(h["referrer-policy"], "no-referrer")
        self.assertNotIn("access-control-allow-origin", h)

    def test_post_de_outro_site_e_bloqueado(self):
        r = self.client.post("/api/teste", headers={"Sec-Fetch-Site": "cross-site"})
        self.assertEqual(r.status_code, 403)

    def test_post_da_propria_origem_e_permitido(self):
        for valor in ("same-origin", "none", None):
            headers = {"Sec-Fetch-Site": valor} if valor else {}
            self.assertEqual(self.client.post("/api/teste", headers=headers).status_code, 200, valor)


class TestIpCliente(unittest.TestCase):
    """O IP do log de auditoria não pode ser forjado por cabeçalhos do navegador."""

    def _req(self, conexao, headers=None):
        class Cliente:
            host = conexao

        class Req:
            pass

        r = Req()
        r.client = Cliente() if conexao else None
        r.headers = {k.lower(): v for k, v in (headers or {}).items()}
        return r

    def test_cabecalhos_ignorados_se_nao_vier_do_proxy(self):
        r = self._req("192.168.0.50", {"X-Forwarded-For": "10.0.0.1", "X-Real-IP": "10.0.0.2"})
        self.assertEqual(obter_ip_cliente(r), "192.168.0.50")

    def test_atras_do_proxy_usa_x_real_ip(self):
        r = self._req("127.0.0.1", {"X-Real-IP": "192.168.0.77", "X-Forwarded-For": "1.1.1.1, 192.168.0.77"})
        self.assertEqual(obter_ip_cliente(r), "192.168.0.77")

    def test_atras_do_proxy_usa_ultimo_salto_do_forwarded_for(self):
        # O primeiro valor é controlado pelo navegador; o último foi adicionado pelo Nginx
        r = self._req("127.0.0.1", {"X-Forwarded-For": "6.6.6.6, 192.168.0.77"})
        self.assertEqual(obter_ip_cliente(r), "192.168.0.77")

    def test_valor_que_nao_e_ip_e_ignorado(self):
        r = self._req("127.0.0.1", {"X-Real-IP": "1.2.3.4\n[SUCESSO] linha forjada"})
        self.assertEqual(obter_ip_cliente(r), "127.0.0.1")

    def test_sem_cliente(self):
        self.assertEqual(obter_ip_cliente(self._req(None)), "Local")


class TestValidacaoEntradas(BaseIsolada):
    """Feedback e log do frontend com limites de tamanho e sem injeção de linhas."""

    def setUp(self):
        super().setUp()
        app = FastAPI()
        app.include_router(feedback.router)
        app.include_router(logs_frontend.router)
        self.client = TestClient(app)

    def test_feedback_valido_gera_arquivos_distintos(self):
        corpo = {"tipo": "sugestao", "mensagem": "Mensagem de teste válida, com acentuação."}
        r1 = self.client.post("/api/feedback", json=corpo)
        r2 = self.client.post("/api/feedback", json=corpo)
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        self.assertNotEqual(r1.json()["id"], r2.json()["id"])
        self.assertEqual(len(os.listdir(feedback.FEEDBACK_DIR)), 2)

    def test_feedback_invalido_e_recusado(self):
        casos = [
            {"tipo": "qualquer", "mensagem": "Mensagem com tamanho ok"},
            {"tipo": "bug", "mensagem": "curta"},
            {"tipo": "bug", "mensagem": "x" * 5001},
            {"tipo": "bug", "mensagem": "Mensagem com tamanho ok", "nome": "n" * 121},
        ]
        for corpo in casos:
            self.assertEqual(self.client.post("/api/feedback", json=corpo).status_code, 422, corpo)
        self.assertEqual(os.listdir(feedback.FEEDBACK_DIR), [])

    def test_log_frontend_nao_injeta_linhas(self):
        r = self.client.post("/api/log-frontend", json={
            "level": "error",
            "mensagem": "falha\n[00:00:00] [IP: 1.2.3.4] [SUCESSO] linha forjada",
        })
        self.assertEqual(r.status_code, 200)
        arquivos = os.listdir(logger.LOG_DIR)
        with open(os.path.join(logger.LOG_DIR, arquivos[0]), encoding="utf-8") as f:
            linhas = f.read().strip().splitlines()
        self.assertEqual(len(linhas), 1)

    def test_log_frontend_com_limites(self):
        self.assertEqual(self.client.post("/api/log-frontend", json={"level": "debug", "mensagem": "x"}).status_code, 422)
        self.assertEqual(self.client.post("/api/log-frontend", json={"level": "info", "mensagem": "x" * 1001}).status_code, 422)


if __name__ == "__main__":
    unittest.main()
