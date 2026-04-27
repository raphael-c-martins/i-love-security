# Histórico e Diário de Decisões Arquiteturais (I Love Security) 🔐

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
