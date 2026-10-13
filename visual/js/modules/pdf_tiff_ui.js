// visual/js/modules/pdf_tiff_ui.js

/**
 * Interface unificada para conversão PDF ↔ TIFF Multipáginas
 * Permite alternar entre "PDF para TIFF" e "TIFF para PDF".
 * Um PDF de X páginas gera 1 único TIFF com X frames (e vice-versa).
 */
async function setupPdfTiffConverterVisualEditor(files) {
    console.log("Iniciando Editor PDF ↔ TIFF...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-5xl mx-auto py-8 animate-fade-in";

    const editor = document.createElement('div');
    editor.className = "flex flex-col lg:flex-row gap-8 items-start";

    editor.innerHTML = `
        <!-- COLUNA ESQUERDA: PREVIEW E INFO -->
        <div class="w-full lg:w-1/3 flex flex-col gap-4">
             <div class="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative min-h-[300px]">
                <canvas id="pdf-preview-canvas" class="hidden shadow-lg rounded max-w-full h-auto bg-white"></canvas>
                <img id="tiff-preview-img" class="hidden shadow-lg rounded max-w-full max-h-[280px] h-auto bg-white" />
                
                <!-- Ícone para TIFF (Fallback) -->
                <div id="tiff-preview-icon" class="hidden flex flex-col items-center">
                    <svg class="w-24 h-24 text-emerald-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                        <path fill="#fff" d="M14 8V2l6 6h-6z"/>
                        <text x="7" y="18" font-size="6" font-weight="bold" fill="#fff" font-family="sans-serif">TIF</text>
                    </svg>
                    <span class="text-slate-500 dark:text-slate-400 font-medium">Arquivo TIFF Multipáginas</span>
                </div>

                <div id="no-preview-msg" class="text-slate-400 dark:text-slate-500 text-sm">Preview indisponível</div>
                
                <div class="mt-4 text-center">
                    <p class="font-bold text-slate-800 dark:text-slate-200 truncate w-64" id="main-filename">...</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400" id="file-count-display">...</p>
                </div>
            </div>
            <button id="btn-cancel" class="w-full py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 rounded-xl">
                Cancelar e Voltar
            </button>
        </div>

        <!-- COLUNA DIREITA: CONTROLES -->
        <div class="w-full lg:w-2/3 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            
            <!-- CONTROLE DE MODO (Switch) -->
            <div class="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center mb-8 relative w-max mx-auto lg:mx-0">
                <button id="mode-pdf-to-tiff" class="px-6 py-2 rounded-md text-sm font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 z-10 w-40">
                    PDF para TIFF
                </button>
                <button id="mode-tiff-to-pdf" class="px-6 py-2 rounded-md text-sm font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 z-10 w-40">
                    TIFF para PDF
                </button>
                <div id="mode-indicator" class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-700 rounded shadow transition-all duration-300 left-1"></div>
            </div>

            <!-- MENSAGEM INFORMATIVA -->
            <div id="info-panel" class="mb-8 p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900 text-sm">
                <p id="info-text">Converta seus PDFs em arquivos TIFF multipáginas — cada página do PDF vira um frame dentro do TIFF.</p>
            </div>

            <!-- LISTA DE ARQUIVOS -->
            <div class="mb-4 flex justify-between items-center">
                 <h3 class="font-bold text-slate-800 dark:text-slate-200">Arquivos Selecionados</h3>
                 <button id="btn-add-more" class="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">+ Adicionar</button>
            </div>
            
            <div id="files-display-area" class="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-h-[300px] overflow-y-auto pr-1">
            </div>

            <button id="btn-process-tiff" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                <span>Converter</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
            
            <input type="file" id="tiff-file-input" class="hidden" multiple>
        </div>

        <!-- MODAL DE CONFIRMAÇÃO -->
        <div id="modal-confirm-switch-tiff" class="hidden fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 transform scale-100 transition-transform">
                <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Trocar de Modo?</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-6 text-sm">Mudar o modo limpará os arquivos atuais da lista. Deseja continuar?</p>
                <div class="flex justify-end gap-3">
                    <button class="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-xs" id="modal-btn-cancel-tiff">Cancelar</button>
                    <button class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-xs" id="modal-btn-confirm-tiff">Sim, Trocar</button>
                </div>
            </div>
        </div>
    `;

    uploadContainer.appendChild(editor);

    // --- ESTADO ---
    let currentMode = 'pdf-to-tiff';
    let currentFiles = [...files];
    let pendingModeSwitch = null;

    // Elementos
    const btnPdfToTiff = document.getElementById('mode-pdf-to-tiff');
    const btnTiffToPdf = document.getElementById('mode-tiff-to-pdf');
    const indicator = document.getElementById('mode-indicator');
    const filesArea = document.getElementById('files-display-area');
    const fileInput = document.getElementById('tiff-file-input');
    const processBtn = document.getElementById('btn-process-tiff');
    const infoText = document.getElementById('info-text');
    const mainFilename = document.getElementById('main-filename');
    const fileCountDisplay = document.getElementById('file-count-display');
    const canvasPreview = document.getElementById('pdf-preview-canvas');
    const tiffPreviewImg = document.getElementById('tiff-preview-img');
    const tiffIcon = document.getElementById('tiff-preview-icon');
    const noPreviewMsg = document.getElementById('no-preview-msg');

    // Modal
    const modal = document.getElementById('modal-confirm-switch-tiff');
    const modalBtnCancel = document.getElementById('modal-btn-cancel-tiff');
    const modalBtnConfirm = document.getElementById('modal-btn-confirm-tiff');

    // --- PREVIEW ---
    async function updatePreview() {
        if (currentFiles.length === 0) {
            canvasPreview.classList.add('hidden');
            if (tiffPreviewImg) tiffPreviewImg.classList.add('hidden');
            tiffIcon.classList.add('hidden');
            noPreviewMsg.classList.remove('hidden');
            mainFilename.innerText = "Nenhum arquivo";
            fileCountDisplay.innerText = "";
            return;
        }

        mainFilename.innerText = currentFiles[0].name;
        fileCountDisplay.innerText = currentFiles.length > 1 ? `+ ${currentFiles.length - 1} outros arquivos` : "";
        noPreviewMsg.classList.add('hidden');

        if (currentMode === 'pdf-to-tiff') {
            tiffIcon.classList.add('hidden');
            if (tiffPreviewImg) tiffPreviewImg.classList.add('hidden');
            canvasPreview.classList.remove('hidden');
            renderPdfCover(currentFiles[0]);
        } else {
            canvasPreview.classList.add('hidden');
            renderTifCover(currentFiles[0]);
        }
    }

    async function renderTifCover(file) {
        if (file && file.size <= 80 * 1024 * 1024 && window.renderTifPageClientSide) {
            try {
                const preview = await window.renderTifPageClientSide(file, 0, 300);
                if (preview && preview.dataUrl && tiffPreviewImg) {
                    tiffPreviewImg.src = preview.dataUrl;
                    tiffPreviewImg.classList.remove('hidden');
                    tiffIcon.classList.add('hidden');
                    return;
                }
            } catch (err) {
                console.warn("Preview TIF local falhou, usando ícone:", err);
            }
        }
        if (tiffPreviewImg) tiffPreviewImg.classList.add('hidden');
        tiffIcon.classList.remove('hidden');
    }

    async function renderPdfCover(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1.0 });
            const context = canvasPreview.getContext('2d');
            canvasPreview.height = viewport.height;
            canvasPreview.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
        } catch (e) {
            console.error("Erro preview PDF:", e);
        }
    }

    // --- UI DE MODO ---
    function updateModeUI() {
        if (currentMode === 'pdf-to-tiff') {
            indicator.style.left = '4px';
            btnPdfToTiff.classList.add('text-emerald-600');
            btnTiffToPdf.classList.remove('text-emerald-600');
            fileInput.accept = ".pdf";
            processBtn.querySelector('span').innerText = "Converter para TIFF";
            infoText.innerText = "Converta seus PDFs em arquivos TIFF multipáginas — cada página do PDF vira um frame dentro do TIFF.";
        } else {
            indicator.style.left = 'calc(50% + 1px)';
            btnTiffToPdf.classList.add('text-emerald-600');
            btnPdfToTiff.classList.remove('text-emerald-600');
            fileInput.accept = ".tif,.tiff";
            processBtn.querySelector('span').innerText = "Converter para PDF";
            infoText.innerText = "Transforme seus arquivos TIFF multipáginas em PDFs prontos para envio — cada frame do TIFF vira uma página.";
        }
        renderFilesList();
        updatePreview();
    }

    function renderFilesList() {
        filesArea.innerHTML = '';
        currentFiles.forEach((file, idx) => {
            const div = document.createElement('div');
            div.className = "relative bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-center group overflow-hidden";

            const ext = file.name.split('.').pop().toUpperCase();
            const isTifFile = ext === 'TIF' || ext === 'TIFF';
            const badgeColor = isTifFile ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';

            div.innerHTML = `
                <button onclick="removeTiffFile(${idx})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">✕</button>
                <div class="w-8 h-8 rounded ${badgeColor} flex items-center justify-center mb-1 text-xs font-bold uppercase">${ext}</div>
                <span class="text-xs font-medium text-gray-700 truncate w-full text-center" title="${file.name}">${file.name}</span>
            `;
            filesArea.appendChild(div);
        });

        if (currentFiles.length === 0) {
            processBtn.disabled = true;
            processBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            processBtn.disabled = false;
            processBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    window.removeTiffFile = (index) => {
        currentFiles.splice(index, 1);
        renderFilesList();
        updatePreview();
    };

    // --- TROCA DE MODO ---
    function trySwitchMode(targetMode) {
        if (currentMode === targetMode) return;

        let hasConflict = false;
        if (targetMode === 'pdf-to-tiff' && currentFiles.some(f => !f.name.toLowerCase().endsWith('.pdf'))) hasConflict = true;
        if (targetMode === 'tiff-to-pdf' && currentFiles.some(f => !f.name.toLowerCase().match(/\.tiff?$/))) hasConflict = true;

        if (currentFiles.length > 0 && hasConflict) {
            pendingModeSwitch = targetMode;
            modal.classList.remove('hidden');
        } else {
            currentMode = targetMode;
            updateModeUI();
        }
    }

    modalBtnCancel.onclick = () => {
        modal.classList.add('hidden');
        pendingModeSwitch = null;
    };

    modalBtnConfirm.onclick = () => {
        currentFiles = [];
        currentMode = pendingModeSwitch;
        updateModeUI();
        modal.classList.add('hidden');
    };

    btnPdfToTiff.onclick = () => trySwitchMode('pdf-to-tiff');
    btnTiffToPdf.onclick = () => trySwitchMode('tiff-to-pdf');

    // Adicionar mais arquivos
    document.getElementById('btn-add-more').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const newFiles = Array.from(e.target.files);
        let valid = true;

        if (currentMode === 'pdf-to-tiff') {
            valid = newFiles.every(f => f.name.toLowerCase().endsWith('.pdf'));
            if (!valid && window.showToast) window.showToast("Apenas arquivos PDF neste modo!", "error");
        } else {
            valid = newFiles.every(f => f.name.toLowerCase().match(/\.tiff?$/));
            if (!valid && window.showToast) window.showToast("Apenas arquivos TIF/TIFF neste modo!", "error");
        }

        if (valid) {
            currentFiles = [...currentFiles, ...newFiles];
            renderFilesList();
            updatePreview();
        }
        fileInput.value = '';
    };

    document.getElementById('btn-cancel').onclick = () => {
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    // --- PROCESSAR ---
    processBtn.onclick = async () => {
        if (currentFiles.length === 0) return;

        const originalText = processBtn.innerHTML;
        processBtn.disabled = true;
        processBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando...`;

        const endpoint = currentMode === 'pdf-to-tiff' ? "/api/pdf-para-tif" : "/api/tif-para-pdf";
        const formData = new FormData();
        currentFiles.forEach(file => formData.append("files", file));

        try {
            // Decidir o nome padrão com base no modo ANTES de enviar pro backend
            const timestamp = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
            let defaultFilename;

            if (currentFiles.length === 1) {
                // Arquivo único → nome baseado no original
                const baseName = currentFiles[0].name.replace(/\.[^/.]+$/, "");
                defaultFilename = currentMode === 'pdf-to-tiff'
                    ? `${baseName}.tif`
                    : `${baseName}.pdf`;
            } else {
                // Múltiplos → nome genérico com timestamp
                defaultFilename = currentMode === 'pdf-to-tiff'
                    ? `Convertido_${timestamp}.tif`
                    : `Convertido_${timestamp}.pdf`;
            }

            // Chama a janela do Windows IMEDIATAMENTE (resolve o erro de expiracão do clique)
            const saveBlob = await window.getFileSaver(defaultFilename);
            if (!saveBlob) {
                // Usuário fechou a janela "Salvar Como"
                processBtn.innerHTML = originalText;
                processBtn.disabled = false;
                return;
            }

            const totalBytes = currentFiles.reduce((acc, f) => acc + (f.size || 0), 0);
            const response = await window.fetchWithProgress(endpoint, {
                method: 'POST',
                body: formData,
                title: currentMode === 'pdf-to-tiff' ? 'PDF para TIFF' : 'TIFF para PDF',
                filename: currentFiles[0]?.name || 'documento',
                fileSize: totalBytes,
                button: processBtn
            });

            if (response.ok) {
                const blob = await response.blob();
                
                // Extrai nome alternativo caso o servidor mande
                let finalFilename = defaultFilename;
                const disposition = response.headers.get('Content-Disposition');
                if (disposition && disposition.indexOf('filename=') !== -1) {
                    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                    if (matches != null && matches[1]) {
                        finalFilename = matches[1].replace(/['"]/g, '');
                    }
                }

                // Efetua a gravação do arquivo (a janela já foi confirmada)
                await saveBlob(blob, finalFilename);

                if (window.showToast) window.showToast("Conversão concluída! Arquivo salvo.", "success");
                processBtn.innerHTML = `Concluído!`;
                setTimeout(() => {
                    if (window.resetCurrentTool) window.resetCurrentTool();
                }, 2000);

            } else {
                if (response.status === 413) {
                    if (window.showToast) window.showToast("Arquivo muito grande. O tamanho excede o limite permitido pelo servidor.", "error");
                } else {
                    if (window.showToast) window.showToast("Erro no servidor. Verifique o arquivo e tente novamente.", "error");
                }
                processBtn.innerHTML = originalText;
                processBtn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            if (window.showToast) window.showToast("Erro de conexão com o servidor.", "error");
            processBtn.innerHTML = originalText;
            processBtn.disabled = false;
        }
    };

    // --- DECIDIR MODO INICIAL ---
    if (files.length > 0) {
        const firstFile = files[0].name.toLowerCase();
        if (firstFile.match(/\.tiff?$/)) {
            currentMode = 'tiff-to-pdf';
        } else {
            currentMode = 'pdf-to-tiff';
        }
        updateModeUI();
    } else {
        updateModeUI();
    }
}

window.setupPdfTiffConverterVisualEditor = setupPdfTiffConverterVisualEditor;
