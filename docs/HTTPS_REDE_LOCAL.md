# Guia Definitivo: HTTPS Válido em Rede Local / On-Premise 🔒

Este guia ensina como configurar **HTTPS seguro e 100% válido (com cadeado verde, sem avisos de 'Não Seguro')** para o **I Love Security** (ou qualquer serviço web interno) em uma rede corporativa ou homelab.

---

## 🎯 O Problema: Por que navegadores bloqueiam certificados locais?

Navegadores modernos (Google Chrome, Microsoft Edge, Firefox, Safari) exigem duas condições obrigatórias para exibir o cadeado de segurança:
1. **Cadeia de Confiança (Trust Chain):** O certificado precisa ser emitido por uma Autoridade Certificadora (CA) em que o sistema operacional do usuário confie.
2. **Subject Alternative Name (SAN):** Desde 2017, navegadores **ignoram** o campo `CN` (*Common Name*) para validação de domínio. Se o certificado não contiver explicitamente a lista de DNS e IPs no campo **SAN**, o navegador emitirá o erro `ERR_CERT_COMMON_NAME_INVALID` e bloqueará a conexão.

---

## 🛠️ Passo a Passo de Implementação

### 1. Criar o Arquivo de Configuração do OpenSSL (`openssl-san.cnf`)

Crie um arquivo chamado `openssl-san.cnf` no seu servidor Linux:

```ini
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn
req_extensions     = req_ext
x509_extensions    = v3_ca

[dn]
C  = BR
ST = Estado
L  = Cidade
O  = Minha Organizacao
OU = Tecnologia da Informacao
CN = ilovesecurity.local

[req_ext]
subjectAltName = @alt_names

[v3_ca]
subjectAltName         = @alt_names
basicConstraints       = critical, CA:true
keyUsage               = critical, digitalSignature, cRLSign, keyCertSign
extendedKeyUsage       = serverAuth

[alt_names]
DNS.1 = ilovesecurity
DNS.2 = ilovesecurity.local
DNS.3 = app.local
IP.1  = 192.168.1.100
IP.2  = 127.0.0.1
```

> 💡 **Dica:** Substitua o IP `192.168.1.100` e o DNS `ilovesecurity.local` pelos nomes e endereços reais que os seus usuários usarão para acessar o sistema.

---

### 2. Gerar a Chave Privada e o Certificado (Validade de 10 Anos)

Execute o comando OpenSSL no terminal:

```bash
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout ilovesecurity.key \
  -out ilovesecurity.crt \
  -config openssl-san.cnf
```

Isso gerará dois arquivos:
- `ilovesecurity.key`: A chave privada do servidor (**mantenha segura no servidor, com permissão `chmod 600`**).
- `ilovesecurity.crt`: O certificado público (que será distribuído aos computadores dos usuários).

Mova os arquivos para a pasta de certificados do sistema:
```bash
sudo mkdir -p /etc/nginx/ssl
sudo mv ilovesecurity.key ilovesecurity.crt /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/ilovesecurity.key
```

---

### 3. Configurar o Nginx com HSTS e Proxy Reverso

Edite o arquivo de configuração do seu site no Nginx (ex: `/etc/nginx/sites-available/default`):

```nginx
# 1. Redirecionamento forçado de HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ilovesecurity ilovesecurity.local 192.168.1.100;

    return 301 https://$host$request_uri;
}

# 2. Servidor HTTPS seguro com HSTS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ilovesecurity ilovesecurity.local 192.168.1.100;

    # Certificados SSL
    ssl_certificate /etc/nginx/ssl/ilovesecurity.crt;
    ssl_certificate_key /etc/nginx/ssl/ilovesecurity.key;

    # Protocolos e Cifras Modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS (Força o navegador a sempre usar HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Suporte a uploads massivos de arquivos (PDFs/TIFs de grande volume)
    client_max_body_size 2000M;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts estendidos para operações pesadas de compressão/IA
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

Valide e reinicie o Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 💻 4. Fazendo as Estações de Trabalho Confiarem no Certificado

Para que o aviso de "Sua conexão não é particular" desapareça para sempre, instale o arquivo `ilovesecurity.crt` nos computadores clientes.

### Opção A: Em Redes com Active Directory (Automático via GPO)
Se a sua empresa utiliza um controlador de domínio Windows Server (AD DS):

1. No servidor controlador de domínio, abra o **Gerenciamento de Política de Grupo** (`gpmc.msc`).
2. Crie ou edite uma GPO vinculada à raiz do domínio ou à Unidade Organizacional (OU) dos computadores.
3. Navegue até:
   ```
   Configuração do Computador
   └── Políticas
       └── Configurações do Windows
           └── Configurações de Segurança
               └── Diretivas de Chave Pública
                   └── Autoridades de Certificação Raiz Confiáveis
   ```
4. Clique com o botão direito $ightarrow$ **Importar**.
5. Selecione o arquivo `ilovesecurity.crt` e conclua o assistente.
6. Nas estações de trabalho, o certificado será instalado automaticamente na próxima sincronização (ou force via `gpupdate /force`).

---

### Opção B: Instalação Manual no Windows (Estações Avulsas)

1. Dê dois cliques no arquivo `ilovesecurity.crt`.
2. Clique em **Instalar Certificado...**
3. Escolha **Máquina Local** (requer privilégios de Administrador) e clique em *Avançar*.
4. Selecione: **Colocar todos os certificados no repositório a seguir**.
5. Clique em **Procurar** e selecione: **Autoridades de Certificação Raiz Confiáveis**.
6. Clique em *Avançar* e depois em *Concluir*.
7. Feche e reabra o navegador. O cadeado estará 100% seguro!

---

### Opção C: No Linux (Ubuntu / Debian)

```bash
sudo cp ilovesecurity.crt /usr/local/share/ca-certificates/ilovesecurity.crt
sudo update-ca-certificates
```

---

## ✅ Conclusão

Com essa configuração:
- Todo o tráfego interno trafega criptografado (AES-256 / TLS).
- Nenhuma ferramenta externa de sniffer captura documentos em texto claro.
- Os usuários têm a melhor experiência de uso, com links amigáveis (`https://ilovesecurity`) e zero avisos de segurança no navegador.
