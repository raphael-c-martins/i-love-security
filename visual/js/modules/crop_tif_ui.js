// visual/js/modules/crop_tif_ui.js

/**
 * Módulo "Recortar TIF" — Seleção rápida de páginas por intervalo.
 * Permite ao usuário digitar intervalos como "1-5, 7-9, 15-40"
 * ou clicar individualmente nas miniaturas para selecionar.
 * Reutiliza os endpoints /api/upload-tif-preview e /api/organizar-tif.
 */

window.cropTifSelectedPages = new Set();
window.cropTifTotalPages = 0;
window.currentCropTifJobId = null;
window.currentCropTifOriginalName = null;

/**
 * Interpreta uma string de intervalos (ex: "1-5, 7-9, 15, 40-50")
 * e retorna um Set com os números de página (1-indexed).
 * Ignora valores fora do range [1, maxPage].
 */
function parseTifRanges(input, maxPage) {
    const result = new Set();
    if (!input || !input.trim()) return result;

    const parts = input.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const rangeParts = trimmed.split('-').map(s => s.trim());

        if (rangeParts.length === 1) {
            // Página individual: "5"
            const num = parseInt(rangeParts[0], 10);
            if (!isNaN(num) && num >= 1 && num <= maxPage) {
                result.add(num);
            }
        } else if (rangeParts.length === 2) {
            // Intervalo: "1-5"
            const start = parseInt(rangeParts[0], 10);
            const end = parseInt(rangeParts[1], 10);
            if (!isNaN(start) && !isNaN(end)) {
                const lo = Math.max(1, Math.min(start, end));
                const hi = Math.min(maxPage, Math.max(start, end));
                for (let i = lo; i <= hi; i++) {
                    result.add(i);
                }
            }
        }
    }
    return result;
}

/**
 * Converte um Set de páginas selecionadas em uma string compacta
 * de intervalos (ex: Set{1,2,3,5,7,8,9} → "1-3, 5, 7-9").
 */
function formatRangesFromSet(pageSet) {
    const sorted = Array.from(pageSet).sort((a, b) => a - b);
    if (sorted.length === 0) return '';

    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
            end = sorted[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = sorted[i];
            end = sorted[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);

    return ranges.join(', ');
}

async function setupCropTifVisualEditor(file) {
    console.log("Iniciando Modo Recortar TIF...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-[95%] mx-auto py-6 animate-fade-in";

    window.cropTifSelectedPages = new Set();
    window.cropTifTotalPages = 0;
    window.currentCropTifJobId = null;
    window.currentCropTifOriginalName = file.name.replace(/\.[^/.]+$/, "");

    // Estrutura principal da UI
    const editorWrapper = document.createElement('div');
    editorWrapper.className = "flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]";

    editorWrapper.innerHTML = `
        <!-- Area Visual (Esquerda/Centro) -->
        <div class="flex-1 bg-gray-100 rounded-xl border border-gray-200 flex flex-col overflow-hidden relative">
            
            <div class="bg-white p-3 border-b border-gray-200 flex justify-between items-center z-10">
                <span class="text-sm font-bold text-gray-500 uppercase tracking-wide px-2">Selecione as Paginas</span>
                <div class="flex gap-2">
                    <button id="btn-select-all-crop" class="text-xs font-medium text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded transition">Selecionar Tudo</button>
                    <button id="btn-clear-crop" class="text-xs font-medium text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded transition">Limpar</button>
                </div>
            </div>

            <div id="crop-tif-grid" class="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 content-start custom-scrollbar">
                <div class="col-span-full h-full flex flex-col items-center justify-center text-gray-400" id="loading-crop-tif">
                    <svg class="w-10 h-10 animate-spin mb-3 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-sm font-medium">Extraindo paginas do TIF no servidor...</span>
                </div>
            </div>
        </div>

        <!-- Sidebar de Acao (Direita) -->
        <div class="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div class="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                    </div>
                    <div class="overflow-hidden">
                        <h2 class="text-lg font-bold text-gray-800">Recortar TIF</h2>
                        <p class="text-xs text-gray-400 truncate block" title="${file.name}">${file.name}</p>
                    </div>
                </div>

                <div class="space-y-4 flex-1">
                    <div>
                        <label class="text-xs font-bold text-gray-500 uppercase mb-2 block">Intervalo de Paginas</label>
                        <input type="text" id="crop-tif-range-input" 
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" 
                            placeholder="Ex: 1-5, 7-9, 15-40">
                        <p class="text-[10px] text-gray-400 mt-1">Digite os intervalos ou clique nas paginas.</p>
                    </div>

                    <div id="crop-tif-counter" class="bg-amber-50 border border-amber-100 text-amber-800 text-sm p-3 rounded-lg font-medium">
                        0 paginas selecionadas
                    </div>
                </div>

                <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                    <button id="process-btn-crop-tif" disabled class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>Recortar TIF</span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                    </button>
                    
                    <button id="btn-cancel-crop-tif" class="w-full bg-white border border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-200 font-medium py-2 px-4 rounded-lg transition text-sm">
                        Cancelar / Trocar
                    </button>
                </div>
            </div>
        </div>
    `;

    uploadContainer.appendChild(editorWrapper);

    // --- REFERÊNCIAS ---
    const grid = document.getElementById('crop-tif-grid');
    const rangeInput = document.getElementById('crop-tif-range-input');
    const counter = document.getElementById('crop-tif-counter');
    const processBtn = document.getElementById('process-btn-crop-tif');

    // --- CANCELAR ---
    document.getElementById('btn-cancel-crop-tif').onclick = () => {
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    // --- ATUALIZAR CONTADOR E ESTADO DO BOTÃO ---
    function updateCropCounter() {
        const count = window.cropTifSelectedPages.size;
        counter.innerText = count === 1 
            ? `1 pagina selecionada` 
            : `${count} paginas selecionadas`;
        processBtn.disabled = count === 0;
    }

    // --- SINCRONIZAR GRID → VISUAL ---
    function syncGridVisual() {
        for (let pageNum = 1; pageNum <= window.cropTifTotalPages; pageNum++) {
            const check = document.getElementById(`crop-check-${pageNum}`);
            const img = document.getElementById(`crop-img-${pageNum}`);
            if (!check || !img) continue;

            if (window.cropTifSelectedPages.has(pageNum)) {
                check.classList.remove('hidden');
                img.classList.add('opacity-90', 'ring-4', 'ring-amber-500/30');
            } else {
                check.classList.add('hidden');
                img.classList.remove('opacity-90', 'ring-4', 'ring-amber-500/30');
            }
        }
        updateCropCounter();
    }

    // --- LISTENER DO INPUT (digitação → grid) ---
    let inputTimeout = null;
    rangeInput.addEventListener('input', () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            window.cropTifSelectedPages = parseTifRanges(rangeInput.value, window.cropTifTotalPages);
            syncGridVisual();
        }, 150);
    });

    // --- ATUALIZAR INPUT A PARTIR DA SELEÇÃO (grid → input) ---
    function updateCropRangeInput() {
        rangeInput.value = formatRangesFromSet(window.cropTifSelectedPages);
        updateCropCounter();
    }

    // --- UPLOAD E EXIBIÇÃO ---
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

        window.currentCropTifJobId = data.job_id;
        const pages_b64 = data.pages;
        window.cropTifTotalPages = pages_b64.length;

        grid.innerHTML = '';

        for (let i = 0; i < pages_b64.length; i++) {
            const pageNum = i + 1;

            const wrapper = document.createElement('div');
            wrapper.className = "relative group cursor-pointer transition-transform transform hover:-translate-y-1 duration-200";

            const img = document.createElement('img');
            img.src = pages_b64[i];
            img.id = `crop-img-${pageNum}`;
            img.className = "w-full h-auto rounded-lg shadow-sm border border-gray-200 bg-white transition-all";

            // Badge do numero da pagina
            const numberBadge = document.createElement('div');
            numberBadge.className = "absolute bottom-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none backdrop-blur-sm";
            numberBadge.innerText = pageNum;

            // Overlay de seleção (check)
            const checkOverlay = document.createElement('div');
            checkOverlay.id = `crop-check-${pageNum}`;
            checkOverlay.className = "absolute inset-0 bg-amber-600/10 border-4 border-amber-500 rounded-lg hidden flex items-center justify-center z-10 pointer-events-none";
            checkOverlay.innerHTML = `<div class="bg-amber-500 text-white rounded-full p-1.5 shadow-md"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>`;

            // Clique individual (toggle)
            wrapper.onclick = () => {
                if (window.cropTifSelectedPages.has(pageNum)) {
                    window.cropTifSelectedPages.delete(pageNum);
                } else {
                    window.cropTifSelectedPages.add(pageNum);
                }
                syncGridVisual();
                updateCropRangeInput();
            };

            wrapper.appendChild(img);
            wrapper.appendChild(checkOverlay);
            wrapper.appendChild(numberBadge);
            grid.appendChild(wrapper);
        }

        // --- SELECIONAR TUDO ---
        document.getElementById('btn-select-all-crop').onclick = () => {
            window.cropTifSelectedPages.clear();
            for (let i = 1; i <= window.cropTifTotalPages; i++) {
                window.cropTifSelectedPages.add(i);
            }
            syncGridVisual();
            updateCropRangeInput();
        };

        // --- LIMPAR ---
        document.getElementById('btn-clear-crop').onclick = () => {
            window.cropTifSelectedPages.clear();
            syncGridVisual();
            updateCropRangeInput();
        };

        // --- PROCESSAR ---
        processBtn.onclick = async () => {
            if (window.cropTifSelectedPages.size === 0 || !window.currentCropTifJobId) return;

            const btn = processBtn;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `Processando...`;

            try {
                const baseName = window.currentCropTifOriginalName || "TIF";
                const filename = `${baseName}_recortado.tif`;
                const saveBlob = await window.getFileSaver(filename);
                if (!saveBlob) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    return;
                }

                // Converter páginas 1-indexed para 0-indexed (formato esperado pelo backend)
                const pageOrder = Array.from(window.cropTifSelectedPages)
                    .sort((a, b) => a - b)
                    .map(p => p - 1);

                const submitData = new FormData();
                submitData.append("job_id", window.currentCropTifJobId);
                submitData.append("page_order", pageOrder.join(','));

                const resp = await window.fetchWithProgress('/api/organizar-tif', {
                    method: 'POST',
                    body: submitData,
                    title: 'Recortar TIF',
                    filename: filename,
                    button: btn
                });

                if (resp.ok) {
                    const blob = await resp.blob();
                    await saveBlob(blob, filename);

                    if (window.showToast) window.showToast("TIF recortado com sucesso!", "success");
                    btn.innerHTML = "Concluido!";
                    setTimeout(() => {
                        if (window.resetCurrentTool) window.resetCurrentTool();
                    }, 2000);
                } else {
                    if (window.showToast) window.showToast("Erro no servidor ao recortar TIF.", "error");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            } catch (e) {
                console.error(e);
                if (window.showToast) window.showToast("Erro ao processar. Tente novamente.", "error");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

    } catch (e) {
        console.error(e);
        grid.innerHTML = `<div class="col-span-full text-center text-red-500">Falha ao processar o arquivo TIF.</div>`;
    }
}

window.setupCropTifVisualEditor = setupCropTifVisualEditor;
