# I Love Security 🛡️❤️
> **Privacy-First Local Document & Image Processing Suite**  
> *Sua suíte completa para edição, conversão e otimização de PDFs, TIFs e Imagens — 100% offline e privada.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Zero Data Leak](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)]()

---

## 🛡️ O Manifesto da Privacidade

Em um mundo onde dados sensíveis, contratos e documentos corporativos são diariamente enviados para servidores e nuvens de terceiros, o **I Love Security** nasceu para ser a resposta definitiva em **soberania de dados**.

- **Zero Data Leak**: Nenhum byte do seu arquivo sai da sua rede local ou da sua máquina.
- **Soberania Absoluta**: Você tem controle integral sobre o hardware e o software que processam suas informações.
- **Alta Performance**: Sem latência de upload ou download para a internet. Tudo é executado na velocidade máxima do seu processador e disco local.
- **Arquitetura Multi-OS**: Totalmente compatível com **Windows**, **Linux** e ambientes conteinerizados via **Docker**.

---

## ✨ Funcionalidades

O sistema oferece três suítes completas de alta densidade operacional:

### 📄 1. PDF Master
- **Juntar PDFs**: Una múltiplos documentos com reordenação dinâmica.
- **Dividir PDFs**: Separe por intervalos, páginas avulsas ou extraia páginas específicas.
- **Comprimir PDFs**: Otimização via Ghostscript com múltiplos níveis de redução mantendo a legibilidade.
- **Organizar Páginas**: Grade visual interativa com miniaturas, rotação e exclusão de páginas antes de salvar.
- **Conversão Segura**:
  - PDF $\leftrightarrow$ Imagens (JPG/PNG)
  - PDF $\leftrightarrow$ Word (DOCX $\rightarrow$ PDF e vice-versa via motor headless local)
  - PDF $\leftrightarrow$ TIFF Multipáginas (transforma um PDF de $N$ páginas em 1 arquivo TIFF com $N$ frames e vice-versa).

### 🖼️ 2. TIF Suite & Motores Avançados (BigTIFF)
- **Preview Client-Side Instantâneo (UTIF.js)**: Renderização instantânea de miniaturas TIFF diretamente no navegador via JavaScript/Canvas, sem tráfego redundante de rede.
- **Motor BigTIFF de Alta Performance (tifffile)**: Capacidade de manipular arquivos gigantes (> 4 GB) e mesclagem em streaming contínuo sem estouro de memória RAM.
- **Recorte Cirúrgico de Intervalos**: Extraia intervalos precisos de páginas de arquivos TIF massivos (ex: `1-5, 8, 12-20`).
- **Compressão Inteligente**: Detecção automática de canais (1-bit Fax Group4 para P&B vs Deflate/LZW para coloridos).

### 🎨 3. Image Lab & IA Local
- **Removedor de Fundo com IA**: Recorte automatizado de objetos executado 100% localmente por modelo de machine learning (sem chamadas a APIs pagas ou externas).
- **Modo Studio**: Ajuste fino com pincel mágico manual, borracha de restauração, zoom de precisão até 15x e navegação via Pan (Espaço + Drag).
- **Conversão em Lote**: Conversão simultânea e padronização de imagens para JPG/PNG/WebP.

---

## ⚡ Experiência do Usuário (UX/UI & SRE)

- **HUD com Stepper Sequencial de 3 Fases**: Acompanhe o ciclo de vida da operação com métricas reais:
  1. *Upload/Envio*: Percentual, volume transferido (`MB/GB`), velocidade (`MB/s`) e cálculo de tempo restante (`ETA`).
  2. *Processamento no Servidor*: Cronômetro ativo, barra animada e estimativa contextual para arquivos pesados.
  3. *Conclusão & Gravação*: Notificação imediata de sucesso e acionamento da gravação.
- **Super Save As**: Integração com a *File System Access API* do navegador. Grava o arquivo diretamente no local desejado do disco, preservando o nome original do arquivo de entrada.
- **Proteção Anti-Missclick**: Cancelamento com dupla confirmação e reversão temporizada automática para prevenir abortos acidentais em arquivos volumosos.
- **Rotas SPA Diretas**: URLs próprias e compartilháveis para cada ferramenta (ex: `/tif/recortar`, `/imagens/remover-fundo`, `/pdf/comprimir`), com transições fluidas via HTML5 History API.
- **Dark Mode Nativo**: Tema escuro institucional e sóbrio com persistência via `localStorage`.

---

## 🚀 Como Executar

### Opção 1: Via Docker (Recomendado para Servidores e Homelab)

A forma mais rápida e padronizada de subir o ambiente completo com todas as dependências de sistema (Ghostscript e LibreOffice Headless):

```bash
# 1. Clone o repositório
git clone https://github.com/raphael-c-martins/i-love-security.git
cd i-love-security

# 2. Inicie o container
docker compose up -d
```

Acesse no seu navegador: **`http://localhost:8001`** (ou no IP do seu servidor).

---

### Opção 2: No Windows (Sem Docker)

1. Tenha o **Python 3.10+** instalado.
2. Dê dois cliques no arquivo:
   ```cmd
   iniciar-servidor-local.bat
   ```
3. O console gerencia a criação automática do `.venv`, instalação de dependências e inicia o servidor em segundo plano abrindo o navegador automaticamente em `http://localhost:8001`.

---

### Opção 3: No Linux / Debian / Ubuntu (Instalação Nativa)

```bash
# 1. Instale as dependências de sistema para compressão e conversão
sudo apt update && sudo apt install -y ghostscript libreoffice-writer libreoffice-nogui

# 2. Crie e ative um ambiente virtual
python3 -m venv .venv
source .venv/bin/activate

# 3. Instale os requisitos Python
pip install --upgrade pip
pip install -r requirements.txt

# 4. Inicie o servidor
uvicorn main:app --host 0.0.0.0 --port 8001
```

---

---

## 🔐 Como Configurar HTTPS Válido na Rede Local (Zero Avisos de 'Não Seguro')

Se você deseja disponibilizar o **I Love Security** para sua equipe ou empresa com conexões seguras criptografadas (HTTPS), links amigáveis (ex: `https://ilovesecurity`) e o cadeado verde ativo em todos os navegadores, criamos um guia passo a passo completo:

👉 **[Consulte o Guia de HTTPS On-Premise (Nginx + SAN + GPO)](docs/HTTPS_REDE_LOCAL.md)**

O tutorial aborda:
- Geração de certificados autoassinados de 10 anos com suporte obrigatório a **SAN (*Subject Alternative Name*)**.
- Configuração do **Nginx como proxy reverso com HSTS** e suporte a uploads massivos.
- Distribuição de confiança automática nas estações de trabalho via **Política de Grupo (GPO) do Active Directory** ou instalação manual no Windows e Linux.

## 🔒 Auditoria e Boas Práticas

- **Sem persistência indevida**: Arquivos temporários gerados durante o processamento são sanitizados e apagados.
- **Logs de Auditoria**: Registros locais salvos na pasta `/logs/` para monitoramento de volume trafegado e desempenho.
- **Canal de Feedback**: Caixa de sugestões com escrita assíncrona isolada na pasta `/feedbacks/`.

---

## 📄 Licença

Este projeto é distribuído sob os termos da licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**I Love Security** — *Porque a melhor segurança é aquela que você controla.* 🔐
