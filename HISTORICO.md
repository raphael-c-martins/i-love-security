# Histórico e Diário de Decisões Arquiteturais (I Love Security) 🔐

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
