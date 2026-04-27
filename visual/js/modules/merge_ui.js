// visual/js/modules/merge_ui.js

window.mergeFiles = []; // Lista global para controlar a ordem

async function setupMergeVisualEditor(newFiles) {
    console.log("Iniciando Editor de Junção...");
    
    // Adiciona novos arquivos à lista existente (para permitir adicionar mais depois)
    // Filtra apenas PDFs
    for (let file of newFiles) {
        if (file.type === "application/pdf") {
            // Adicionamos um ID único para facilitar o Drag & Drop
            file.id = "file_" + Math.random().toString(36).substr(2, 9);
            window.mergeFiles.push(file);
        }
    }

    const uploadContainer = document.getElementById('upload-container');
    
    // Salva o HTML original se ainda não salvou
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    // Limpa e prepara o layout
    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-6xl mx-auto py-8 animate-fade-in";

    // Cria a estrutura
    const editor = document.createElement('div');
    editor.className = "flex flex-col gap-6";
    
    editor.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="mb-4 md:mb-0">
                <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span class="bg-red-100 text-red-600 p-2 rounded-lg"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4m-16 5l8 4 8-4"></path></svg></span>
                    Juntar PDF
                </h2>
                <p class="text-gray-500 text-sm mt-1">Arraste os arquivos para mudar a ordem.</p>
            </div>
            <div class="flex gap-3">
                 <button id="btn-add-more" class="bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-3 px-6 rounded-xl transition flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    Adicionar mais
                </button>
                <button id="btn-merge-process" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2">
                    <span>Juntar PDFs</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                </button>
            </div>
        </div>

        <div id="merge-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-h-[300px] p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            </div>
        
        <input type="file" id="more-files-input" class="hidden" multiple accept=".pdf">
    `;

    uploadContainer.appendChild(editor);

    // Renderiza os cards
    await renderMergeGrid();

    // Eventos
    document.getElementById('btn-add-more').onclick = () => document.getElementById('more-files-input').click();
    
    document.getElementById('more-files-input').onchange = (e) => {
        if(e.target.files.length > 0) setupMergeVisualEditor(e.target.files);
    };

    document.getElementById('btn-merge-process').onclick = processMerge;
}

// Renderiza o Grid e gera Thumbnails
async function renderMergeGrid() {
    const grid = document.getElementById('merge-grid');
    grid.innerHTML = '';

    if (window.mergeFiles.length === 0) {
        grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center text-gray-400 py-10">
            <p>Nenhum arquivo selecionado.</p>
        </div>`;
        return;
    }

    // Loop para criar cards
    for (let index = 0; index < window.mergeFiles.length; index++) {
        const file = window.mergeFiles[index];
        
        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-lg shadow-sm border border-gray-200 group relative cursor-move hover:shadow-md transition-all";
        card.draggable = true; // Habilita arrastar nativo
        card.dataset.index = index; // Guarda a posição atual

        // HTML do Card (Loading inicial)
        card.innerHTML = `
            <div class="aspect-[1/1.4] bg-gray-100 rounded mb-2 overflow-hidden relative flex items-center justify-center">
                <canvas id="thumb-${file.id}" class="w-full h-full object-contain"></canvas>
                <div id="loading-${file.id}" class="absolute inset-0 flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
            </div>
            <div class="text-xs font-medium text-gray-700 truncate text-center px-1" title="${file.name}">
                <span class="bg-gray-200 text-gray-600 px-1.5 rounded text-[10px] mr-1">${index + 1}</span>
                ${file.name}
            </div>
            <button onclick="removeMergeFile(${index})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10">✕</button>
        `;

        // Eventos de Drag & Drop
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragenter', (e) => e.preventDefault());

        grid.appendChild(card);

        // Gera Thumbnail (Assíncrono para não travar a tela)
        generateCoverThumbnail(file, `thumb-${file.id}`, `loading-${file.id}`);
    }
}

// Gera a capa (Página 1) usando PDF.js
async function generateCoverThumbnail(file, canvasId, loadingId) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1); // Pega só a página 1
        
        const viewport = page.getViewport({ scale: 0.5 }); // Scale 0.5 é leve e nítido pra card
        const canvas = document.getElementById(canvasId);
        if(!canvas) return; // Se o usuario removeu o card antes de carregar

        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        // Remove loading
        const loader = document.getElementById(loadingId);
        if(loader) loader.remove();

    } catch (e) {
        console.error("Erro thumb:", e);
    }
}

// --- LÓGICA DE DRAG & DROP ---
let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(this.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.4';
}

function handleDragOver(e) {
    e.preventDefault(); // Necessário para permitir o drop
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    const targetIndex = parseInt(this.dataset.index);

    if (draggedIndex !== null && draggedIndex !== targetIndex) {
        // Reordena o Array Global
        const itemMoved = window.mergeFiles.splice(draggedIndex, 1)[0];
        window.mergeFiles.splice(targetIndex, 0, itemMoved);
        
        // Re-renderiza o grid com a nova ordem
        renderMergeGrid();
    }
    this.style.opacity = '1';
    return false;
}

// Remover arquivo
window.removeMergeFile = function(index) {
    window.mergeFiles.splice(index, 1);
    renderMergeGrid();
    if (window.mergeFiles.length === 0) {
        // Se esvaziar, volta pro inicio (usa a função mágica do script.js)
        if(window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    }
};

// Processar Junção
async function processMerge() {
    const btn = document.getElementById('btn-merge-process');
    const originalText = btn.innerHTML;
    
    if (window.mergeFiles.length < 2) {
        if(window.showToast) window.showToast("Selecione pelo menos 2 arquivos.", "error");
        else alert("Selecione pelo menos 2 arquivos.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Juntando...`;

    const formData = new FormData();
    
    // AQUI ESTÁ O SEGREDO: Adiciona os arquivos NA ORDEM que estão no array visual
    window.mergeFiles.forEach(file => {
        formData.append("files", file);
    });

    try {
        const response = await fetch('/api/juntar', { method: 'POST', body: formData });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Tenta pegar o nome exato gerado pelo backend
            const backendFilename = response.headers.get("X-Filename");
            if (backendFilename) {
                a.download = backendFilename;
            } else {
                const timestamp = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
                a.download = `Junto_${timestamp}.pdf`;
            }
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            if(window.showToast) window.showToast("Sucesso! Download iniciado.", "success");
            
            btn.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Pronto!`;

            setTimeout(() => {
                if(window.resetCurrentTool) window.resetCurrentTool();
                else location.reload();
            }, 2000);
        } else {
            if(window.showToast) window.showToast("Erro no servidor.", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        if(window.showToast) window.showToast("Erro de conexão.", "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.setupMergeVisualEditor = setupMergeVisualEditor;