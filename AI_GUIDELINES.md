# Diretrizes de Desenvolvimento e Memória do Projeto (AI Guidelines)

Este documento serve como um guia de referência rápida para qualquer interação futura com este projeto ("I Love Security"). A Inteligência Artificial (IA) deve ler este arquivo ao iniciar novas tarefas para garantir consistência.

## 1. Idioma e Comunicação
-   **Sempre Português do Brasil (PT-BR)**: Todo código (comentários), documentação (`README.md`, `task.md`, `walkthrough.md`, planos) e comunicação no chat devem ser em PT-BR.

## 2. Documentação Obrigatória
Ao implementar ou modificar funcionalidades, a IA deve **sempre** atualizar:
-   **`README.md`**: Refletir novas ferramentas ou mudanças na estrutura.
-   **`task.md`** (Artifact): Manter o status das tarefas atualizado.
-   **`walkthrough.md`** (Artifact): Documentar o "como foi feito" e testes realizados.
-   **`implementation_plan.md`** (Artifact): Se houver planejamento, mantê-lo atualizado e em PT-BR.

## 3. Padrões de Interface (UI/UX)
-   **Visualização de PDF**: Sempre que uma ferramenta exigir preview de páginas (ex: Juntar, Dividir, Organizar), seguir o padrão visual estabelecido em:
    -   `visual/js/modules/organize_ui.js`
    -   `visual/js/modules/split_ui.js`
-   **Componentes Obrigatórios em Previews**:
    -   Renderização via `pdf.js`.
    -   **Drag-and-Drop**: Permitir reordenação arrastando (se aplicável).
    -   **Navegação**: Setas (< >) para ajustes finos.
    -   **Identificação**: Badges grandes e claros com o número da página.
    -   **Loading**: Feedback visual de carregamento (spinners).
-   **Estilo**: Seguir a paleta de cores do `style.css` (vermelho/cinza/branco) e usar TailwindCSS.

## 4. Estrutura de Código
-   **Backend (`/ferramentas`)**: Lógica pesada em Python, separada por módulo.
-   **Frontend (`/visual`)**: HTML/JS puro. Scripts de ferramentas específicas devem ficar em `/visual/js/modules/`.
-   **API**: Usar `FastAPI` em `main.py` para conectar o frontend aos scripts Python.

## 5. Ferramentas Futuras (Roadmap)
-   `ocr_pdf.py`: Implementar reconhecimento de texto.
-   `assinar_pdf.py`: Assinatura digital.
-   `pdf_pdfa.py`: Conversão para PDF/A.

---
*Este arquivo deve ser lido pela IA no início de cada nova sessão para manter o contexto.*
