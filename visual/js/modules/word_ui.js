/**
 * Interface unificada para conversão PDF <-> Word
 * Permite alternar entre os modos "PDF para Word" e "Word para PDF".
 */
async function setupWordConverterVisualEditor(files) {
    console.log("Iniciando Editor de Word Unificado...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-5xl mx-auto py-8 animate-fade-in";

    // Cria a estrutura visual (Reaproveitando estilo do Image Editor)
    const editor = document.createElement('div');
    editor.className = "flex flex-col lg:flex-row gap-8 items-start";

    editor.innerHTML = `
        <!-- COLUNA ESQUERDA: PREVIEW E INFO -->
        <div class="w-full lg:w-1/3 flex flex-col gap-4">
             <div class="bg-gray-100 p-8 rounded-2xl border border-gray-200 flex flex-col items-center justify-center relative min-h-[300px]">
                <canvas id="pdf-preview-canvas" class="hidden shadow-lg rounded max-w-full h-auto bg-white"></canvas>
                
                <!-- Ícone Genérico para Word -->
                <div id="word-preview-icon" class="hidden flex flex-col items-center">
                    <svg class="w-24 h-24 text-blue-700 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                        <path fill="#fff" d="M14 8V2l6 6h-6z"/>
                        <path fill="#fff" d="M16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5H8V7h5v2z"/>
                    </svg>
                    <span class="text-gray-500 font-medium">Documento Word</span>
                </div>

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
                <button id="mode-pdf-to-word" class="px-6 py-2 rounded-md text-sm font-bold transition-all text-gray-600 hover:text-gray-900 z-10 w-40">
                    PDF para Word
                </button>
                <button id="mode-word-to-pdf" class="px-6 py-2 rounded-md text-sm font-bold transition-all text-gray-600 hover:text-gray-900 z-10 w-40">
                    Word para PDF
                </button>
                <div id="mode-indicator" class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded shadow transition-all duration-300 left-1"></div>
            </div>

            <!-- MENSAGEM INFORMATIVA -->
            <div id="info-panel" class="mb-8 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm">
                <p id="info-text">Converta seus PDFs em documentos Word editáveis.</p>
            </div>

            <!-- LISTA DE ARQUIVOS (Mini) -->
            <div class="mb-4 flex justify-between items-center">
                 <h3 class="font-bold text-gray-800">Arquivos Selecionados</h3>
                 <button id="btn-add-more" class="text-sm text-blue-600 hover:underline font-medium">+ Adicionar</button>
            </div>
            
            <div id="files-display-area" class="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-h-[300px] overflow-y-auto pr-1">
                <!-- Arquivos aparecem aqui via JS -->
            </div>

            <button id="btn-process-word" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                <span>Converter</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
            
            <input type="file" id="word-file-input" class="hidden" multiple>
        </div>

        <!-- MODAL DE CONFIRMAÇÃO -->
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
    let currentMode = 'pdf-to-word'; // ou 'word-to-pdf'
    let currentFiles = [...files]; // Cópia local
    let pendingModeSwitch = null;

    // Elementos
    const btnPdfToWord = document.getElementById('mode-pdf-to-word');
    const btnWordToPdf = document.getElementById('mode-word-to-pdf');
    const indicator = document.getElementById('mode-indicator');
    const filesArea = document.getElementById('files-display-area');
    const fileInput = document.getElementById('word-file-input');
    const processBtn = document.getElementById('btn-process-word');
    const infoText = document.getElementById('info-text');
    const mainFilename = document.getElementById('main-filename');
    const fileCountDisplay = document.getElementById('file-count-display');
    const canvasPreview = document.getElementById('pdf-preview-canvas');
    const wordIcon = document.getElementById('word-preview-icon');
    const noPreviewMsg = document.getElementById('no-preview-msg');

    // Modal
    const modal = document.getElementById('modal-confirm-switch');
    const modalBtnCancel = document.getElementById('modal-btn-cancel');
    const modalBtnConfirm = document.getElementById('modal-btn-confirm');

    // 1. Renderizar Preview
    async function updatePreview() {
        if (currentFiles.length === 0) {
            canvasPreview.classList.add('hidden');
            wordIcon.classList.add('hidden');
            noPreviewMsg.classList.remove('hidden');
            mainFilename.innerText = "Nenhum arquivo";
            fileCountDisplay.innerText = "";
            return;
        }

        mainFilename.innerText = currentFiles[0].name;
        fileCountDisplay.innerText = currentFiles.length > 1 ? `+ ${currentFiles.length - 1} outros arquivos` : "";
        noPreviewMsg.classList.add('hidden');

        if (currentMode === 'pdf-to-word') {
            wordIcon.classList.add('hidden');
            canvasPreview.classList.remove('hidden');
            renderPdfCover(currentFiles[0]);
        } else {
            canvasPreview.classList.add('hidden');
            wordIcon.classList.remove('hidden');
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

    // 2. Atualizar Interface do Modo
    function updateModeUI() {
        if (currentMode === 'pdf-to-word') {
            indicator.style.left = '4px';
            btnPdfToWord.classList.add('text-blue-600');
            btnWordToPdf.classList.remove('text-blue-600');

            fileInput.accept = ".pdf";
            processBtn.querySelector('span').innerText = "Converter para Word";
            infoText.innerText = "Converta seus PDFs em documentos Word editáveis.";

        } else {
            indicator.style.left = 'calc(50% + 1px)';
            btnWordToPdf.classList.add('text-blue-600');
            btnPdfToWord.classList.remove('text-blue-600');

            fileInput.accept = ".docx"; // Apenas DOCX
            processBtn.querySelector('span').innerText = "Converter para PDF";
            infoText.innerText = "Transforme seus documentos Word em PDF prontos para envio.";
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
                <button onclick="removeWordFile(${idx})" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">✕</button>
                <div class="w-8 h-8 rounded bg-gray-200 flex items-center justify-center mb-1 text-gray-500 text-xs font-bold uppercase">${file.name.split('.').pop()}</div>
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

    window.removeWordFile = (index) => {
        currentFiles.splice(index, 1);
        renderFilesList();
        updatePreview();
    };

    // --- TROCA DE MODO COM MODAL ---
    function trySwitchMode(targetMode) {
        if (currentMode === targetMode) return;

        let hasConflict = false;
        if (targetMode === 'pdf-to-word' && currentFiles.some(f => !f.type.includes('pdf'))) hasConflict = true;

        // Verificação de DOCX é mais chata pq MIME type varia, vamos por extensão
        if (targetMode === 'word-to-pdf' && currentFiles.some(f => !f.name.toLowerCase().endsWith('.docx'))) hasConflict = true;

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

    btnPdfToWord.onclick = () => trySwitchMode('pdf-to-word');
    btnWordToPdf.onclick = () => trySwitchMode('word-to-pdf');

    document.getElementById('btn-add-more').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const newFiles = Array.from(e.target.files);
        // Filtro básico na extensão pois type às vezes falha no Windows para docx
        let valid = true;
        if (currentMode === 'pdf-to-word') {
            valid = newFiles.every(f => f.name.toLowerCase().endsWith('.pdf'));
            if (!valid && window.showToast) window.showToast("Apenas PDF!", "error");
        } else {
            valid = newFiles.every(f => f.name.toLowerCase().endsWith('.docx'));
            if (!valid && window.showToast) window.showToast("Apenas DOCX!", "error");
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

        const endpoint = currentMode === 'pdf-to-word' ? "/api/pdf-para-word" : "/api/word-para-pdf";
        const formData = new FormData();

        // Backend atualmente espera 1 por vez para conversão pesada (Word), mas vamos manter loop se necessário no futuro
        // Por enquanto, vamos mandar o primeiro, pois a UI de "files" permite multiplos mas o backend processa um?
        // O Image permite multiplos (zip). O Word converter atual retorna UM arquivo.
        // Vamos bloquear para UM arquivo por vez ou iterar?
        // Ideal: Iterar e baixar. Mas navegador bloqueia multiplos downloads?
        // Simplicidade: Envia o primeiro da lista.

        if (currentFiles.length > 1) {
            if (window.showToast) window.showToast("Convertendo o primeiro arquivo da lista...", "info");
        }

        formData.append("files", currentFiles[0]);

        try {
            const response = await fetch(endpoint, { method: 'POST', body: formData });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const originalName = currentFiles[0].name.split('.')[0];
                if (currentMode === 'pdf-to-word') a.download = `${originalName}.docx`;
                else a.download = `${originalName}.pdf`;

                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                if (window.showToast) window.showToast("Sucesso! Download iniciado.", "success");
                processBtn.innerHTML = "Concluído!";
                setTimeout(() => {
                    if (window.resetCurrentTool) window.resetCurrentTool();
                }, 2000);

            } else {
                if (window.showToast) window.showToast("Erro no servidor. Tente novamente.", "error");
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
        if (files[0].name.toLowerCase().endsWith('.docx')) {
            currentMode = 'word-to-pdf';
        } else {
            currentMode = 'pdf-to-word';
        }
        updateModeUI();
    } else {
        updateModeUI();
    }
}

window.setupWordConverterVisualEditor = setupWordConverterVisualEditor;
