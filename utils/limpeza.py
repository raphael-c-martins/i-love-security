import os
import time
import shutil
import tempfile

# Prefixo dos diretórios temporários criados pelo I Love Security na pasta temp do sistema.
# Permite varrer apenas o que é nosso, sem tocar em arquivos de outros programas.
PREFIXO_TEMP = "ils_"

# Arquivos de usuário não devem ficar em disco além deste prazo (2 horas)
VALIDADE_TEMP_SEGUNDOS = 2 * 60 * 60


def criar_dir_temp(nome: str) -> str:
    """Cria um diretório temporário identificável pela varredura de limpeza."""
    return tempfile.mkdtemp(prefix=f"{PREFIXO_TEMP}{nome}_")


def limpar_temps_do_sistema(validade_segundos: int = VALIDADE_TEMP_SEGUNDOS, base: str = None) -> int:
    """
    Remove diretórios temporários nossos que sobraram de processamentos
    interrompidos (queda do servidor, conexão abortada). Retorna quantos removeu.
    """
    base = base or tempfile.gettempdir()
    agora = time.time()
    removidos = 0
    try:
        nomes = os.listdir(base)
    except OSError:
        return 0

    for nome in nomes:
        if not nome.startswith(PREFIXO_TEMP):
            continue
        caminho = os.path.join(base, nome)
        if not os.path.isdir(caminho) or os.path.islink(caminho):
            continue
        try:
            idade = agora - os.path.getmtime(caminho)
        except OSError:
            continue
        if idade > validade_segundos:
            shutil.rmtree(caminho, ignore_errors=True)
            removidos += 1
    return removidos
