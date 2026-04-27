// visual/js/modules/image_ui.js

/**
 * Interface unificada para conversão PDF <-> Imagem
 * Permite alternar entre os modos "PDF para Imagem" e "Imagem para PDF".
 */
async function setupImageConverterVisualEditor(files) {
    console.log("Iniciando Editor de Imagem Unificado v2...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-5xl mx-auto py-8 animate-fade-in";

    // Cria a estrutura visual
    const editor = document.createElement('div');
    editor.className = "flex flex-col lg:flex-row gap-8 items-start";

    editor.innerHTML = `
        <!-- COLUNA ESQUERDA: PREVIEW E INFO -->
        <div class="w-full lg:w-1/3 flex flex-col gap-4">
             <div class="bg-gray-100 p-8 rounded-2xl border border-gray-200 flex flex-col items-center justify-center relative min-h-[300px]">
                <canvas id="pdf-preview-canvas" class="hidden shadow-lg rounded max-w-full h-auto bg-white"></canvas>
                <div id="images-preview-grid" class="hidden w-full grid grid-cols-2 gap-2"></div>
                <div id="no-preview-msg" class="text-gray-400 text-sm">Preview indisponível</div>
                
                <div class="mt-4 text-center">
                    <p class="font-bold text-gray-700 truncate w-64" id="main-filename">...</p>
                    <p class="text-sm text-gray-500" id="file-count-display">...</p>
                </div>
            </div>
            <button id="btn-cancel" class="w-full py-3 text-gray-500 hover:text-red-600 font-medium transition bg-white border border-gray-200 hover:border-red-200 rounded-xl">
                Cancelar e Voltar
            </button>
        </div>

        <!-- COLUNA DIREITA: CONTROLES -->
        <div class="w-full lg:w-2/3 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            
            <!-- CONTROLE DE MODO (Switch) -->
            <div class="bg-gray-100 p-1 rounded-lg flex items-center mb-8 relative w-max mx-auto lg:mx-0">
                <button id="mode-pdf-to-img" class="px-6 py-2 rounded-md text-sm font-bold transition-all text-gray-600 hover:text-gray-900 z-10 w-40">
                    PDF para Imagem
                </button>
                <button id="mode-img-to-pdf" class="px-6 py-2 rounded-md text-sm font-bold transition-all text-gray-600 hover:text-gray-900 z-10 w-40">
                    Imagem para PDF
                </button>
                <div id="mode-indicator" class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded shadow transition-all duration-300 left-1"></div>
            </div>

            <!-- OPÇÕES ESPECÍFICAS -->
            <div id="options-panel" class="mb-8">
                <label class="block text-gray-700 font-bold mb-2">Formato de Saída</label>
                <div class="flex gap-4">
                    <label class="cursor-pointer">
                        <input type="radio" name="img_format" value="jpg" checked class="peer sr-only">
                        <div class="px-4 py-2 rounded-lg border border-gray-200 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 text-gray-600 hover:bg-gray-50 transition">JPG</div>
                    </label>
                    <label class="cursor-pointer">
                        <input type="radio" name="img_format" value="png" class="peer sr-only">
                        <div class="px-4 py-2 rounded-lg border border-gray-200 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 text-gray-600 hover:bg-gray-50 transition">PNG (Transp.)</div>
                    </label>
                    <label class="cursor-pointer">
                        <input type="radio" name="img_format" value="webp" class="peer sr-only">
                        <div class="px-4 py-2 rounded-lg border border-gray-200 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 text-gray-600 hover:bg-gray-50 transition">WebP (Leve)</div>
                    </label>
                </div>
            </div>

            <!-- LISTA DE ARQUIVOS (Mini) -->
            <div class="mb-4 flex justify-between items-center">
                 <h3 class="font-bold text-gray-800">Arquivos Selecionados</h3>
                 <button id="btn-add-more" class="text-sm text-blue-600 hover:underline font-medium">+ Adicionar</button>
            </div>
            
            <div id="files-display-area" class="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-h-[300px] overflow-y-auto pr-1">
                <!-- Arquivos aparecem aqui via JS -->
            </div>

            <button id="btn-process-image" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                <span>Converter</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
            
            <input type="file" id="image-file-input" class="hidden" multiple>
        </div>

        <!-- MODAL DE CONFIRMAÇÃO (Substitui Alert nativo) -->
        <div id="modal-confirm-switch" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-transform">
                <h3 class="text-lg font-bold text-gray-800 mb-2">Trocar de Modo?</h3>
                <p class="text-gray-600 mb-6">Mudar o modo limpará os arquivos atuais da lista. Deseja continuar?</p>
                <div class="flex justify-end gap-3">
                    <button class="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium" id="modal-btn-cancel">Cancelar</button>
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold" id="modal-btn-confirm">Sim, Trocar</button>
                </div>
            </div>
        </div>
    `;

    uploadContainer.appendChild(editor);

    // --- LÓGICA DE GERENCIAMENTO DE ESTADO ---
    let currentMode = 'pdf-to-img'; // ou 'img-to-pdf'
    let currentFiles = [...files]; // Cópia local
    let pendingModeSwitch = null; // Para guardar o modo que o usuário queria ir

    // Elementos
    const btnPdfToImg = document.getElementById('mode-pdf-to-img');
    const btnImgToPdf = document.getElementById('mode-img-to-pdf');
    const indicator = document.getElementById('mode-indicator');
    const filesArea = document.getElementById('files-display-area');
    const fileInput = document.getElementById('image-file-input');
    const processBtn = document.getElementById('btn-process-image');
    const optionsPanel = document.getElementById('options-panel');
    const mainFilename = document.getElementById('main-filename');
    const fileCountDisplay = document.getElementById('file-count-display');
    const canvasPreview = document.getElementById('pdf-preview-canvas');
    const imagesPreviewGrid = document.getElementById('images-preview-grid');
    const noPreviewMsg = document.getElementById('no-preview-msg');

    // Modal Elements
    const modal = document.getElementById('modal-confirm-switch');
    const modalBtnCancel = document.getElementById('modal-btn-cancel');
    const modalBtnConfirm = document.getElementById('modal-btn-confirm');


    // 1. Renderizar Preview
    async function updatePreview() {
        if (currentFiles.length === 0) {
            canvasPreview.classList.add('hidden');
            imagesPreviewGrid.classList.add('hidden');
            noPreviewMsg.classList.remove('hidden');
            mainFilename.innerText = "Nenhum arquivo";
            fileCountDisplay.innerText = "";
            return;
        }

        mainFilename.innerText = currentFiles[0].name;
        fileCountDisplay.innerText = currentFiles.length > 1 ? `+ ${currentFiles.length - 1} outros arquivos` : "";

        if (currentMode === 'pdf-to-img') {
            imagesPreviewGrid.classList.add('hidden');
            noPreviewMsg.classList.add('hidden');
            canvasPreview.classList.remove('hidden');
            renderPdfCover(currentFiles[0]);
        } else {
            canvasPreview.classList.add('hidden');
            noPreviewMsg.classList.add('hidden');
            imagesPreviewGrid.classList.remove('hidden');
            renderImagesGrid();
        }
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

    function renderImagesGrid() {
        imagesPreviewGrid.innerHTML = '';
        // Mostra até 4 imagens no preview
        currentFiles.slice(0, 4).forEach(file => {
            const url = URL.createObjectURL(file);
            const img = document.createElement('img');
            img.src = url;
            img.className = "w-full h-24 object-cover rounded border border-gray-200";
            imagesPreviewGrid.appendChild(img);
        });
    }

    // 2. Atualizar Interface do Modo
    function updateModeUI() {
        if (currentMode === 'pdf-to-img') {
            indicator.style.left = '4px';
            btnPdfToImg.classList.add('text-blue-600');
            btnImgToPdf.classList.remove('text-blue-600');
            fileInput.accept = ".pdf";

            // Mostra opções de formato
            optionsPanel.style.display = 'block';
            document.querySelector("label[class*='mb-2']").innerText = "Formato de Saída das Imagens";
            processBtn.querySelector('span').innerText = "Converter para Imagens";

        } else {
            indicator.style.left = 'calc(50% + 1px)';
            btnImgToPdf.classList.add('text-purple-600');
            btnPdfToImg.classList.remove('text-blue-600');
            fileInput.accept = ".jpg,.jpeg,.png,.webp";

            // Esconde opção de formato de saída (Gera PDF sempre)
            optionsPanel.style.display = 'none';
            processBtn.querySelector('span').innerText = "Gerar PDF Único";
        }
        renderFilesList();
        updatePreview();
    }

    function renderFilesList() {
        filesArea.innerHTML = '';
        currentFiles.forEach((file, idx) => {
            const div = document.createElement('div');
            div.className = "relative bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-center group overflow-hidden";
            div.innerHTML = `
                <button onclick="removeImageFile(${idx})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">✕</button>
                <div class="w-8 h-8 rounded bg-gray-200 flex items-center justify-center mb-1 text-gray-500 text-xs font-bold uppercase">${file.name.split('.').pop()}</div>
                <span class="text-xs font-medium text-gray-700 truncate w-full text-center" title="${file.name}">${file.name}</span>
            `;
            filesArea.appendChild(div);
        });

        // Validação de botão
        if (currentFiles.length === 0) {
            processBtn.disabled = true;
            processBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            processBtn.disabled = false;
            processBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    window.removeImageFile = (index) => {
        currentFiles.splice(index, 1);
        renderFilesList();
        updatePreview();
    };

    // --- TROCA DE MODO COM MODAL ---
    function trySwitchMode(targetMode) {
        if (currentMode === targetMode) return;

        // Verifica conflitos
        let hasConflict = false;
        if (targetMode === 'pdf-to-img' && currentFiles.some(f => !f.type.includes('pdf'))) hasConflict = true;
        if (targetMode === 'img-to-pdf' && currentFiles.some(f => f.type.includes('pdf'))) hasConflict = true;

        if (currentFiles.length > 0 && hasConflict) {
            pendingModeSwitch = targetMode;
            modal.classList.remove('hidden'); // MOSTRA O MODAL
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

    btnPdfToImg.onclick = () => trySwitchMode('pdf-to-img');
    btnImgToPdf.onclick = () => trySwitchMode('img-to-pdf');

    // Input de arquivo
    document.getElementById('btn-add-more').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const newFiles = Array.from(e.target.files);
        let valid = true;

        if (currentMode === 'pdf-to-img') {
            valid = newFiles.every(f => f.type === "application/pdf");
            if (!valid && window.showToast) window.showToast("Apenas arquivos PDF neste modo!", "error");
        } else {
            valid = newFiles.every(f => f.type.startsWith("image/"));
            if (!valid && window.showToast) window.showToast("Apenas imagens (JPG, PNG, WebP)!", "error");
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

    // PROCESSAR
    processBtn.onclick = async () => {
        const originalText = processBtn.innerHTML;
        processBtn.disabled = true;
        processBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando...`;

        const endpoint = currentMode === 'pdf-to-img' ? "/api/pdf-para-jpg" : "/api/jpg-para-pdf";
        const formData = new FormData();
        currentFiles.forEach(file => formData.append("files", file));

        // Envia o formato escolhido se for PDF->Img
        if (currentMode === 'pdf-to-img') {
            const fmt = document.querySelector('input[name="img_format"]:checked').value;
            formData.append("formato", fmt);
        }

        try {
            const response = await fetch(endpoint, { method: 'POST', body: formData });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const timestamp = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
                const fmt = document.querySelector('input[name="img_format"]:checked').value;

                if (currentMode === 'pdf-to-img') a.download = `Imagens_${fmt.toUpperCase()}_${timestamp}.zip`;
                else a.download = `Imagens_Unificadas_${timestamp}.pdf`;

                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                if (window.showToast) window.showToast("Sucesso! Download iniciado.", "success");

                processBtn.innerHTML = `Concluído!`;
                setTimeout(() => {
                    if (window.resetCurrentTool) window.resetCurrentTool();
                }, 2000);

            } else {
                if (window.showToast) window.showToast("Erro no servidor.", "error");
                processBtn.innerHTML = originalText;
                processBtn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            if (window.showToast) window.showToast("Erro de conexão.", "error");
            processBtn.innerHTML = originalText;
            processBtn.disabled = false;
        }
    };

    // --- DECIDIR MODO INICIAL ---
    if (files.length > 0) {
        if (files[0].type.startsWith("image/")) {
            currentMode = 'img-to-pdf';
        } else {
            currentMode = 'pdf-to-img';
        }
        updateModeUI();
    } else {
        updateModeUI();
    }
}

window.setupImageConverterVisualEditor = setupImageConverterVisualEditor;
