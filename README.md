# I Love Security 🛡️❤️

**I Love Security** é uma plataforma open-source desenvolvida para processamento local de documentos, garantindo que a sua privacidade e a segurança dos seus dados venham em primeiro lugar. Em um mundo onde dados sensíveis são frequentemente processados em nuvens de terceiros, o **I Love Security** oferece uma alternativa 100% offline e local.

## 🛡️ O Manifesto da Privacidade

O foco deste projeto é rodar exclusivamente dentro da infraestrutura da sua empresa ou na sua máquina pessoal. 
- **Zero Data Leak**: Nenhum byte do seu arquivo PDF ou imagem sai da sua rede local.
- **Sovereignty**: Você tem controle total sobre o hardware e o software que processa seus dados.
- **Performance**: Sem latência de upload/download para servidores externos. Tudo é processado na velocidade do seu hardware local.

## 🚀 Funcionalidades Atuais

O sistema oferece uma suíte completa de ferramentas de manipulação de PDF e imagens:

- **PDF Master**: Juntar, dividir, comprimir e organizar páginas de PDF.
- **Image Lab & IA**:
    - **Removedor de Fundo IA**: Recorte cirúrgico de objetos via Inteligência Artificial (local/offline) com visualizador "Antes e Depois" e **Ferramenta de Edição Manual** (Pincel Mágico de Apagar/Restaurar com cursor visual de precisão).
    - **Conversão em Lote**: Converter múltiplas imagens para JPG simultaneamente.
- **TIF Suite**: Módulo dedicado para compressão inteligente e organização visual de arquivos TIF corporativos.
- **Conversão Segura**: 
    - PDF para Imagem (JPG/PNG) e vice-versa.
    - PDF para Word e Word para PDF (via processamento local).
- **Auditabilidade**: Logs granulares persistidos localmente para auditoria de segurança interna.

## 🏗️ Estrutura do Projeto

A arquitetura foi desenhada seguindo princípios de **Engenharia de SRE** e **Alta Disponibilidade (HA)**:

- **Backend (Python/FastAPI)**: Localizado na raiz, o `main.py` gerencia o motor de processamento via APIs assíncronas.
- **Frontend (Vanilla JS/CSS)**: Uma interface de alta densidade (UX) focada em produtividade, utilizando estética Glassmorphism.
- **Segurança Defensiva**: Proteção nativa contra injeções e sanitização rigorosa de inputs.

## 🛠 Como Executar (Modo On-Premise)

### 1. Pré-requisitos
- **Python 3.10+**: Certifique-se de ter o Python instalado.
- **Bibliotecas**: O sistema utiliza IA local. Para instalar todas as dependências de uma vez, abra o terminal na pasta do projeto e rode:
  ```bash
  python -m pip install --upgrade pip
  pip install -r requirements.txt
  ```

### 2. Ativação
A aplicação foi projetada para rodar em background (servidor invisível), garantindo que a ferramenta esteja sempre disponível sem atrapalhar o fluxo de trabalho.

1. **Start**: Execute o arquivo `iniciar_sistema.bat`.
2. **Descoberta Inteligente**: O sistema detecta automaticamente o IP da sua rede local (LAN), permitindo que outros colegas acessem a ferramenta via intranet.
3. **Acesso**: 
   - Local: `http://localhost:8001`
   - Intranet: `http://[SEU_IP_LOCAL]:8001`

## 🌐 Deploy Corporativo (DNS Local)

Para empresas que desejam profissionalizar o acesso, recomenda-se:
1. Configurar um **IP Fixo** no servidor local.
2. Mapear a porta `8001` para a porta `80` no `main.py` (para acesso sem número de porta).
3. Criar uma entrada no **DNS do Active Directory (AD)** (ex: `http://seguranca.empresa.local`).

---

**I Love Security** - Porque a melhor segurança é aquela que você controla. 🔐
