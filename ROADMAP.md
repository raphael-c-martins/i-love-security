# Roadmap do I Love Security

Plano de evolução montado a partir da avaliação de 21/10/2026 (privacidade, segurança, responsividade e manutenção).
O foco do projeto é **uso em desktop, dentro da rede da empresa**, com a promessa de que **nenhum dado sai da rede**.

Legenda: ✅ concluído · 🔜 próximo · 📋 planejado · 💤 baixa prioridade

---

## Fase 0 — Correções críticas de segurança e privacidade ✅ (21/10/2026)

| Item | Status |
|---|---|
| Rota `organizar-tif` (usada por Organizar e Recortar TIF) aceitava caminhos no `job_id` e podia **apagar qualquer pasta do servidor**. Agora só aceita UUID gerado pelo servidor, e a limpeza só apaga dentro de `temp_tif` | ✅ |
| Tailwind e pdf.js carregados de CDNs externas (vazava IP e página acessada, e quebrava sem internet). Agora são servidos pelo próprio servidor (`visual/css/tailwind.css`, `visual/js/vendor/pdfjs/`) | ✅ |
| Cabeçalho **CSP** (`default-src 'self'`): o navegador fica proibido de carregar ou enviar qualquer coisa para fora do servidor | ✅ |
| CORS aberto para qualquer site (`allow_origins=["*"]`) removido. Envios para a API vindos de outros sites são bloqueados (proteção contra CSRF via `Sec-Fetch-Site`) | ✅ |
| Originais de usuários esquecidos em disco (`ferramentas/temp_tif`). Limpeza automática a cada 15 min de tudo que passa de 2 horas, inclusive pastas temporárias de processamentos interrompidos | ✅ |
| Nome de arquivo enviado pelo navegador era usado no caminho em disco (Juntar TIF) | ✅ |
| Feedback e log do frontend sem limite de tamanho, com risco de injeção de linhas falsas no log e de feedbacks se sobrescreverem | ✅ |
| Healthcheck do Docker apontando para `/health` | ✅ |
| Testes automatizados de regressão (`tests/test_seguranca.py`) | ✅ |

---

## Fase 1 — Robustez do servidor 🔜

| Item | Por quê |
|---|---|
| Limite de tamanho de upload por rota na própria aplicação | Hoje só o Nginx limita (4 GB); quem acessa a porta 8001 direto não tem limite |
| Uvicorn ouvindo só em `127.0.0.1` quando estiver atrás do Nginx (systemd/`.bat`/Docker) | Evita acesso direto em HTTP sem passar pelo HTTPS |
| Mover para threads os processamentos pesados que ainda travam o servidor: `remover-fundo`, `juntar`, `organizar`, `dividir`, `pdf-para-jpg` e Word no Windows | Durante um processamento pesado, os outros usuários e o `/health` ficam sem resposta |
| Não devolver `str(e)` ao usuário: mensagem amigável na tela e detalhe só no log | Evita expor caminhos e detalhes internos |
| Nome de download com acentos (`filename*=UTF-8''...`) em todas as rotas (organizar, dividir, Word, juntar) | Alguns nomes com caracteres especiais quebram o cabeçalho |
| Temporários do Word (`NamedTemporaryFile`) migrados para `criar_dir_temp` | Entram na limpeza automática se o processo cair |
| Atualizar pdf.js 3.11 → 4.x | Corrige a CVE-2024-4367 (já mitigada pela CSP sem `unsafe-eval`) |

## Fase 2 — Dependências e implantação 📋

| Item | Por quê |
|---|---|
| Enxugar o `requirements.txt` (~170 pacotes → ~15 realmente usados) | Hoje inclui tensorflow, torch, ollama, google-auth, pyinstaller etc. Imagem Docker de vários GB e mais brechas possíveis. **Validar no servidor antes de trocar** |
| Modelo do removedor de fundo (`u2net.onnx`) embutido na imagem/pasta local (`U2NET_HOME`) | Hoje o `rembg` baixa o modelo do GitHub no primeiro uso, o que exige internet |
| Container rodando como usuário comum + `.dockerignore` | Menor impacto se algo for explorado; não copia `node_modules`, logs etc. para a imagem |
| CI simples rodando `python -m unittest` a cada push | Garante que as correções não regridam |

## Fase 3 — Privacidade dos logs e CSP mais rígida 📋

| Item | Observação |
|---|---|
| Definir política para os logs antigos (ex.: compactar por mês) | Os logs **nunca** são apagados sem decisão explícita do responsável (diretriz de preservação) |
| Opção de registrar o nome do arquivo mascarado | Nomes de documentos podem conter dados pessoais (ex.: nome de cliente) |
| Remover `'unsafe-inline'` da CSP | Mover o script de tema para arquivo e trocar `onclick="..."` por `addEventListener` nos módulos |

## Fase 4 — Novas funcionalidades (ideias pendentes) 📋

| Ideia | Caminho sugerido |
|---|---|
| **OCR offline** (`ferramentas/ocr_pdf.py`, hoje vazio) | `ocrmypdf` + Tesseract local. Também resolve o caso em aberto do **PDF → Word editável** para PDFs com texto corrompido |
| **PDF/A** para arquivamento (`ferramentas/pdf_pdfa.py`, hoje vazio) | Ghostscript (já instalado) ou `ocrmypdf --output-type pdfa` |
| **Assinar PDF** (`ferramentas/assinar_pdf.py`, hoje vazio) | Assinatura visual (imagem/rubrica) e, depois, digital com certificado local (pyHanko) |
| Página "Privacidade" | Mostra ao usuário que nada sai da rede (CSP ativa, sem requisições externas) |

## Infraestrutura (fora do código) 📋

- Distribuir o certificado HTTPS via GPO para todas as estações do domínio.
- Exceção de domínio no antivírus corporativo (inspeção SSL).

## Baixa prioridade 💤

- **Celular / toque**: menu de suítes em telas pequenas, botões que hoje só aparecem com o mouse por cima e reordenação por toque. O uso esperado é desktop (~1 em 500 acessos pelo celular).
