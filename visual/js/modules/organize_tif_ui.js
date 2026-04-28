// visual/js/modules/organize_tif_ui.js

window.pageOrderTif = []; // Armazena a ordem atual
window.currentTifJobId = null;

async function setupOrganizeTifVisualEditor(file) {
    console.log("Iniciando Modo Organizador TIF...");

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
                <span class="text-sm font-bold text-gray-500 uppercase tracking-wide px-2">Organizador Visual de TIF</span>
                <div class="flex gap-2">
                    <button id="btn-reset-order-tif" class="text-xs font-medium text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded transition hidden">Redefinir Ordem</button>
                </div>
            </div>

            <div id="organize-tif-grid" class="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 content-start custom-scrollbar">
                <div class="col-span-full h-full flex flex-col items-center justify-center text-gray-400" id="loading-tif">
                    <svg class="w-10 h-10 animate-spin mb-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-sm font-medium">Extraindo páginas do TIF no servidor...</span>
                </div>
            </div>
        </div>

        <!-- Sidebar de Ação (Direita) -->
        <div class="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div class="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    </div>
                    <div class="overflow-hidden">
                        <h2 class="text-lg font-bold text-gray-800">Organizar TIF</h2>
                        <p class="text-xs text-gray-400 truncate block" title="${file.name}">${file.name}</p>
                    </div>
                </div>

                <div class="space-y-4 flex-1 text-sm text-gray-600">
                    <p>Use as setas nas miniaturas para reordenar as páginas.</p>
                    <p class="text-xs text-gray-400">Páginas removidas no "X" não farão parte do TIF final.</p>
                </div>

                <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                    <button id="process-btn-organize-tif" disabled class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>Organizar TIF</span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    
                    <button id="btn-cancel-tif" class="w-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 font-medium py-2 px-4 rounded-lg transition text-sm">
                        Cancelar / Trocar
                    </button>
                </div>
            </div>
        </div>
    `;

    uploadContainer.appendChild(editorWrapper);

    document.getElementById('btn-cancel-tif').onclick = () => {
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    // Faz o upload inicial para pegar os previews
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload-tif-preview", {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Erro no upload do TIF");
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        window.currentTifJobId = data.job_id;
        const pages_b64 = data.pages;

        window.pageOrderTif = Array.from({ length: pages_b64.length }, (_, i) => i);
        window.pageElementsCacheTif = {};

        const grid = document.getElementById('organize-tif-grid');
        grid.innerHTML = ''; 

        let draggedItem = null;

        window.handleDragStartTif = (e, index) => {
            draggedItem = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => e.target.classList.add('opacity-50'), 0);
        };

        window.handleDragEndTif = (e) => {
            e.target.classList.remove('opacity-50');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'ring-2', 'ring-red-500', 'scale-105'));
            draggedItem = null;
        };

        window.handleDragOverTif = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; };
        window.handleDragEnterTif = (e) => { e.target.closest('.group').classList.add('drag-over', 'ring-2', 'ring-red-500', 'scale-105'); };
        window.handleDragLeaveTif = (e) => { e.target.closest('.group').classList.remove('drag-over', 'ring-2', 'ring-red-500', 'scale-105'); };

        window.handleDropTif = (e, targetOriginalIndex) => {
            e.stopPropagation();
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'ring-2', 'ring-red-500', 'scale-105'));

            if (draggedItem === null || draggedItem === targetOriginalIndex) return;

            const fromIndex = window.pageOrderTif.indexOf(draggedItem);
            const toIndex = window.pageOrderTif.indexOf(targetOriginalIndex);

            if (fromIndex > -1 && toIndex > -1) {
                const item = window.pageOrderTif.splice(fromIndex, 1)[0];
                window.pageOrderTif.splice(toIndex, 0, item);
                renderGridTif();
            }
            return false;
        };

        for (let i = 0; i < pages_b64.length; i++) {
            const pageNum = i + 1;

            const wrapper = document.createElement('div');
            wrapper.className = "relative group transition-all duration-300 ease-in-out transform cursor-move";
            wrapper.draggable = true;
            wrapper.dataset.originalIndex = i;

            wrapper.addEventListener('dragstart', (e) => window.handleDragStartTif(e, i));
            wrapper.addEventListener('dragend', window.handleDragEndTif);
            wrapper.addEventListener('dragover', window.handleDragOverTif);
            wrapper.addEventListener('dragenter', window.handleDragEnterTif);
            wrapper.addEventListener('dragleave', window.handleDragLeaveTif);
            wrapper.addEventListener('drop', (e) => window.handleDropTif(e, i));

            const closeBtn = document.createElement('button');
            closeBtn.className = "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md hover:scale-110";
            closeBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
            closeBtn.onclick = (e) => { e.stopPropagation(); removePageTif(i); };

            const img = document.createElement('img');
            img.src = pages_b64[i];
            img.className = "w-full h-auto rounded-lg shadow-sm border border-gray-200 bg-white group-hover:shadow-md pointer-events-none";

            const controlsOverlay = document.createElement('div');
            controlsOverlay.className = "absolute bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-1 flex justify-between items-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity z-10";

            const leftBtn = document.createElement('button');
            leftBtn.className = "text-white hover:text-red-400 p-1";
            leftBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>`;
            leftBtn.onclick = (e) => { e.stopPropagation(); movePageTif(i, -1); };

            const numberSpan = document.createElement('span');
            numberSpan.className = "text-white text-xs font-bold font-mono page-number-indicator";
            numberSpan.innerText = pageNum;

            const rightBtn = document.createElement('button');
            rightBtn.className = "text-white hover:text-red-400 p-1";
            rightBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
            rightBtn.onclick = (e) => { e.stopPropagation(); movePageTif(i, 1); };

            controlsOverlay.appendChild(leftBtn);
            controlsOverlay.appendChild(numberSpan);
            controlsOverlay.appendChild(rightBtn);

            const originalBadge = document.createElement('div');
            originalBadge.className = "absolute top-2 left-2 bg-gray-800 text-white text-sm font-bold px-2 py-1 rounded shadow-md pointer-events-none z-10";
            originalBadge.innerText = `#${pageNum}`;

            wrapper.appendChild(closeBtn);
            wrapper.appendChild(img);
            wrapper.appendChild(controlsOverlay);
            wrapper.appendChild(originalBadge);

            window.pageElementsCacheTif[i] = wrapper;
        }

        document.getElementById('btn-reset-order-tif').classList.remove('hidden');
        document.getElementById('process-btn-organize-tif').disabled = false;

        renderGridTif();

    } catch (e) {
        console.error(e);
        const grid = document.getElementById('organize-tif-grid');
        if(grid) grid.innerHTML = `<div class="col-span-full text-center text-red-500">Falha ao processar o arquivo TIF.</div>`;
    }

    document.getElementById('btn-reset-order-tif').onclick = () => {
        if (window.pageElementsCacheTif) {
            window.pageOrderTif = Object.keys(window.pageElementsCacheTif).map(Number).sort((a, b) => a - b);
            renderGridTif();
        }
    };

    document.getElementById('process-btn-organize-tif').onclick = submitOrganizeTif;
}

function renderGridTif() {
    const grid = document.getElementById('organize-tif-grid');
    if (!grid) return;
    grid.innerHTML = '';

    window.pageOrderTif.forEach((originalIndex, visualIndex) => {
        const wrapper = window.pageElementsCacheTif[originalIndex];
        if (wrapper) {
            grid.appendChild(wrapper);
            const indicator = wrapper.querySelector('.page-number-indicator');
            if (indicator) indicator.innerText = visualIndex + 1;
        }
    });
}

function movePageTif(originalIndex, direction) {
    const currentIndex = window.pageOrderTif.indexOf(originalIndex);
    if (currentIndex === -1) return;
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= window.pageOrderTif.length) return;

    const temp = window.pageOrderTif[newIndex];
    window.pageOrderTif[newIndex] = window.pageOrderTif[currentIndex];
    window.pageOrderTif[currentIndex] = temp;
    renderGridTif();
}

function removePageTif(originalIndex) {
    const currentIndex = window.pageOrderTif.indexOf(originalIndex);
    if (currentIndex > -1) {
        window.pageOrderTif.splice(currentIndex, 1);
        renderGridTif();
    }
}

async function submitOrganizeTif() {
    if (!window.currentTifJobId || window.pageOrderTif.length === 0) return;

    const btn = document.getElementById('process-btn-organize-tif');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `Processando...`;

    try {
        const formData = new FormData();
        formData.append("job_id", window.currentTifJobId);
        formData.append("page_order", window.pageOrderTif.join(','));

        const response = await fetch('/api/organizar-tif', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "TIF_Organizado.tif";
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

window.setupOrganizeTifVisualEditor = setupOrganizeTifVisualEditor;
