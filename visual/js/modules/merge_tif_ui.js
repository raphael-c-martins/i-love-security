// visual/js/modules/merge_tif_ui.js

window.mergeTifFiles = []; // Lista global para controlar a ordem dos arquivos TIF

async function setupMergeTifVisualEditor(newFiles) {
    console.log("Iniciando Editor Visual de Junção TIF...");

    // Adiciona novos arquivos TIF ou Imagens à lista
    for (let file of newFiles) {
        const isTif = file.name.match(/\.(tif|tiff)$/i);
        const isImg = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp)$/i);
        if (isTif || isImg) {
            file.id = "tif_file_" + Math.random().toString(36).substr(2, 9);
            window.mergeTifFiles.push(file);
        }
    }

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-6xl mx-auto py-8 animate-fade-in";

    const editor = document.createElement('div');
    editor.className = "flex flex-col gap-6";

    editor.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="mb-4 md:mb-0">
                <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span class="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4m-16 5l8 4 8-4"></path></svg>
                    </span>
                    Juntar TIF
                </h2>
                <p class="text-gray-500 text-sm mt-1">Arraste os arquivos para mudar a ordem final do TIF multipáginas.</p>
            </div>
            <div class="flex gap-3">
                 <button id="btn-add-more-tif" class="bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-3 px-6 rounded-xl transition flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    Adicionar mais
                </button>
                <button id="btn-merge-tif-process" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2">
                    <span>Juntar TIFs</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                </button>
            </div>
        </div>

        <div id="merge-tif-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-h-[300px] p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        </div>
        
        <input type="file" id="more-tif-files-input" class="hidden" multiple accept=".tif,.tiff,.jpg,.jpeg,.png">
    `;

    uploadContainer.appendChild(editor);

    await renderMergeTifGrid();

    document.getElementById('btn-add-more-tif').onclick = () => document.getElementById('more-tif-files-input').click();
    document.getElementById('more-tif-files-input').onchange = (e) => {
        if (e.target.files.length > 0) setupMergeTifVisualEditor(e.target.files);
    };

    document.getElementById('btn-merge-tif-process').onclick = processMergeTif;
}

async function renderMergeTifGrid() {
    const grid = document.getElementById('merge-tif-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (window.mergeTifFiles.length === 0) {
        grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center text-gray-400 py-10">
            <p>Nenhum arquivo selecionado.</p>
        </div>`;
        return;
    }

    for (let index = 0; index < window.mergeTifFiles.length; index++) {
        const file = window.mergeTifFiles[index];

        const card = document.createElement('div');
        card.className = "bg-white p-3 rounded-lg shadow-sm border border-gray-200 group relative cursor-move hover:shadow-md transition-all flex flex-col justify-between";
        card.draggable = true;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="aspect-[1/1.4] bg-gray-100 rounded mb-2 overflow-hidden relative flex items-center justify-center">
                <img id="thumb-${file.id}" class="w-full h-full object-contain hidden" />
                <div id="loading-${file.id}" class="absolute inset-0 flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
            </div>
            <div class="text-xs font-medium text-gray-700 truncate text-center px-1" title="${file.name}">
                <span class="bg-indigo-100 text-indigo-700 px-1.5 rounded text-[10px] mr-1 font-bold">${index + 1}</span>
                ${file.name}
            </div>
            <button onclick="removeMergeTifFile(${index})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10">✕</button>
        `;

        card.addEventListener('dragstart', handleTifDragStart);
        card.addEventListener('dragover', handleTifDragOver);
        card.addEventListener('drop', handleTifDrop);
        card.addEventListener('dragenter', (e) => e.preventDefault());

        grid.appendChild(card);

        generateTifCardThumbnail(file, `thumb-${file.id}`, `loading-${file.id}`);
    }
}

async function generateTifCardThumbnail(file, imgId, loadingId) {
    try {
        const imgEl = document.getElementById(imgId);
        const loadingEl = document.getElementById(loadingId);
        if (!imgEl) return;

        // Se for imagem normal (JPG, PNG, WEBP)
        if (file.type.startsWith('image/') && !file.name.match(/\.(tif|tiff)$/i)) {
            const url = URL.createObjectURL(file);
            imgEl.src = url;
            imgEl.classList.remove('hidden');
            if (loadingEl) loadingEl.remove();
            return;
        }

        // Para arquivos TIF, tentar gerar miniatura localmente via UTIF.js (Zero consumo de rede)
        if (file.size <= 80 * 1024 * 1024 && window.renderTifPageClientSide) {
            try {
                const preview = await window.renderTifPageClientSide(file, 0, 180);
                if (preview && preview.dataUrl) {
                    imgEl.src = preview.dataUrl;
                    imgEl.classList.remove('hidden');
                    if (loadingEl) loadingEl.remove();
                    return;
                }
            } catch (errUtif) {
                console.warn("Fallback de preview TIF:", errUtif);
            }
        }

        // Se o arquivo for maior que 80MB ou se a decodificação local falhar, usa backend ou ícone seguro
        if (file.size > 80 * 1024 * 1024) {
            imgEl.src = "/visual/img/logo.png";
            imgEl.classList.remove('hidden');
            if (loadingEl) loadingEl.remove();
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("only_first", "true");

        const res = await fetch("/api/upload-tif-preview", { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            if (data.pages && data.pages.length > 0) {
                imgEl.src = data.pages[0];
                imgEl.classList.remove('hidden');
            } else {
                imgEl.src = "/visual/img/logo.png";
                imgEl.classList.remove('hidden');
            }
        } else {
            imgEl.src = "/visual/img/logo.png";
            imgEl.classList.remove('hidden');
        }
        if (loadingEl) loadingEl.remove();
    } catch (e) {
        console.error("Erro ao gerar thumbnail TIF:", e);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
    }
}

let draggedTifIndex = null;

function handleTifDragStart(e) {
    draggedTifIndex = parseInt(this.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.4';
}

function handleTifDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleTifDrop(e) {
    e.stopPropagation();
    const targetIndex = parseInt(this.dataset.index);

    if (draggedTifIndex !== null && draggedTifIndex !== targetIndex) {
        const itemMoved = window.mergeTifFiles.splice(draggedTifIndex, 1)[0];
        window.mergeTifFiles.splice(targetIndex, 0, itemMoved);
        renderMergeTifGrid();
    }
    this.style.opacity = '1';
    return false;
}

window.removeMergeTifFile = function(index) {
    window.mergeTifFiles.splice(index, 1);
    renderMergeTifGrid();
    if (window.mergeTifFiles.length === 0) {
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    }
};

async function processMergeTif() {
    const btn = document.getElementById('btn-merge-tif-process');
    const originalText = btn.innerHTML;

    if (window.mergeTifFiles.length < 2) {
        if (window.showToast) window.showToast("Selecione pelo menos 2 arquivos para juntar.", "error");
        else alert("Selecione pelo menos 2 arquivos.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Juntando TIFs...`;

    const formData = new FormData();
    window.mergeTifFiles.forEach(file => {
        formData.append("files", file);
    });

    try {
        const timestamp = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
        let filename = `TIF_Juntado_${timestamp}.tif`;

        const saveBlob = await window.getFileSaver(filename);
        if (!saveBlob) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const totalBytes = currentFiles.reduce((acc, f) => acc + (f.size || 0), 0);
        const response = await window.fetchWithProgress('/api/juntar-tiffs', {
            method: 'POST',
            body: formData,
            title: 'Juntar TIF',
            filename: currentFiles[0]?.name || 'documento',
            fileSize: totalBytes,
            button: btn
        });

        if (response.ok) {
            const blob = await response.blob();
            const backendFilename = response.headers.get("X-Filename");
            if (backendFilename) filename = backendFilename;

            await saveBlob(blob, filename);

            if (window.showToast) window.showToast("Sucesso! Download do TIF iniciado.", "success");

            btn.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Pronto!`;

            setTimeout(() => {
                window.mergeTifFiles = [];
                if (window.resetCurrentTool) window.resetCurrentTool();
                else location.reload();
            }, 2000);
        } else {
            if (window.showToast) window.showToast("Erro ao juntar arquivos TIF no servidor.", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        if (window.showToast) window.showToast("Erro de conexão.", "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.setupMergeTifVisualEditor = setupMergeTifVisualEditor;
