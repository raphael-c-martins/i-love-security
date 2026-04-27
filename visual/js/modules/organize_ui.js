// visual/js/modules/organize_ui.js

window.pageOrder = []; // Armazena a ordem atual dos índices das páginas (0-indexed)

async function setupOrganizeVisualEditor(file) {
    console.log("Iniciando Modo Organizador...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-[95%] mx-auto py-6 animate-fade-in";

    // Estrutura principal da UI
    const editorWrapper = document.createElement('div');
    editorWrapper.className = "flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]";

    editorWrapper.innerHTML = `
        <!-- Área Visual (Esquerda/Centro) -->
        <div class="flex-1 bg-gray-100 rounded-xl border border-gray-200 flex flex-col overflow-hidden relative">
            
            <div class="bg-white p-3 border-b border-gray-200 flex justify-between items-center z-10">
                <span class="text-sm font-bold text-gray-500 uppercase tracking-wide px-2">Organizador Visual</span>
                <div class="flex gap-2">
                    <button id="btn-reset-order" class="text-xs font-medium text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded transition">Redefinir Ordem</button>
                    <!-- Futuro: Botão de deletar selecionados? Por enquanto simplificado -->
                </div>
            </div>

            <div id="organize-grid" class="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 content-start custom-scrollbar">
                <div class="col-span-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg class="w-10 h-10 animate-spin mb-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-sm font-medium">Renderizando páginas...</span>
                </div>
            </div>
        </div>

        <!-- Sidebar de Ação (Direita) -->
        <div class="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    </div>
                    <div class="overflow-hidden">
                        <h2 class="text-lg font-bold text-gray-800">Organizar PDF</h2>
                        <p class="text-xs text-gray-400 truncate block" title="${file.name}">${file.name}</p>
                    </div>
                </div>

                <div class="space-y-4 flex-1 text-sm text-gray-600">
                    <p>Use as setas nas miniaturas para mover as páginas.</p>
                    <p class="text-xs text-gray-400">Clique no "X" para remover uma página (ela não será incluída no arquivo final).</p>
                </div>

                <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                    <button id="process-btn-organize" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                        <span>Organizar PDF</span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    
                    <button id="btn-cancel" class="w-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 font-medium py-2 px-4 rounded-lg transition text-sm">
                        Cancelar / Trocar
                    </button>
                </div>
            </div>
        </div>
    `;

    uploadContainer.appendChild(editorWrapper);

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const grid = document.getElementById('organize-grid');

        // Inicializa a ordem das páginas (0 a n-1)
        window.pageOrder = Array.from({ length: pdf.numPages }, (_, i) => i);

        // Cache visual para não precisar re-renderizar o canvas ao mover
        window.pageElementsCache = {};

        grid.innerHTML = ''; // Limpa loading

        // --- FUNÇÕES DE DRAG AND DROP ---
        let draggedItem = null;

        window.handleDragStart = (e, index) => {
            draggedItem = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            // Visual feedback
            setTimeout(() => e.target.classList.add('opacity-50'), 0);
        };

        window.handleDragEnd = (e) => {
            e.target.classList.remove('opacity-50');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'ring-2', 'ring-red-500', 'scale-105'));
            draggedItem = null;
        };

        window.handleDragOver = (e) => {
            e.preventDefault(); // Necessário para permitir o drop
            e.dataTransfer.dropEffect = 'move';
            return false;
        };

        window.handleDragEnter = (e) => {
            e.target.closest('.group').classList.add('drag-over', 'ring-2', 'ring-red-500', 'scale-105');
        };

        window.handleDragLeave = (e) => {
            e.target.closest('.group').classList.remove('drag-over', 'ring-2', 'ring-red-500', 'scale-105');
        };

        window.handleDrop = (e, targetOriginalIndex) => {
            e.stopPropagation();

            // Remove estilos visuais
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'ring-2', 'ring-red-500', 'scale-105'));

            if (draggedItem === null || draggedItem === targetOriginalIndex) return;

            const fromIndex = window.pageOrder.indexOf(draggedItem);
            const toIndex = window.pageOrder.indexOf(targetOriginalIndex);

            if (fromIndex > -1 && toIndex > -1) {
                // Move o item no array
                const item = window.pageOrder.splice(fromIndex, 1)[0];
                window.pageOrder.splice(toIndex, 0, item);
                renderGrid();
            }
            return false;
        };

        // Renderiza todas as páginas
        for (let i = 0; i < pdf.numPages; i++) {
            // Ajustamos indice visual para ser i+1
            const pageNum = i + 1;
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.4 }); // Escala menor para grid

            const wrapper = document.createElement('div');
            // Adicionando atributos de Drag and Drop
            wrapper.className = "relative group transition-all duration-300 ease-in-out transform cursor-move";
            wrapper.draggable = true;
            wrapper.dataset.originalIndex = i; // Índice original (0-based) que será enviado ao backend
            wrapper.id = `page-card-${i}`;

            // Event Listeners para DnD
            wrapper.addEventListener('dragstart', (e) => window.handleDragStart(e, i));
            wrapper.addEventListener('dragend', window.handleDragEnd);
            wrapper.addEventListener('dragover', window.handleDragOver);
            wrapper.addEventListener('dragenter', window.handleDragEnter);
            wrapper.addEventListener('dragleave', window.handleDragLeave);
            wrapper.addEventListener('drop', (e) => window.handleDrop(e, i));


            // Botão Fechar (Remover)
            const closeBtn = document.createElement('button');
            closeBtn.className = "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md hover:scale-110";
            closeBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                removePage(i);
            };

            // Canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = "w-full h-auto rounded-lg shadow-sm border border-gray-200 bg-white group-hover:shadow-md pointer-events-none"; // pointer-events-none no canvas ajuda no drag

            // Renderização
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // Overlay com Número da Página (Visual) e Controles
            const controlsOverlay = document.createElement('div');
            controlsOverlay.className = "absolute bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-1 flex justify-between items-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity z-10";

            // Botão Esquerda
            const leftBtn = document.createElement('button');
            leftBtn.className = "text-white hover:text-red-400 p-1";
            leftBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>`;
            leftBtn.onclick = (e) => { e.stopPropagation(); movePage(i, -1); };

            // Número Atual
            const numberSpan = document.createElement('span');
            numberSpan.className = "text-white text-xs font-bold font-mono page-number-indicator";
            numberSpan.innerText = pageNum;

            // Botão Direita
            const rightBtn = document.createElement('button');
            rightBtn.className = "text-white hover:text-red-400 p-1";
            rightBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
            rightBtn.onclick = (e) => { e.stopPropagation(); movePage(i, 1); };

            controlsOverlay.appendChild(leftBtn);
            controlsOverlay.appendChild(numberSpan);
            controlsOverlay.appendChild(rightBtn);

            wrapper.appendChild(closeBtn);
            wrapper.appendChild(canvas);
            wrapper.appendChild(controlsOverlay);

            // Badge fixo do número original (AUMENTADO conforme pedido)
            const originalBadge = document.createElement('div');
            originalBadge.className = "absolute top-2 left-2 bg-gray-800 text-white text-sm font-bold px-2 py-1 rounded shadow-md pointer-events-none z-10";
            originalBadge.innerText = `#${pageNum}`;
            wrapper.appendChild(originalBadge);

            window.pageElementsCache[i] = wrapper;
        }

        renderGrid();

    } catch (e) {
        console.error(e);
        alert("Erro ao carregar PDF para organização.");
    }

    // Handlers dos botões principais
    document.getElementById('btn-reset-order').onclick = () => {
        // Restaura ordem original e todas as páginas
        if (window.pageElementsCache) {
            window.pageOrder = Object.keys(window.pageElementsCache).map(Number).sort((a, b) => a - b);
            renderGrid();
        }
    };

    document.getElementById('btn-cancel').onclick = () => {
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    document.getElementById('process-btn-organize').onclick = submitOrganize;
}

function renderGrid() {
    const grid = document.getElementById('organize-grid');
    grid.innerHTML = '';

    window.pageOrder.forEach((originalIndex, visualIndex) => {
        const wrapper = window.pageElementsCache[originalIndex];
        if (wrapper) {
            grid.appendChild(wrapper);
            // Atualiza o número visual na barra de controle
            const indicator = wrapper.querySelector('.page-number-indicator');
            if (indicator) indicator.innerText = visualIndex + 1;
        }
    });
}

function movePage(originalIndex, direction) {
    const currentIndex = window.pageOrder.indexOf(originalIndex);
    if (currentIndex === -1) return; // Não encontrado

    const newIndex = currentIndex + direction;

    // Limites
    if (newIndex < 0 || newIndex >= window.pageOrder.length) return;

    // Swap
    const temp = window.pageOrder[newIndex];
    window.pageOrder[newIndex] = window.pageOrder[currentIndex];
    window.pageOrder[currentIndex] = temp;

    // Re-renderizar (reordenar DOM)
    renderGrid();
}

function removePage(originalIndex) {
    const currentIndex = window.pageOrder.indexOf(originalIndex);
    if (currentIndex > -1) {
        window.pageOrder.splice(currentIndex, 1);
        renderGrid();
    }
}

async function submitOrganize() {
    const btn = document.getElementById('process-btn-organize');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `Processando...`;

    try {
        const formData = new FormData();
        // Presume-se que 'file' ainda está acessível ou passamos via closure? 
        // Como setupOrganizeVisualEditor recebe 'file', precisamos garanti-lo.
        // O input #file-input ainda deve ter o arquivo.
        const fileInput = document.getElementById('file-input');
        if (fileInput.files.length === 0) throw new Error("Arquivo perdido.");

        formData.append("file", fileInput.files[0]);
        // Envia string "0,2,1..."
        formData.append("page_order", window.pageOrder.join(','));

        const response = await fetch('/api/organizar', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "documento_organizado.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            btn.innerHTML = "Concluído!";
            setTimeout(() => {
                if (window.resetCurrentTool) window.resetCurrentTool();
            }, 2000);
        } else {
            alert("Erro no servidor.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao processar.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.setupOrganizeVisualEditor = setupOrganizeVisualEditor;
