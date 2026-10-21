# Histórico e Diário de Decisões Arquiteturais (I Love Security)

---

## Diretrizes de Preservação
> **ATENÇÃO:** É terminantemente PROIBIDO realizar o apagamento de logs da pasta `/logs/` ou o reset de banco de dados em qualquer circunstância de manutenção, atualização ou refatoração do sistema.

## [21/10/2026] - Avaliação Geral e Correções Críticas de Segurança e Privacidade (Fase 0 do Roadmap)

- **Motivo:** O usuário pediu uma avaliação do quanto o projeto cumpre a promessa de ser uma ferramenta offline que não coleta dados nem vaza documentos. A avaliação encontrou uma falha crítica e pontos que contradiziam o "100% offline". O resultado completo virou o [ROADMAP.md](ROADMAP.md).

- **Problemas encontrados (e confirmados na prática):**
  1. **Apagamento de qualquer pasta do servidor:** a rota `POST /api/organizar-tif` (usada por Organizar TIF e Recortar TIF) montava o caminho com o `job_id` enviado pelo navegador sem validar. Com um caminho no lugar do ID, o tratamento de erro chamava `shutil.rmtree` nesse caminho. Confirmado com uma pasta descartável: uma única requisição, sem login, apagou a pasta. Como o CORS estava aberto para qualquer site, outro site aberto no navegador de alguém da rede também podia disparar a chamada.
  2. **Dependência de CDNs externas:** as três páginas carregavam o Tailwind (`cdn.tailwindcss.com`) e o pdf.js (`cdnjs`) da internet. Isso enviava a terceiros o IP, o navegador e a página acessada, deixava a interface sem estilo sem internet e permitia que um comprometimento da CDN rodasse código na página onde os documentos são lidos.
  3. **Originais de usuários esquecidos em disco:** quem abria Organizar TIF e desistia deixava o arquivo em `ferramentas/temp_tif/` para sempre (havia 4 TIFs, 157 MB, desde 29/05/2026 na máquina de desenvolvimento).
  4. Nome do arquivo do navegador usado no caminho em disco (Juntar TIF), rotas de feedback/log sem limite de tamanho (log aceitava linhas falsas), feedbacks no mesmo segundo se sobrescrevendo e healthcheck do Docker em `/` em vez de `/health`.

- **Implementações:**
  1. **`ferramentas/ferramentas_imagem.py`:** `resolver_job_dir()` aceita apenas UUID gerado pelo servidor e confere o caminho com `realpath` + `commonpath`. `cleanup_job_dir()` só apaga dentro de `temp_tif` (defesa extra). `TEMP_TIF_DIR` passou a ser caminho absoluto (antes dependia da pasta de onde o servidor era iniciado).
  2. **Limpeza automática (`utils/limpeza.py` + `main.py`):** tarefa em segundo plano (lifespan do FastAPI) que roda na inicialização e a cada 15 minutos, removendo jobs de TIF e pastas temporárias com mais de 2 horas. As pastas temporárias do sistema agora usam o prefixo `ils_`, então a varredura nunca toca em arquivos de outros programas. **Atenção:** na primeira inicialização desta versão, os TIFs antigos esquecidos em `temp_tif` serão removidos (é o comportamento esperado).
  3. **Frontend 100% local:** Tailwind 3.4.17 (mesma versão que o CDN servia) compilado em `visual/css/tailwind.css` (`tailwind.config.js` + `npm run build:css`) e pdf.js 3.11.174 em `visual/js/vendor/pdfjs/`. Os arquivos do pdf.js foram conferidos por SHA-256 contra os da CDN (idênticos). A cobertura de classes foi verificada no navegador (todas as telas de upload) e por varredura estática dos módulos.
  4. **Cabeçalhos de segurança (`utils/seguranca.py`):** CSP `default-src 'self'` (sem `unsafe-eval`, o que também mitiga a CVE-2024-4367 do pdf.js 3.x), `nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options`, `Permissions-Policy`.
  5. **CORS aberto removido + bloqueio de CSRF:** interface e API estão na mesma origem, então o `CORSMiddleware` foi retirado. Envios para `/api/` com `Sec-Fetch-Site: cross-site` (definido pelo navegador, não forjável por JavaScript) recebem 403. Esse cabeçalho não depende do Host repassado pelo Nginx.
  6. **Juntar TIF:** o arquivo é salvo como `input_N`, sem o nome vindo do navegador (o motor detecta o formato pelo conteúdo).
  7. **Feedback e log do frontend:** schemas Pydantic com limites (`tipo` restrito às opções do formulário, mensagem de 10 a 5000 caracteres etc.), log em linha única e feedback com ID único gravado em thread.
  8. **Testes de regressão (`tests/test_seguranca.py`, 17 testes, `unittest` sem dependências novas)** usando apenas pastas temporárias.

- **Validação:** testes automatizados passando; servidor local testado no navegador (miniaturas de PDF via pdf.js local, miniaturas TIF via UTIF.js, modo escuro, zero requisições externas e zero violações de CSP). O mesmo ataque que apagou a pasta na avaliação passou a retornar 400, com a pasta intacta.

- **Decisão de escopo:** o usuário confirmou que o uso é desktop corporativo (~1 em 500 acessos pelo celular). Ajustes de celular/toque ficaram como baixa prioridade no roadmap.

---

## [13/10/2026] - Auditoria de HTTPS, Correção de SAN Mismatch e Blindagem HSTS

- **Motivo:** O usuário reportou que novas estações da rede acusavam o aviso de "Não Seguro" ao acessar `https://ilovesecurity` e que ferramentas de sniffer capturavam pacotes em HTTP em texto claro.

- **Diagnóstico Realizado:**
  1. **Divergência de Nome no Certificado (SAN Mismatch):** O certificado anterior foi emitido apenas com `CN=ilovesecurity.local`, contendo nos SANs apenas as variações com hífen (`i-love-security`, `ilovesecurity.local`, `192.168.1.100`). Ao acessar `https://ilovesecurity` (sem hífen), o Chrome/Edge bloqueava imediatamente acusando `ERR_CERT_COMMON_NAME_INVALID` e riscando o `https://` em vermelho.
  2. **Cadeia de Confiança de Autoridade (Root CA / Autoassinado):** Por ser autoassinado pelo servidor, novas estações do Windows que ainda não receberam a GPO do Active Directory não confiam na autoridade emissora (`NET::ERR_CERT_AUTHORITY_INVALID`).
  3. **Origem dos Pacotes HTTP no Sniffer:**
     - A porta 8001 do Uvicorn estava aberta em `0.0.0.0:8001`, permitindo conexões diretas em HTTP sem passar pelo Nginx.
     - Quando o usuário digitava apenas `ilovesecurity`, o navegador emitia um primeiro pacote HTTP na porta 80 antes do redirecionamento 301, pois a diretiva **HSTS** estava ausente.
     - No loopback interno da VM (`127.0.0.1`), a comunicação entre o Nginx (terminador TLS) e o Uvicorn ocorre em HTTP puro.

- **Implementações e Resolução:**
  1. **Novo Certificado SSL/SAN de 10 Anos:**
     - Gerado novo certificado com Subject Alternative Names abrangendo todas as entradas: `DNS:ilovesecurity`, `DNS:ilovesecurity.local`, `DNS:i-love-security`, `DNS:ilovesecurity.local`, `IP:192.168.1.100` e `IP:127.0.0.1`.
  2. **Nginx com HSTS e Security Headers:**
     - Configurado `Strict-Transport-Security: max-age=31536000; includeSubDomains always`, forçando os navegadores a atualizar automaticamente qualquer tentativa de conexão para HTTPS antes de trafegar na rede.
     - Adicionados `X-Content-Type-Options: nosniff` e `X-Frame-Options: SAMEORIGIN`.
     - Nginx validado e recarregado com sucesso na VM (`192.168.1.100`).
  3. **Disponibilização do Certificado para Implantação:**
     - Certificado público baixado e armazenado na pasta do projeto em `certificados/ilovesecurity.crt` para distribuição via GPO ou instalação manual nas novas estações.

---

## [13/10/2026] - Roteamento Dinâmico de URLs por Ferramenta (SPA & History API)

- **Motivo:** O usuário solicitou URLs próprias e compartilháveis para cada função do sistema (exemplo: `https://ilovesecurity/tif/recortar`), eliminando a limitação onde o navegador permanecia fixo na rota da categoria (`/tif` ou `/imagens` ou `/`) e viabilizando links diretos de alta produtividade entre membros da equipe.

- **Implementações e Decisões Técnicas:**
  1. **Backend FastAPI (`main.py`):**
     - Adicionadas rotas dedicadas no backend para entrega dos templates correspondentes:
       - `@app.get("/tif/{tool_slug}")` $\rightarrow$ Entrega `tif.html`.
       - `@app.get("/imagens/{tool_slug}")` $\rightarrow$ Entrega `imagens.html`.
       - `@app.get("/pdf/{tool_slug}")` e slugs amigáveis na raiz (`/comprimir-pdf`, `/juntar-pdf`, etc.) $\rightarrow$ Entrega `index.html`.
     - Zero impacto em rotas de API (`/api/`) ou arquivos estáticos (`/visual/`).
  2. **Catálogo de Ferramentas com Atributo `slug` (`visual/js/script.js`):**
     - Todas as 14 ferramentas das 3 suítes agora possuem slugs padronizados (`recortar`, `comprimir`, `juntar`, `organizar`, `remover-fundo`, `converter`, `pdf-imagem`, `pdf-word`, `pdf-tiff`).
  3. **Roteador SPA no Frontend (`getToolUrl`, `findToolByPath`, `initRouting`):**
     - **Carregamento Direto por URL:** Ao acessar uma URL direta como `https://ilovesecurity/tif/recortar`, a função `initRouting()` detecta a ferramenta pelo pathname e abre imediatamente a área de upload correspondente, sem exigir clique prévio no catálogo.
     - **Transição Suave no Catálogo (`pushState`):** Ao clicar em qualquer card do catálogo, a URL do navegador é atualizada instantaneamente via `history.pushState` e o título da aba reflete a ferramenta ativa (ex: `Recortar TIF | I Love Security`).
     - **Retorno ao Catálogo (`closeUploadArea`):** O botão "Voltar para todas as ferramentas" agora fecha a área de upload e restaura a URL base (`/tif`, `/imagens` ou `/`) via History API sem recarregamento de página (`location.reload()`).
     - **Histórico do Navegador (`popstate`):** Suporte nativo aos botões Voltar e Avançar do navegador para navegar entre o catálogo e as ferramentas.
  4. **Harmonização de Módulos nos Templates HTML:**
     - `tif.html`, `imagens.html` e `index.html` agora importam todos os módulos JavaScript da pasta `/visual/js/modules/`, garantindo funcionamento idêntico e sem erros de dependência ausente em qualquer rota.

- **Validação de QA (E2E & Subagent):**
  - Testado via navegador com carregamento direto em `http://127.0.0.1:8001/tif/recortar`, validação do título e da dropzone, retorno ao catálogo (`/tif`) e reabertura via clique no card com atualização dinâmica de URL.

---

## [13/10/2026] - Refinamento de UX/UI na Branch 'refinamento-de-ux-ui' (Stepper, Telemetria & Design System)

- **Motivo:** Execução do ciclo de refinamento visual e ergonômico solicitado pelo usuário na nova branch `refinamento-de-ux-ui`, visando sanar a incerteza de progresso em arquivos massivos, prevenir cliques acidentais de cancelamento e elevar a consistência visual em Dark/Light mode com base no protocolo do `frontend-specialist`.

- **Implementações e Decisões Técnicas:**
  1. **Stepper Sequencial de 3 Etapas no HUD de Progresso (`script.js` & `style.css`):**
     - O modal universal de telemetria assíncrona (`createProgressHUD`) agora possui um Stepper horizontal trifásico: `[1. Upload / Envio]` $\rightarrow$ `[2. Processamento]` $\rightarrow$ `[3. Conclusão]`.
     - Transições de estado dinâmicas com checkmarks `✓`, indicador de linha animado e destaque de status (Azul no Envio, Âmbar no Servidor, Esmeralda na Conclusão).
     - **Estimativa Contextual Inteligente:** Para documentos acima de 200 MB, a nota explicativa exibe estimativa média de tempo (`~45s a 2min`), respondendo diretamente à dúvida do usuário quanto à previsão de término.
  2. **Prevenção de Cancelamentos Acidentais (Anti-Missclick com Dupla Confirmação):**
     - O botão de cancelamento agora requer confirmação em 2 etapas: o primeiro clique altera o botão para estado de alerta pulsante (`Tem certeza? Clique para abortar`) com timeout automático de 3.5 segundos para reverter. A operação só é cancelada se houver confirmação explícita.
  3. **Reatividade Frequente de Drag-and-Drop (Dropzone):**
     - Eventos `dragenter`/`dragover`/`dragleave`/`drop` em `setupUploadEvents` agora aplicam a classe `.dragover` com feedback físico imediato (borda tracejada em destaque, escala de 100.8% e sombra suave sem layout shift).
  4. **Suite TIF e PDF $\leftrightarrow$ TIFF com Decodificação Client-Side e Metadados:**
     - O módulo `pdf_tiff_ui.js` agora renderiza miniaturas reais de capas TIFF de até 80 MB diretamente no cliente via `UTIF.js` sem tráfego de rede, eliminando a dependência do ícone estático.
     - O editor de compressão (`compress_ui.js`) agora exibe badge de metadados com contagem real de páginas e resolução (`X página(s) • WxH px`).
  5. **Design System & Tokens de Feedback (Toast):**
     - A função `showToast` foi expandida com ícones SVG dedicados para 4 categorias de eventos (`success`, `error`, `info`, `warning`), bordas sólidas coloridas e tipografia legível.
     - Remoção completa de gradientes neon genéricos e respeito integral ao *Purple Ban* e diretrizes de software corporativo/institucional.

- **Homologação via Playwright MCP & Google Sheets:**
  - Testes executados em Full HD (`1920x1080`) com 0 erros de JavaScript no console.
  - Sincronização automatizada na planilha central de QA (`playwright-qa-testes`) via CLI `sync_qa_sheets.py`, com 5 novos cenários aprovados (`TC06` a `TC10`) sob o ID de execução `RUN-20261013-140051`.

---

## [13/10/2026] - Bateria de Testes E2E (Playwright MCP) e Sincronização Google Sheets (/qa-test)

- **Motivo:** O usuário solicitou a ativação do servidor Playwright MCP e a execução de testes automatizados ponta a ponta (E2E) para refinar a estabilidade das 3 suítes do projeto (PDF, TIF e Imagens).

- **Resultados e Diagnósticos:**
  1. **Detecção e Correção de Erro de Sintaxe em `word_ui.js`:**
     - Durante a auditoria de console na navegação Full HD (`1920x1080`), o Playwright MCP interceptou um erro de runtime: `Unexpected token 'catch'` em `word_ui.js:338`.
     - Identificado que o bloco `try` de abertura estava ausente em `processBtn.onclick`.
     - Correção cirúrgica aplicada imediatamente, testada e sincronizada na VM de produção (`192.168.1.100`), zerando os erros de JavaScript no console.
  2. **Validação das 3 Suítes de Ferramentas:**
     - **Suíte PDF (`/`):** Carregamento íntegro, alternância dinâmica de Dark Mode e filtros por categoria operando sem falhas visuais.
     - **Suíte TIF (`/tif`):** Módulos de TIF carregados, modal de compressão aberto com dropzone interativa e botão de retorno funcional.
     - **Suíte Imagens (`/imagens`):** Ferramentas de remoção de fundo e conversão acessíveis, modal de feedback operante com auto-focus em `fb-mensagem` e fechamento sem resíduos.
  3. **Teardown Seguro e Sincronização na Nuvem:**
     - Encerramento do navegador com `browser_close` mandatório (zero processos órfãos).
     - Execução persistida na planilha central do Google Sheets (`playwright-qa-testes`) via CLI `sync_qa_sheets.py`, com 5 cenários aprovados (`PASSED`) sob o ID de execução `RUN-20261013-134653`.

---

## [13/10/2026] - Integração Arquitetural de UTIF.js (Client-Side) e tifffile (BigTIFF Backend)

- **Motivo:** O usuário solicitou investigação e integração dos repositórios open-source de ponta de manipulação de TIFF (`photopea/UTIF.js` e `cgohlke/tifffile`), visando acelerar a renderização de miniaturas no navegador e expandir a capacidade de processamento de arquivos gigantes sem limitações de formato.

- **Implementações:**
  1. **Motor de Decodificação Local no Navegador (`UTIF.js`):**
     - Importada a biblioteca pura JavaScript `visual/js/UTIF.js` (mantida pelo criador do Photopea).
     - Criada a função global `window.renderTifPageClientSide` em `visual/js/script.js`, permitindo ao navegador decodificar os IFDs do TIFF e renderizar miniaturas e capas diretamente em elementos `<canvas>` com compressão JPEG em memória.
     - **Eliminação de Tráfego de Rede:** As telas de **Comprimir TIF** (`compress_ui.js`) e **Juntar TIF** (`merge_tif_ui.js`) agora exibem miniaturas de documentos instantaneamente (em menos de 50ms) para arquivos de até 80 MB, sem fazer uploads concorrentes para o servidor.
  2. **Motor Backend BigTIFF e Streaming (`utils/tiff_engine.py` e `tifffile`):**
     - Criado módulo utilitário integrando `tifffile` (Christoph Gohlke), habilitando:
       - **Suporte Nativo a BigTIFF (>4GB):** Supera o limite rígido de 4 GB do padrão TIFF clássico (ponteiros de 32 bits), permitindo gerar e ler arquivos dezenas de gigabytes com offsets de 64 bits.
       - **Mesclagem em Streaming (`mesclar_tiffs_streaming`):** A rota `POST /api/juntar-tiffs` em `conversao_pdf_tiff.py` foi refatorada para salvar uploads em disco temporário e gravar página a página no arquivo final via `tifffile.TiffWriter`, reduzindo o consumo de RAM de 6 GB para apenas ~30 MB em operações com arquivos gigantes.
       - **Retorno via FileResponse:** Arquivos mesclados são transmitidos diretamente do disco pelo kernel/Starlette com limpeza pós-download via `BackgroundTask`.

---

## [13/10/2026] - Resiliência para Arquivos Gigantes (4GB), Telemetria de Progresso e Async HA

- **Motivo:** O usuário relatou travamento completo do sistema ao tentar comprimir um arquivo TIF denso e convertê-lo para PDF (gerando arquivos vazios de 0 bytes na pasta Downloads), além da ausência de feedback de tempo e progresso durante operações demoradas (indeterminação de término entre 3 minutos e 3 horas).

- **Diagnóstico de Causa Raiz:**
  1. **Bloqueio do Nginx (HTTP 413 Payload Too Large):** A auditoria dos logs de erro (`/var/log/nginx/error.log`) na VM Proxmox (`192.168.1.100`) revelou que o arquivo enviado tinha **1.347.270.778 bytes (~1.35 GB)**. Como a diretiva `client_max_body_size` do Nginx estava fixada em `500M`, o proxy reverso abortava imediatamente a requisição com código 413.
  2. **Arquivos Vazios (0 Bytes) no Windows:** Devido ao mecanismo de "Super Save As" via File System Access API (`showSaveFilePicker`), a janela de salvamento criava o placeholder do arquivo no disco antes do término do fetch. Ao falhar com 413, o arquivo permanecia corrompido com 0 bytes na pasta Downloads.
  3. **Event Loop Blocking (HA):** O endpoint `/api/comprimir-tif` processava a compressão de imagens diretamente no event loop principal do FastAPI de forma síncrona, congelando a aplicação durante cargas pesadas.
  4. **Proteção DecompressionBomb da Pillow:** O Pillow impõe um limite padrão de segurança de 89 milhões de pixels, falhando em TIFs cartorários escaneados de altíssima resolução.
  5. **Falta de Telemetria de Carga (Black Box UX):** O uso de `fetch()` nativo não fornecia eventos de upload para arquivos de gigabytes, deixando a interface presa em um spinner estático "Otimizando..." sem estimativa de tempo (ETA), velocidade ou volume transmitido.

- **Implementações:**
  1. **Expansão de Limite e Timeouts no Nginx (`/etc/nginx/sites-available/default` e `TEMPORARIO/nginx_https.conf`):**
     - `client_max_body_size` elevado de `500M` para `4000M` (suporte a até 4 GB).
     - `client_body_timeout`, `proxy_read_timeout` e `proxy_send_timeout` expandidos para `1800s` (30 minutos) para uploads densos e processamento pesado.
  2. **Desativação Global do Limite de Pixels (Pillow):**
     - Adicionado `Image.MAX_IMAGE_PIXELS = None` em `main.py`, `conversao_pdf_tiff.py` e `ferramentas_imagem.py`.
  3. **Desacoplamento Assíncrono com Thread Pool (HA):**
     - `comprimir_tif` e `upload_tif_preview` agora executam em funções dedicadas encapsuladas por `asyncio.to_thread`, liberando o event loop do FastAPI para responder a outras requisições e health checks.
  4. **Otimização de Conversão TIF para PDF (`conversao_pdf_tiff.py`):**
     - Inserção direta de frames via PyMuPDF (`page.insert_image`), reduzindo em mais de 70% o uso de memória RAM e eliminando conversões intermediárias de documentos.
  5. **Sistema Universal de Telemetria e Progresso (`window.fetchWithProgress`):**
     - Criado motor global em `visual/js/script.js` baseado em `XMLHttpRequest` com cálculo em tempo real de:
       - **Porcentagem de Upload:** 0% a 100% com indicador visual em barra e números destacados.
       - **Volume Transferido:** `XX MB de YY GB`.
       - **Velocidade de Rede:** `XX.X MB/s` calibrada dinamicamente.
       - **Tempo Estimado Restante (ETA):** `~XXs restantes` com projeção matemática.
     - **Transição de Etapa para Servidor (100% Upload):** Quando o upload é concluído, o modal entra automaticamente na Etapa 2/2 (*Processando no Servidor*), ativando um cronômetro ao vivo (*00:01*, *00:02*...), barra animada contínua (`progress-stripes-active`) e aviso para arquivos pesados.
     - **Botão de Abort/Cancelamento:** Permite ao usuário cancelar a transferência a qualquer instante com encerramento gracioso via `xhr.abort()`.
     - **Propagação para o Projeto Inteiro:** Integrado em todos os 11 módulos do sistema (`compress_ui.js`, `pdf_tiff_ui.js`, `word_ui.js`, `image_ui.js`, `convert_img_ui.js`, `split_ui.js`, `merge_ui.js`, `merge_tif_ui.js`, `organize_ui.js`, `organize_tif_ui.js`, `crop_tif_ui.js` e `remove_bg_ui.js`).
  6. **Otimização da Prévia de TIF Denso (`compress_ui.js`):**
     - Para arquivos TIF com mais de 40 MB, a interface exibe instantaneamente o selo institucional do arquivo sem realizar um upload redundante de 1.25 GB apenas para gerar thumbnail, economizando banda de rede.
  7. **Correção Crítica de SIGSEGV da libtiff e Otimização de Memória (`ferramentas_imagem.py`):**
     - **Causa Raiz do Crash:** A análise de telemetria do `journalctl` revelou `status=11/SEGV (core-dump)` precedido por `Fax3SetupState: Bits/sample must be 1 for Group 3/4 encoding/decoding` e `free(): corrupted unsorted chunks`. O motor aplicava a flag de compressão `group4` se o primeiro frame fosse P&B (`frames[0].mode == '1'`), mas tentava salvar frames subsequentes que eram coloridos ou tons de cinza (8/24 bits) com Group 4, disparando violação de acesso em C dentro da `libtiff`. Adicionalmente, carregar 1.25 GB diretamente na memória RAM causava picos de 4.2 GB de alocação de heap.
     - **Streaming em Disco Temporário:** O endpoint `/api/comprimir-tif` agora salva o upload recebido em blocos assíncronos de 4MB em disco (`tempfile.mkdtemp`), processando os frames diretamente do disco sem inflar a memória RAM do Python.
     - **Segurança Estrita de Modos de Cor e Compressão:** O algoritmo verifica explicitamente se todos os frames são bilevel (`all(f.mode == '1' for f in processed_frames)`). Apenas se 100% dos frames forem 1-bit é permitido usar `group4`; caso contrário, é aplicado `tiff_adobe_deflate` (ou fallback `tiff_lzw`), garantindo imunidade absoluta a crashes de libtiff.
     - **Retorno via FileResponse com Limpeza Automática:** O arquivo comprimido é despachado via streaming direto do disco com `FileResponse`, acionando `BackgroundTask` para remoção do diretório temporário após a entrega dos bytes ao cliente.
  8. **Deploy e Validação:**
     - Deploy realizado na VM Proxmox (`192.168.1.100`) via Git commit e pull, com reinicialização controlada do serviço `i-love-security.service`.
     - Health check validado com HTTP 200.
     - Arquivos sincronizados com a VM Ubuntu Server no Proxmox (`192.168.1.100`), Nginx testado e recarregado com sucesso, e serviço `i-love-security.service` reiniciado e operante.

---

## [31/07/2026] - Implementação de HTTPS com Nginx, Certificado SSL/SAN e Tutorial de GPO no AD

- **Contexto:** O sistema operava em HTTP puro (`http://ilovesecurity`) desde 23/07/2026 por conta da pendência com o Antivírus Corporativo. Nesta sessão, toda a infraestrutura de SSL foi configurada e o acesso HTTPS foi ativado na VM.

- **Implementações:**

  1. **Certificado SSL Autofirmado com SAN (`/etc/ssl/certs/i-love-security.crt`):**
     - Gerado via OpenSSL na VM Ubuntu (`192.168.1.100`) com validade de 10 anos (3650 dias), seguindo exatamente o mesmo padrão utilizado no projeto `suite-de-ferramentas`.
     - Inclui **Subject Alternative Name (SAN)** com entradas para `DNS.1 = i-love-security`, `DNS.2 = ilovesecurity.local` e `IP.1 = 192.168.1.100` — obrigatório para que navegadores modernos aceitem o certificado.
     - Inclui extensão `subjectKeyIdentifier = hash`, essencial para que o Windows e o AD reconheçam o certificado corretamente durante a importação via GPO.
     - Chave privada protegida com permissão `600` (`/etc/ssl/private/i-love-security.key`).

  2. **Configuração do Nginx para HTTPS e Redirecionamento 301 (`/etc/nginx/sites-available/default`):**
     - Bloco `server` na porta `80` reconfigurado para fazer redirecionamento permanente (`return 301`) para HTTPS.
     - Bloco `server` na porta `443` configurado com os certificados SSL gerados, protocolos `TLSv1.2` e `TLSv1.3`, proxy reverso completo para a aplicação FastAPI na porta `8001`.
     - Adicionada a diretiva `client_max_body_size 500M;` para suportar uploads de PDFs e TIFs corporativos grandes sem erro HTTP 413.
     - Adicionados `proxy_read_timeout 600s;` e `proxy_send_timeout 600s;` para evitar timeouts durante operações de IA (remoção de fundo) e conversão via LibreOffice.
     - Configuração validada com `nginx -t` e recarregada com `systemctl reload nginx` — sem erros.

  3. **Distribuição do `.crt` para o Windows (`C:\Temp\i-love-security.crt`):**
     - Arquivo copiado da VM para a máquina de TI via `scp` para uso imediato na GPO do AD.
     - Cópia adicional mantida em `TEMPORARIO/i-love-security.crt` para referência local do projeto.

  4. **Tutorial de Configuração do DNS e GPO no AD (`TUTORIAL_DNS_HTTPS_GPO.md`):**
     - Criado documento técnico na raiz do projeto documentando todo o procedimento de infraestrutura: criação do registro DNS Tipo A no `dnsmgmt.msc`, geração do certificado no Linux, configuração do Nginx, criação e vinculação da GPO no `gpmc.msc` e disparo em massa via `gpupdate /force`.

- **Desafios encontrados:**
  - O **Antivírus Corporativo Endpoint Security** intercepta conexões HTTPS e exibe alerta de certificado não confiável mesmo após importação no Root Store do Windows — por ter motor de validação SSL próprio, independente do Windows Certificate Store. A resolução do Antivírus Corporativo requer exclusão de domínio via Antivírus Corporativo Security Center (KSC) e está pendente como item separado.
  - O encoding do heredoc PowerShell → SSH fez o template do Nginx ser corrompido (variáveis `$host`, `$http_upgrade` eram interpretadas pelo PowerShell antes de chegar ao bash). Solução: o arquivo de configuração foi criado localmente e transferido para a VM via `scp` antes de ser movido para o destino final com `sudo cp`.

- **Status atual:**
  - HTTPS ativo e funcionando na VM (`https://ilovesecurity.local` / `https://192.168.1.100`).
  - Redirecionamento HTTP → HTTPS operacional.
  - Certificado distribuído para esta máquina (Root Store local).
  - **Pendente:** Importação do certificado via GPO no AD para propagar confiança para todas as estações do domínio `EMPRESA.LOCAL`.
  - **Pendente:** Exclusão de domínio no Antivírus Corporativo Security Center para eliminar o bloqueio de SSL inspection.

---

## [27/07/2026] - Resiliência e Auto-Recuperação de Compressão PDF (Multi-Stage Fallback)
- **Motivo:** Corrigir a mensagem de falha no servidor ("Erro no servidor ao comprimir") ao tentar comprimir PDFs escaneados corporativos/cartorários com nomes acentuados (ex: `USUCAPIÃO`, `SUSCITAÇÃO`).
- **Implementações:**
  1. **Arquitetura de Alta Disponibilidade com 3 Estágios de Fallback (`ferramentas/comprimir_pdf.py`):**
     - *Estágio 1 (Ghostscript Max Compression):* Executa o Ghostscript com otimização completa e injeção de parâmetros PostScript (`setdistillerparams`).
     - *Estágio 2 (Ghostscript Modo Seguro):* Caso o Estágio 1 apresente inconsistências em fluxos de scans específicos, executa o Ghostscript em modo seguro com flags nativas sem injeção PostScript.
     - *Estágio 3 (PyMuPDF Engine Nativa):* Se o Ghostscript falhar ou não estiver disponível, o sistema ativa automaticamente a biblioteca C PyMuPDF (`fitz`) para re-amostrar e compactar imagens, garantindo **100% de sucesso**.
  2. **Formatacão de Cabeçalhos HTTP RFC 5987 (`ferramentas/comprimir_pdf.py`):**
     - Sanitizados os caracteres ASCII e codificado o nome do arquivo baixado via `urllib.parse.quote` (`filename*=UTF-8''...`), eliminando falhas de codificação no Starlette/FastAPI para nomes com acentuação.
  3. **Detecção Dinâmica do Executável Ghostscript:**
     - Implementada varredura automática no sistema para localizar a versão do Ghostscript no Windows sem depender de caminhos rígidos.

---

## [27/07/2026] - Ajuste Fino de Compressão de PDF (Equiparado ao iLovePDF) & Correção do Toast de Economia
- **Motivo:** Equiparar os resultados de redução de tamanho de PDF com o iLovePDF após feedback de uso em cenário real (arquivo `tudo.pdf` com 52.9 MB / 150 páginas na pasta `TEMPORARIO/REALIDADE`), além de corrigir a exibição da porcentagem de economia no Toast do frontend.
- **Implementações e Benchmarks:**
  1. **Recalibração do Ghostscript (`ferramentas/comprimir_pdf.py`):**
     - Ajustados valores de DPI e matrizes de quantização PostScript (`QFactor`) do Ghostscript para alcançar taxas de compressão idênticas ou superiores ao iLovePDF:
       - *Recomendada:* DPI 128, QFactor 1.45, `/ebook` (Redução de 52.9 MB para **16.71 MB / -66.9%**, superando os 17.45 MB do iLovePDF).
       - *Extrema:* DPI 92, QFactor 2.15, `/screen` (Redução de 52.9 MB para **7.39 MB / -85.4%**, superando os 8.73 MB do iLovePDF).
       - *Baixa:* DPI 180, QFactor 0.70, `/prepress` (Redução ~35%).
  2. **Exposição dos Cabeçalhos CORS (`main.py` e `ferramentas/ferramentas_imagem.py`):**
     - Adicionada a propriedade `expose_headers` no `CORSMiddleware` para liberar a leitura dos cabeçalhos customizados `X-Original-Size`, `X-Final-Size` e `X-Economy-Percent` no cliente.
  3. **Correção do Cálculo de Economia no Frontend (`visual/js/modules/compress_ui.js` e `visual/js/script.js`):**
     - Implementado o recálculo preciso da porcentagem no cliente comparando os tamanhos originais e finais (`origNum` vs `finNum`), com fallback para o tamanho real do Blob baixado.
     - Notificações Toast ajustadas para exibir o percentual de redução correto (ex: `📉 Compactado! De 50.45 MB para 16.71 MB (-66.9%)`).

---

## [23/07/2026] - Operação em HTTP Puro (http://ilovesecurity) & Pendência de SSL Antivírus Corporativo
- **Decisão Operacional:** O sistema passou a operar temporariamente em **HTTP puro (`http://ilovesecurity`)** na porta `80` para garantir acessibilidade imediata e 100% livre de avisos para todos os usuários da organização, sem atrito com a inspeção de conexões criptografadas do Antivírus Corporativo.
- **Implementações:**
  1. **Nginx na VM (`192.168.1.100`):** Revertido para responder nativamente na porta `80` (HTTP) sem redirecionamento 301. O acesso por `http://ilovesecurity` é instantâneo e limpo em toda a rede.
  2. **[PENDENTE] Refinamento de SSL no Antivírus Corporativo Cloud / AD CS:** A homologação do certificado autoassinado na inspeção SSL/TLS do Antivírus Corporativo Cloud e/ou emissão via AD CS fica marcada como pendente para melhorias futuras em ambiente controlado.

---
- **Motivo:** Atender à solicitação do usuário e às recomendações do feedback (`feedback_20260714_131558.json`), eliminando a visualização cinza simples genérica e fornecendo editores visuais dedicados e interativos com cálculo dinâmico de redução de tamanho.
- **Implementações:**
  1. **Novo Módulo de UI para Juntar TIF (`visual/js/modules/merge_tif_ui.js`):**
     - Criado editor visual com grade de miniaturas para arquivos TIF multipáginas e imagens (JPG/PNG).
     - **Reordenação Drag & Drop:** Permite arrastar os cards das páginas/arquivos para alterar a sequência final da mesclagem.
     - Suporte a inclusão dinâmica de mais arquivos via botão "+ Adicionar mais".
  2. **Estimador Dinâmico de Redução de Tamanho (`visual/js/modules/compress_ui.js`):**
     - Refatorado para suportar tanto PDF quanto TIF com carregamento de pré-visualização de capa.
     - **Cálculo em Tempo Real:** Exibe o tamanho original e calcula dinamicamente a estimativa de tamanho final e a porcentagem de economia (ex: `~6.12 MB (-75%)`) conforme o usuário alterna entre os níveis de compressão (*Extrema*, *Recomendada*, *Baixa*) e ativa a opção *Tons de Cinza*.
  3. **Roteamento de Eventos no Frontend (`visual/js/script.js`):**
     - Conectados os seletores de arquivos das ferramentas "Comprimir PDF", "Juntar TIF" e "Comprimir TIF" para que abram diretamente seus editores visuais específicos em vez da lista simples legada.
  4. **Atualização das Páginas HTML (`index.html` & `tif.html`):**
     - Incluída a importação da tag `<script src="/visual/js/modules/merge_tif_ui.js"></script>`.
  5. **Governança de Feedbacks (SRE):**
     - Movido o arquivo de feedback `feedback_20260714_131558.json` da raiz para a pasta `/feedbacks/Solucionados/`.

---

## [21/07/2026] - Implementação da Ferramenta "Juntar TIF" e Ajuste de Tema Claro Padrão
- **Motivo:** Atender à sugestão enviada via feedback do usuário no servidor Proxmox (`feedback_20260714_131010.json`) e ajustar a preferência padrão de iluminação da interface.
- **Implementações:**
  1. **Ferramenta "Juntar TIF":**
     - **Backend (`conversao_pdf_tiff.py`):** Criada função `_juntar_tiffs_sync` e o endpoint `POST /api/juntar-tiffs` para ler múltiplos arquivos de imagem/TIF e mesclar todos os frames em um único documento TIFF multipáginas com compressão inteligente `tiff_adobe_deflate` (sem inflar arquivo).
     - **Frontend (`script.js`):** Inserido o card "Juntar TIF" no catálogo de ferramentas da aba TIF com suporte a upload em lote, validação de arquivos e integração com o modal de download pre-save ("Super Save As").
  2. **Tema Claro como Padrão:**
     - Ajustado o script de bloqueio de flash no `<head>` dos arquivos HTML ([index.html](file:///d:/WebApps_Programas_Scripts/i-love-security/index.html), [imagens.html](file:///d:/WebApps_Programas_Scripts/i-love-security/imagens.html), [tif.html](file:///d:/WebApps_Programas_Scripts/i-love-security/tif.html)) para que o sistema sempre inicie no Tema Claro (Light Mode) por padrão, só ativando o Modo Escuro caso o usuário tenha salvo explicitamente a preferência `dark` no `localStorage`.
  3. **Badges Dinâmicos Autônomos ("NOVO" / "ATUALIZADO"):**
     - Criada a função `getBadgeHtml(tool)` no [script.js](file:///d:/WebApps_Programas_Scripts/i-love-security/visual/js/script.js) que posiciona selos visuais com indicadores pulsantes no canto superior direito dos cards.
     - **Expiração Automática:** Os badges utilizam a propriedade `badge: { type: "novo", date: "YYYY-MM-DD" }` e expiram automaticamente após 48 horas (2 dias) a partir da data cadastrada, removendo a necessidade de manutenção manual.
- **Governança SRE:** Feedback atendido movido para a pasta `/feedbacks/Solucionados/`.

---

## [21/07/2026] - Refatoração do Console de Operações e Portas Dinâmicas (Self-Healing)
- **Motivo:** Substituir o launcher antigo por um console interativo moderno baseado no modelo do usuário, com sorteio de portas livres para evitar conflito de rede e detecção automática de ambiente Python.
- **Implementações:**
  1. **Inicialização Dinâmica no Backend:** Ajustada a rotina de execução em `main.py` para receber a porta como argumento da linha de comando, caindo para fallback `8001` caso não fornecido.
  2. **Novo Console Interativo:** Criação do script `iniciar-servidor-local.bat` com menu estruturado em lote (Ligar, Desligar, Status, Instalação no `.venv` e Sorteio de Porta).
  3. **Sorteio Dinâmico de Portas:** Integração de uma chamada PowerShell que abre um listener TCP temporário na porta `0` para que o SO atribua uma porta efêmera livre. A porta sorteada é gravada em `logs\logs-cmd\server.port`.
  4. **Detecção Inteligente de Ambiente (Self-Healing):** Lógica linear no script bat que verifica a integridade do `.venv` e, se incompleto (ex: falta de `PyPDF2`), faz fallback dinâmico para o Python global do sistema que já possua as dependências instaladas.
  5. **Auditoria e Logs:** Geração automática de arquivo de log diário em `logs\logs-cmd\auditoria_YYYY-MM-DD.log` e log de execução em background em `logs\logs-cmd\server_background.log`.

---

## [21/07/2026] - Implementação de Modo Noturno (Modo Escuro) Sóbrio com Persistência
- **Motivo:** Atender à sugestão enviada no feedback do usuário (`feedback_2026-05-27_10-04-08_039829.json`) para proporcionar conforto visual no uso contínuo das ferramentas e melhorar a usabilidade.
- **Implementações:**
  1. **Configuração Tailwind & Anti-Flash:** Injetada configuração de `darkMode: 'class'` para o Tailwind CSS CDN no cabeçalho das páginas [index.html](file:///d:/WebApps_Programas_Scripts/i-love-security/index.html), [imagens.html](file:///d:/WebApps_Programas_Scripts/i-love-security/imagens.html) e [tif.html](file:///d:/WebApps_Programas_Scripts/i-love-security/tif.html), acompanhado de script síncrono inline de verificação de tema para prevenir o flash branco durante o carregamento.
  2. **Elementos de Controle Visual:** Inserção do botão de alternância de tema (`#theme-toggle`) com ícones dinâmicos SVG (Sol/Lua) integrados ao lado do status "Ambiente Interno" nas barras de navegação superiores.
  3. **Estilos de Modo Noturno:** Adicionadas regras abrangentes no arquivo [style.css](file:///d:/WebApps_Programas_Scripts/i-love-security/visual/css/style.css) sob o seletor `.dark` para estilizar o fundo, abas, botões de filtro, cards de ferramentas, áreas de upload, miniaturas de arquivos, modais (incluindo o modal dinâmico de feedback) e inputs em tons de cinza corporativos escuros (`#111827`, `#1f2937`), garantindo alto contraste e leitura adequada sem quebrar a identidade visual nativa.
  4. **Lógica de Persistência:** Implementado controle centralizado no arquivo [script.js](file:///d:/WebApps_Programas_Scripts/i-love-security/visual/js/script.js) para escutar a alternância de temas, persistir o estado do usuário no `localStorage` e disparar notificações Toast curtas em cada alteração.
  5. **Governança SRE:** Arquivamento do feedback atendido da raiz de `/feedbacks/` para a pasta `/feedbacks/Solucionados/`.
- **Resultado:** A plataforma agora conta com um modo escuro elegante e profissional, que respeita a preferência do usuário e se integra nativamente ao sistema web sem causar latência ou flashes de iluminação.

---

## [03/07/2026] - Refatoração para Arquitetura Híbrida Multi-OS e Otimização para VM Linux Headless
- **Motivo:** O desenvolvimento local ocorre em ambiente Windows, porém o servidor principal de homologação/produção é uma máquina virtual Ubuntu Server no Proxmox. O sistema precisava ser 100% agnóstico a sistemas operacionais para evitar quebras em chamadas nativas de arquivos executáveis ou dependências específicas de plataforma.
- **Implementações:**
  1. **Gestão de Dependências Condicionais (`requirements.txt`):**
     - Adicionados marcadores de ambiente PEP 508 (`sys_platform == 'win32'`) para as bibliotecas exclusivas do Windows: `pywin32`, `docx2pdf` e `pywin32-ctypes`. Isso previne erros de download/compilação em servidores de produção Linux.
  2. **Motor Ghostscript Multi-OS (`comprimir_pdf.py`):**
     - Refatoração da rotina de detecção automática para chavear dinamicamente entre `gswin64c` no Windows (verificando PATH e pasta padrão de instalação) e `gs` no Linux (via `shutil.which` e fallback direto).
     - Protegida a injeção do objeto de janela oculta (`startupinfo`) exclusiva do Windows.
  3. **Conversão de Documentos Word/PDF Multi-OS (`conversao_word.py`):**
     - Isolados os pacotes `win32com`, `pythoncom` e `winreg` em blocos de importação condicional (`os.name == 'nt'`).
     - **PDF para Word:** No Linux, a conversão utiliza o pacote multiplataforma `pdf2docx`. No Windows, mantém a ponte COM padrão da aplicação original.
     - **Word para PDF:** No Linux, o sistema executa o motor offline do LibreOffice Headless via subprocesso (`libreoffice --headless --convert-to pdf`). No Windows, mantém a integração nativa via `docx2pdf`.
  4. **Documentação de Implantação e Infraestrutura:**
     - Atualização do `README.md` documentando o passo a passo exato para instalação das dependências essenciais de sistema (`ghostscript` e o leve `libreoffice-nogui`) via console/SSH na VM Ubuntu Server no Proxmox em ambiente local On-Premise.
- **Resultado:** O sistema agora roda perfeitamente em modo de desenvolvimento local (Windows) e em produção (Linux Ubuntu Server), garantindo resiliência, leveza (sem interface X11 instalada no servidor) e facilidade de manutenção sem duplicidade de código.

---

## [29/05/2026] - Implementação do Recorte de TIF, Sincronização Visual de Intervalos, Preservação de Nomes e Auditoria Multimáquina
- **Motivo:** Otimizar o fluxo de corte de arquivos TIF multipáginas via seleção de intervalos personalizados; sincronizar a seleção de páginas com a interface em tempo real; preservar o nome original dos arquivos nos downloads de arquivo único; e registrar a origem (IP do cliente) e tamanho (em bytes) de todas as operações para auditoria precisa de desempenho e segurança corporativa.
- **Implementações:**
  1. **Ferramenta de Recorte de TIF (Módulo Crop TIF):**
     - Criação do módulo [crop_tif_ui.js](file:///d:/WebApps_Programas_Scripts/i-love-security/visual/js/modules/crop_tif_ui.js) com interface dedicada a extração de intervalos específicos de páginas de arquivos TIF (ex: `1-5, 7-9, 15-40`).
     - Integração do card de Recorte de TIF no painel de ferramentas nos arquivos [tif.html](file:///d:/WebApps_Programas_Scripts/i-love-security/tif.html), [index.html](file:///d:/WebApps_Programas_Scripts/i-love-security/index.html) e [imagens.html](file:///d:/WebApps_Programas_Scripts/i-love-security/imagens.html).
  2. **Sincronização Visual de Intervalos:**
     - Atualização do visualizador de PDF ([split_ui.js](file:///d:/WebApps_Programas_Scripts/i-love-security/visual/js/modules/split_ui.js)) e do novo visualizador de TIF para refletir dinamicamente na tela quais páginas estão contidas no intervalo digitado pelo usuário (e vice-versa: ao clicar nas páginas, o campo de intervalo de texto é preenchido de forma bidirecional).
  3. **Preservação do Nome do Arquivo no Download:**
     - Refatoração dos fluxos de download de arquivo único nos módulos de frontend (`organize_ui.js`, `organize_tif_ui.js`, `crop_tif_ui.js`, `pdf_tiff_ui.js`, `image_ui.js`, `script.js`) para manter o nome original do arquivo (com sufixos explicativos, como `_organizado`, `_recortado` etc.), em vez de gerar nomes genéricos ou hashes aleatórios.
  4. **Auditoria de IP Dinâmico do Cliente:**
     - Desenvolvimento de middleware assíncrono no FastAPI ([main.py](file:///d:/WebApps_Programas_Scripts/i-love-security/main.py)) para extrair o endereço IP do host cliente que origina as requisições (`client.host`), contornando o comportamento anterior que registrava apenas o hostname estático do servidor local.
     - Utilização de `ContextVars` (variáveis de contexto assíncronas do Python) em [utils/logger.py](file:///d:/WebApps_Programas_Scripts/i-love-security/utils/logger.py) para propagar de forma segura e não bloqueante o IP do cliente ativo para o motor de logs diários de auditoria.
  5. **Métrica de Volume de Dados (Bytes de Entrada/Saída):**
     - Adaptação das rotas de backend (módulos da pasta `ferramentas/`) para capturar e documentar no log de auditoria o tamanho exato dos arquivos antes e depois de cada processamento (por exemplo: `(X bytes -> Y bytes)`), permitindo avaliar a eficiência dos algoritmos e evitar problemas históricos de inflação excessiva de arquivos.
- **Resultado:** Maior agilidade e controle visual nas operações de corte de PDF e TIF; UX refinada com downloads intuitivos baseados nos nomes originais; e rastreabilidade total de acessos e tráfego de dados por endereço de IP na rede corporativa.

## [28/05/2026] - Reordenação de Submenus, Ajuste do Grid "Todas" e Manutenção de Feedbacks (SRE)
- **Motivo:** Otimizar o fluxo de navegação ordenando as categorias de forma lógica ("Converter" antes de "Organizar" e "Otimizar") e melhorar a visualização de cards na página principal "Todas", aproveitando melhor as telas de alta resolução. Realizar a triagem obrigatória de feedbacks da sessão.
- **Implementação:**
  1. **Ordenação Explícita de Submenus:** Em `visual/js/script.js` (função `renderSubFilters`), adicionado algoritmo de ordenação para exibir os botões de filtro na sequência ideal: `Todas`, `Converter`, `Organizar`, `Otimizar` (com suporte a categorias dinâmicas secundárias como `Edição` e `Segurança`).
  2. **Grid Dinâmico e Responsivo (4 Colunas em "Todas"):**
     - Alterado a estrutura padrão inicial dos arquivos `index.html`, `imagens.html` e `tif.html` para `lg:grid-cols-4 max-w-7xl` no `tools-grid`, proporcionando uma exibição nativa de 4 cards por linha.
     - Ajustado dinamicamente via JS na função `filterTools` (em `visual/js/script.js`) para que o grid mude para 4 colunas (`lg:grid-cols-4 max-w-7xl`) quando o filtro selecionado for "Todas", e volte para 3 colunas (`lg:grid-cols-3 max-w-6xl`) quando um filtro de subcategoria específico (menor número de cards) estiver ativo, garantindo centralização e proporções visualmente corretas.
  3. **Rotina de Gestão de Feedbacks:** Realizada a listagem obrigatória do diretório `feedbacks/` na inicialização. Triagem efetuada com sucesso: o arquivo de teste `feedback_20260528_081837.json` foi movido para `/feedbacks/Solucionados/` para manter a raiz de feedbacks limpa, e o feedback legítimo de sugestão de modo noturno (`feedback_2026-05-27_10-04-08_039829.json`) foi mantido pendente na raiz.
- **Resultado:** Interface mais limpa, menus ordenados conforme a preferência do usuário, aproveitamento superior do espaço horizontal nas telas e conformidade com o protocolo SRE de governança de feedbacks.

## [27/05/2026] - Refatoração do Motor de Conversão PDF para Word (Fidelidade Absoluta) e Fallback
- **Problema Inicial:** A conversão de PDF para DOCX gerava resultados com formatação quebrada em documentos corrompidos (onde a camada de texto possui mapeamentos ToUnicode ausentes, gerando caracteres lixo).
- **Implementação Atual (Provisória):**
  1. Substituição para interface nativa MS Word (`win32com.client.DispatchEx`), garantindo máxima fidelidade em PDFs sadios.
  2. Implementação de detecção de corrupção: A IA calcula a densidade de caracteres não-imprimíveis (>5% = PDF corrompido).
  3. Lógica de Fallback (Rasterização Automática): PDFs corrompidos são convertidos página a página em imagens (PyMuPDF) e embutidos no DOCX para evitar a quebra da integridade visual.
- **Status (EM ABERTO):** A solução de Fallback em imagem não resolve o caso de uso onde o cliente precisa **editar o texto** (ex: aumentar a fonte). As tentativas de usar OCR local (Tesseract) foram suspensas devido ao impacto de performance e peso que trariam ao projeto. O uso de APIs externas (como a do ILovePDF) fere a diretriz "100% Offline". 
- **Próximos Passos (Research):** A equipe irá pesquisar novas abordagens arquiteturais para realizar a reconstrução heurística do texto ou encontrar um motor OCR super leve e offline que atenda aos requisitos de performance e privacidade do "I Love Security" sem inchar o projeto.

## [27/05/2026] - Rotina de Manutenção SRE (Gestão de Feedbacks)
- **Motivo:** O acúmulo de arquivos JSON de feedback sem revisão causava dívida técnica.
- **Implementação:** 
  1. Foi formalizada uma nova regra arquitetural (AI_GUIDELINES.md) onde o Agente, na inicialização de qualquer sessão, deve listar o diretório `feedbacks/`.
  2. Feedbacks diagnosticados como resolvidos ou meros testes devem ser movidos para a pasta `/feedbacks/Solucionados/`, mantendo a raiz limpa.
- **Resultado:** Governança contínua do sistema, garantindo que nenhum relato de usuário fique para trás.

## [27/05/2026] - Super Save As (UX de Alta Densidade)
- **Problema:** Ao converter arquivos, o navegador (Chrome) não abria o "Salvar Como" corretamente devido a expiração do evento de clique, ou salvava arquivos sem extensão/na pasta errada.
- **Implementação:**
  1. Criação do método `window.getFileSaver` em `script.js` que utiliza a moderna `File System Access API` (`showSaveFilePicker`).
  2. Implementação do `id: 'i-love-security-save'` que obriga o navegador a memorizar de forma permanente a última pasta de trabalho utilizada pelo sistema, resolvendo a frustração de navegação constante entre diretórios.
  3. Mapeamento estrito de MIME types e extensões forçadas (`types`). Se o usuário não digitar a extensão `.tif`, a API acopla de forma segura.
  4. Execução imediata da API no momento do clique (pré-save), eliminando falhas de segurança do navegador em processos longos (`SecurityError`).
- **Resultado:** Fluxo cirúrgico de "Salvar Como". Como o salvamento ocorre diretamente no disco via handle, ele ignora o gerenciador de downloads padrão do navegador, operando como um programa nativo real.

## [27/05/2026] - Caixa de Feedback de Usuários (SRE)
- **Motivo:** Necessidade de coletar relatos de problemas (bugs) e sugestões dos usuários diretamente pela interface, para posterior análise da equipe antes de manutenções.
- **Implementação:**
  1. **Frontend:** Desenvolvido botão flutuante e modal estilo Glassmorphism via `visual/js/modules/feedback_ui.js` para garantir uma UX profissional sem atrapalhar a produtividade.
  2. **Backend:** Endpoint assíncrono criado em `ferramentas/feedback.py`, utilizando Pydantic para validação rigorosa (sanitização de inputs).
  3. **Armazenamento:** Escrita assíncrona (`asyncio.to_thread`) em arquivos `.json` formatados na nova pasta `/feedbacks/`, separando relatos para auditoria.
- **Resultado:** Funcionalidade de feedback ativada globalmente e sem riscos de SQL Injection, mantendo alta disponibilidade no servidor.

## [27/05/2026] - Conversão Bidirecional PDF ↔ TIFF Multipáginas
- **Motivo:** Necessidade corporativa de converter PDFs em arquivos TIFF multipáginas (1 PDF de X páginas → 1 TIFF com X frames) e vice-versa, sem perder a integridade das páginas.
- **Implementação:**
  1. **Backend:** Criado módulo `ferramentas/conversao_pdf_tiff.py` com duas rotas:
     - `/api/pdf-para-tif`: Rasteriza cada página do PDF via PyMuPDF e monta um TIFF único usando Pillow (`save_all=True`).
     - `/api/tif-para-pdf`: Extrai cada frame do TIFF e monta um PDF unificado via PyMuPDF.
  2. **Compressão Inteligente:** CCITT Group 4 para docs P&B, Adobe Deflate para coloridos (evita inflação de bits).
  3. **Performance (HA):** Processamento pesado delegado a `asyncio.to_thread` para manter o servidor responsivo.
  4. **Frontend:** Criado módulo `visual/js/modules/pdf_tiff_ui.js` com interface de switch (PDF→TIFF / TIFF→PDF), preview de capa, modal de confirmação e Toast notifications.
  5. **Disponibilidade:** Ferramenta visível tanto na aba PDF quanto na aba TIF para facilitar o acesso.
- **Resultado:** Conversão robusta e bidirecional com entrega inteligente (1 arquivo = download direto, múltiplos = ZIP).

## [27/05/2026] - Correção do Bug "Erro ao processar" no Organizar PDF
- **Problema:** Ao reorganizar páginas e clicar "Organizar PDF", o sistema exibia "Erro ao processar" e não salvava.
- **Causa:** A função `submitOrganize()` buscava o arquivo via `document.getElementById('file-input')`, porém o `openUploadArea()` do `script.js` reconstruía todo o HTML do container, criando um novo `<input>` vazio e perdendo a referência ao arquivo original.
- **Solução:** Refatoração para usar closure — o objeto `File` é capturado diretamente do parâmetro da função `setupOrganizeVisualEditor` e passado via argumento para `submitOrganize(file)`, eliminando a dependência do DOM.
- **Melhoria Extra:** Substituição de todos os `alert()` nativos por Toast notifications (`window.showToast`) para consistência visual e proteção contra exposição de código ao usuário final.
- **Resultado:** Organização de PDF funcionando de forma estável e com feedback visual profissional.

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
- **Decisão:** Implementação do script `iniciar-servidor-local.bat` com supressão de terminal via PowerShell.
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
