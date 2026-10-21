# Cabeçalhos de segurança aplicados a todas as respostas.
#
# A CSP (Content Security Policy) é a garantia técnica da promessa "100% offline":
# o navegador fica proibido de carregar scripts, estilos, fontes ou fazer conexões
# com qualquer origem que não seja o próprio servidor do I Love Security.
# 'unsafe-inline' continua necessário porque a interface usa scripts inline
# (tema anti-flash e handlers onclick gerados pelos módulos), mas isso não abre
# nenhuma conexão externa.

CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
])

CABECALHOS_SEGURANCA = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}


import ipaddress

# Endereços de onde aceitamos cabeçalhos de IP repassados (o Nginx roda na mesma máquina)
PROXIES_CONFIAVEIS = {"127.0.0.1", "::1"}


def _ip_valido(valor: str):
    try:
        return str(ipaddress.ip_address(valor.strip()))
    except ValueError:
        return None


def obter_ip_cliente(request) -> str:
    """
    IP real de quem fez a requisição, para o log de auditoria.

    X-Real-IP / X-Forwarded-For só são aceitos quando a conexão vem do próprio
    proxy (loopback); qualquer outro cliente poderia forjar esses cabeçalhos.
    Do X-Forwarded-For usamos o ÚLTIMO salto (o que o Nginx adicionou), nunca o
    primeiro, que é controlado pelo navegador. Valores que não são IP são ignorados.
    """
    conexao = request.client.host if request.client else ""
    if conexao in PROXIES_CONFIAVEIS:
        real_ip = _ip_valido(request.headers.get("x-real-ip", ""))
        if real_ip:
            return real_ip
        encaminhado = request.headers.get("x-forwarded-for", "")
        if encaminhado:
            ultimo_salto = _ip_valido(encaminhado.split(",")[-1])
            if ultimo_salto:
                return ultimo_salto
    return conexao or "Local"


METODOS_SEGUROS = {"GET", "HEAD", "OPTIONS"}


def requisicao_cross_site_bloqueada(request) -> bool:
    """
    Bloqueia envios para a API disparados por OUTRO site aberto no navegador do
    usuário (CSRF). O cabeçalho Sec-Fetch-Site é definido pelo próprio navegador
    e não pode ser forjado por JavaScript; ele não depende do Host repassado
    pelo Nginx, então funciona igual atrás do proxy.
    """
    if request.method in METODOS_SEGUROS:
        return False
    if not request.url.path.startswith("/api/"):
        return False
    return request.headers.get("sec-fetch-site", "").lower() == "cross-site"


def aplicar_cabecalhos_seguranca(response) -> None:
    for nome, valor in CABECALHOS_SEGURANCA.items():
        response.headers.setdefault(nome, valor)
