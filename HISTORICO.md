# Histórico e Diário de Decisões Arquiteturais (I Love Security) 🔐

## [29/04/2026] - Refatoração do Conversor PDF para Imagem (Batch & Smart Delivery)
- **Problema:** 
  1. Bug no processamento em lote: apenas o primeiro arquivo da lista era convertido.
  2. Experiência de usuário (UX) sub-otimizada: o sistema forçava o download em .zip mesmo para conversões de arquivo único.
- **Solução:** 
  - **Processamento em Lote Real:** Refatoração da rota `/api/pdf-para-jpg` para iterar sobre todos os arquivos da `List[UploadFile]`.
  - **Entrega Inteligente (Smart Delivery):** Implementação de lógica condicional no backend para retornar o arquivo bruto (raw image) se o resultado for apenas 1 imagem, ou um ZIP se houver múltiplas.
  - **Remoção do PNG:** Opção removida do conversor de PDF para evitar resultados inconsistentes de transparência; o fluxo recomendado agora é converter para JPG/WebP e usar o removedor de fundo dedicado.
  - **Expansão de Layout:** Aumentada a largura máxima da interface (max-w-7xl) para reduzir a sensação de "espremido" e otimizar o uso da tela.
  - **Miniaturas Reais (Thumbnails):** Implementada renderização dinâmica da primeira página de cada PDF na lista de seleção usando `pdf.js`, permitindo identificação visual imediata dos arquivos antes da conversão.
  - **Nomenclatura Dinâmica:** O sistema agora extrai e utiliza o nome original do arquivo (ex: `TESTE.pdf` -> `TESTE.jpg`) em vez de gerar nomes com timestamp no arquivo individual.
  - **Logging de Auditoria:** Adicionado log consolidado que identifica todos os nomes de arquivos processados e o total de imagens geradas.
- **Resultado:** Maior estabilidade na conversão em lote e uma interface mais profissional para conversões rápidas de documentos únicos.


## [28/04/2026] - Estabilização do Modo Studio e UX de Alta Precisão
- **Problema:** Interferência entre as ferramentas de edição (pincel) e navegação (pan). O usuário acabava desenhando acidentalmente ao tentar reposicionar a imagem com zoom.
- **Solução:** Implementação de arquitetura de estados para navegação:
  - **Navegação Inteligente:** Suporte a Zoom (Scroll) e Pan (Espaço + Mouse Drag).
  - **Bloqueio de Conflito:** O pincel de edição é desativado automaticamente quando a tecla Espaço está pressionada ou o sistema detecta movimentação de tela.
  - **Feedback Visual (Cursor Adaptativo):** 
    - O cursor do pincel agora escala visualmente junto com o zoom, mantendo a percepção real do tamanho do traço.
    - Troca dinâmica de cursor para `grab` durante a movimentação para reforçar o contexto de navegação.
- **Resultado:** Experiência de edição nível "Photoshop" dentro do navegador, permitindo ajustes cirúrgicos em resoluções extremas sem erros de interface.


## [28/04/2026] - Correção do "BO" de Tamanho TIF (Inflação de Bits)
- **Problema:** Arquivos TIF de 30MB (P&B) explodiam para 1.4GB após organização/compressão.
- **Causa:** Conversão forçada para RGB (24-bit) e uso de compressão JPEG inadequada para documentos.
- **Solução:** Implementação de motor de compressão inteligente:
  - Uso de **CCITT Group 4** para arquivos puramente P&B (preserva tamanho original).
  - Uso de **Adobe Deflate (Lossless)** para arquivos mistos/coloridos (garante fidelidade absoluta).
  - Remoção de conversões de modo desnecessárias.
- **Resultado:** Arquivos organizados agora mantêm o tamanho original ou menor, com 100% de fidelidade visual.

## [28/04/2026] - Modularização por Páginas e Correção de Navegação
- **Problema:** Ao usar ferramentas complexas (como o Recorte), a navegação por botões (SPA-like) não conseguia resetar o estado da interface nem redirecionar o usuário corretamente.
- **Solução:** Reestruturação da aplicação de SPA para estrutura Multi-Página (MPA).
- **Mudanças Técnicas:**
  - Criação de `imagens.html` e `tif.html` como arquivos independentes.
  - Substituição de botões de categoria por links `<a>` reais na navegação.
  - Atualização do `main.py` (FastAPI) para servir as novas rotas `/imagens` e `/tif`.
  - Descentralização da inicialização do `script.js`, permitindo que cada página defina sua categoria padrão no carregamento.
- **Benefício:** Garantia de isolamento total entre as ferramentas ("Sala" vs "Cozinha"), correção definitiva do bug de navegação no modo recorte e melhor organização de arquivos.

## [28/04/2026] - Expansão para Suíte de Imagens e Integração de IA (Rembg)
- **Motivo:** Transformar a plataforma de um utilitário de PDF em uma ferramenta completa de manipulação de mídia corporativa.
- **Implementação:**
  1. **Navegação por Categorias:** Refatoração do Header para permitir navegação entre contextos (PDF, Imagens, TIF).
  2. **Removedor de Fundo IA:** Integração da biblioteca `rembg` (U-2-Net) para remoção de fundos 100% offline.
  3. **Visualizador Antes/Depois:** Implementada UI interativa com slider (CSS `clip-path`) para comparação em tempo real.
  4. **Pincel Mágico (Edição Manual):** Desenvolvimento de engine baseada em Canvas HTML5 para restauração e apagamento manual de pixels:
     - **Modo Restaurar:** Utiliza padrão de textura da imagem original para recuperar áreas perdidas.
     - **Cursor de Precisão:** Implementação de cursor visual dinâmico que reflete o tamanho e posição real do pincel.
  5. **TIF Corporativo:** Adicionadas ferramentas de compressão e organizador visual de páginas para arquivos TIF densos.
  6. **Correção de UI:** Resolvidos bugs de persistência visual nos filtros e alinhamento de imagens no slider.
- **Resultado:** O projeto agora é uma suíte de ferramentas multimídia robusta, mantendo a privacidade absoluta.

## [27/04/2026] - Implementação de Sistema de Auditoria e Logs (HA)
- **Motivo:** Necessidade de rastreabilidade de todas as operações críticas processadas pelos usuários.
- **Implementação:**
  1. **Utilitário de Log Assíncrono:** Criado `utils/logger.py` que utiliza `asyncio.to_thread` para realizar I/O em disco sem bloquear o servidor FastAPI.
  2. **Arquivos Diários:** Os logs são salvos em `logs/AAAA-MM-DD.log` para fácil manutenção e rotação.
  3. **Identificação de Máquina:** O sistema captura automaticamente o **Hostname** (Nome da Máquina) de quem disparou a ação, atendendo ao requisito de auditoria.
  4. **Logs Abrangentes:** Integrado em todos os módulos: Divisão, Junção, Compressão, Conversão de Imagem e Word, e Organização de páginas.
- **Resultado:** Garantia de conformidade e histórico operacional completo sem perda de performance.


Este documento registra a evolução técnica do **I Love Security**, focando em Alta Disponibilidade (HA), Cibersegurança Defensiva e UX de Alta Densidade.

## [Fase 1] - Fundação e Arquitetura Local-First
- **Objetivo:** Criar uma plataforma de manipulação de documentos que garanta privacidade absoluta ao rodar 100% localmente.
- **Decisão:** Uso de FastAPI para o backend devido à sua performance assíncrona e facilidade de documentação de rotas.
- **Implementação:** Separação estrita entre `/frontend` e rotas de processamento no `/backend`.

## [Março 2026] - Refatoração do Motor de Inicialização (HA & UX)
- **Problema:** A ativação manual de ambientes virtuais e janelas de terminal abertas prejudicavam a produtividade e a estabilidade.
- **Decisão:** Implementação do script `iniciar_sistema.bat` com supressão de terminal via PowerShell.
- **Melhorias:**
  1. **Serviço Invisível:** O backend roda em background total (`-WindowStyle Hidden`).
  2. **Descoberta Inteligente de Rede:** Uso de sockets UDP (via Google DNS mock) para identificar o IP correto na LAN, ignorando adaptadores de virtualização e garantindo acesso via intranet.
  3. **Self-Healing:** Mecanismo de shutdown que varre processos fantasmas na porta ativa.

## [Abril 2026] - Migração para Porta 8001 (Resiliência de Rede)
- **Problema:** Conflitos na porta padrão `8000` causados por processos zumbis do sistema operacional.
- **Decisão:** Migração definitiva de todo o ecossistema para a porta `8001`, garantindo que o servidor suba sem obstruções.

## [Abril 2026] - Rebranding e Foco Open Source
- **Decisão:** O projeto foi renomeado de sua versão embrionária interna para **I Love Security**, visando o lançamento público no GitHub.
- **Foco:** A documentação e interface foram limpas de contextos específicos de nicho para focar no valor universal da **Privacidade de Dados On-Premise**.
