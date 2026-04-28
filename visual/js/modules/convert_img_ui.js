// visual/js/modules/convert_img_ui.js
// =================================================================
// Módulo: Conversor de Imagens em Lote
// Layout: 2 colunas — Drop Zone (esq) + Painel de Configurações (dir)
// O painel aparece IMEDIATAMENTE ao clicar na ferramenta.
// =================================================================

/**
 * Inicializa a interface do Conversor de Imagens.
 * Chamado por openUploadArea() quando a ferramenta é "Converter Imagem".
 * @param {File[]} initialFiles - Arquivos pré-selecionados (pode ser vazio)
 */
function setupConvertImageUI(initialFiles = []) {
    console.log('[convert_img_ui] Iniciando UI do Conversor de Imagens...');

    const uploadContainer = document.getElementById('upload-container');
    uploadContainer.innerHTML = '';
    // Ocupa toda a largura disponível, sem max-w restritivo
    uploadContainer.className = 'w-full px-6 py-6 animate-fade-in';

    // ---- Formatos disponíveis para conversão ----
    const OUTPUT_FORMATS = [
        { value: 'jpg',  label: 'JPG',  desc: 'Universal',   color: 'amber' },
        { value: 'png',  label: 'PNG',  desc: 'Remover Fundo', color: 'blue' },
        { value: 'webp', label: 'WEBP', desc: 'Web (leve)',  color: 'green' },
        { value: 'bmp',  label: 'BMP',  desc: 'Bitmap',     color: 'gray'  },
        { value: 'gif',  label: 'GIF',  desc: 'Animado',    color: 'purple'},
        { value: 'tiff', label: 'TIFF', desc: 'Profissional', color: 'teal' },
    ];

    // ---- Constrói o HTML da UI ----
    uploadContainer.innerHTML = `
        <!-- Botão Voltar -->
        <button id="conv-back-btn"
            class="mb-6 flex items-center text-gray-600 hover:text-red-600 transition-colors font-medium">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Voltar para todas as ferramentas
        </button>

        <!-- Layout 2 colunas — ocupa toda a altura visível da viewport -->
        <div class="flex flex-col lg:flex-row gap-6" style="min-height: calc(100vh - 280px)">



            <!-- ===== COLUNA ESQUERDA: Drop Zone + Lista de Arquivos ===== -->
            <div class="flex flex-col gap-4" style="flex: 3; min-width: 0">

                <!-- Drop Zone — cresce para preencher o espaço vertical -->
                <div id="conv-drop-zone"
                    class="bg-white border-2 border-dashed border-gray-300 rounded-3xl text-center
                           hover:border-red-400 transition-colors cursor-pointer flex flex-col justify-center"
                    style="padding: 2rem; flex: 1; min-height: 300px">
                    <div class="flex flex-col items-center">
                        <!-- Ícone maior -->
                        <div class="bg-indigo-100 rounded-3xl flex items-center justify-center mb-6 mx-auto"
                             style="width:100px;height:100px">
                            <svg style="width:52px;height:52px" class="text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </div>

                        <h2 class="font-bold text-gray-800 mb-3" style="font-size:2rem">Converter Imagem</h2>
                        <p class="text-gray-500 mb-10" style="font-size:1.1rem">Arraste os arquivos para cá ou clique para selecionar</p>

                        <button id="conv-select-btn"
                            class="bg-red-600 text-white rounded-xl font-bold shadow-lg
                                   hover:bg-red-700 transform hover:scale-105 transition-all"
                            style="padding: 1.1rem 3rem; font-size: 1.2rem">
                            Selecionar arquivos
                        </button>

                        <input type="file" id="conv-file-input" class="hidden" multiple
                            accept=".jpg,.jpeg,.png,.webp,.bmp,.gif,.tif,.tiff,.avif,.heic">
                    </div>
                </div>

                <!-- ===== GALERIA IMERSIVA (substitui drop zone quando há arquivos) ===== -->
                <div id="conv-gallery-panel"
                     class="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col"
                     style="display:none; flex:1; min-height:300px; overflow:hidden">

                    <!-- Header da galeria -->
                    <div class="flex items-center justify-between px-6 py-4 border-b"
                         style="border-color:#f3f4f6">
                        <div class="flex items-center gap-3">
                            <div class="bg-indigo-100 rounded-xl flex items-center justify-center"
                                 style="width:38px;height:38px">
                                <svg style="width:20px;height:20px" class="text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </div>
                            <div>
                                <p id="conv-gallery-count" class="font-bold text-gray-800" style="font-size:1rem">0 imagens no lote</p>
                                <p class="text-gray-400" style="font-size:0.78rem">Passe o mouse sobre uma imagem para removê-la</p>
                            </div>
                        </div>
                        <button id="conv-add-more-btn"
                            class="flex items-center gap-2 font-bold rounded-xl transition-all"
                            style="background:#eef2ff; color:#4338ca; padding:0.6rem 1.2rem; font-size:0.9rem">
                            <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                            </svg>
                            Adicionar mais
                        </button>
                    </div>

                    <!-- Grid de thumbnails grandes — com scroll interno -->
                    <div id="conv-gallery-grid"
                         class="flex-1 overflow-y-auto p-5"
                         style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:1rem; align-content:start">
                        <!-- Cards renderizados via JS -->
                    </div>
                </div>

            </div>

            <!-- ===== COLUNA DIREITA: Painel de Configurações ===== -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4"
                 style="flex: 1.4; min-width: 340px; padding: 1.5rem">

                <!-- Seção: Formato de Saída -->
                <div>
                    <p class="font-bold uppercase tracking-widest mb-4" style="font-size:0.72rem;color:#9ca3af;letter-spacing:0.12em">
                        2. Formato de Saída
                    </p>
                    <div id="conv-format-grid" class="grid grid-cols-3 gap-3">
                        ${OUTPUT_FORMATS.map((fmt, i) => `
                            <button
                                data-format="${fmt.value}"
                                class="conv-format-btn flex flex-col items-center rounded-2xl border-2 transition-all"
                                style="padding: 1rem 0.5rem; ${i === 0
                                    ? 'border-color:#6366f1; background:#eef2ff; color:#4338ca'
                                    : 'border-color:#e5e7eb; background:#fff; color:#4b5563'
                                }">
                                <span style="font-weight:800; font-size:1rem">${fmt.label}</span>
                                <span style="font-size:0.78rem; opacity:0.65; margin-top:3px">${fmt.desc}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <hr style="border-color:#f3f4f6">

                <!-- Botão de Converter -->
                <button id="conv-process-btn"
                    class="w-full text-white font-bold shadow-lg transition-all
                           flex justify-center items-center gap-2"
                    style="background:#6366f1; border-radius:1rem; padding:1.2rem 1.5rem;
                           font-size:1.1rem; margin-top:auto"
                    onmouseover="if(!this.disabled)this.style.background='#4f46e5'"
                    onmouseout="if(!this.disabled)this.style.background='#6366f1'"
                    disabled>
                    <span id="conv-process-label">Converter para ...</span>
                    <svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                </button>

                <p class="text-center" style="font-size:0.78rem;color:#d1d5db;margin-top:-1rem">
                    Processamento 100% local — seus arquivos nunca saem desta máquina.
                </p>

            </div>
        </div>
    `;

    // ---- Estado Local ----
    let currentFiles = [...initialFiles];
    let selectedFormat = OUTPUT_FORMATS[0].value; // 'jpg' por padrão

    // ---- Referências DOM ----
    const fileInput     = document.getElementById('conv-file-input');
    const processBtn    = document.getElementById('conv-process-btn');
    const processLabel  = document.getElementById('conv-process-label');
    const backBtn       = document.getElementById('conv-back-btn');
    const formatBtns    = document.querySelectorAll('.conv-format-btn');


    // ---- Renderiza: alterna entre Drop Zone e Galeria de Imagens ----
    function renderFiles() {
        const dropZone      = document.getElementById('conv-drop-zone');
        const galleryPanel  = document.getElementById('conv-gallery-panel');
        const galleryGrid   = document.getElementById('conv-gallery-grid');
        const galleryCount  = document.getElementById('conv-gallery-count');

        if (currentFiles.length === 0) {
            // ── Estado VAZIO: mostra a drop zone, esconde galeria
            dropZone.style.display    = '';
            galleryPanel.style.display = 'none';
            processBtn.disabled = true;
            updateProcessLabel();
            return;
        }

        // ── Estado COM ARQUIVOS: esconde drop zone, mostra galeria
        dropZone.style.display    = 'none';
        galleryPanel.style.display = '';
        processBtn.disabled = false;

        galleryCount.textContent = `${currentFiles.length} imagem${currentFiles.length > 1 ? 'ns' : ''} no lote`;
        galleryGrid.innerHTML = '';

        // Cria um card por arquivo — thumbnail grande e clicável para remover
        currentFiles.forEach((file, idx) => {
            const ext       = file.name.split('.').pop().toUpperCase();
            const isImage   = file.type.startsWith('image/');
            const previewSrc = isImage ? URL.createObjectURL(file) : null;

            const card = document.createElement('div');
            card.className = 'relative rounded-2xl overflow-hidden group cursor-pointer shadow-sm';
            card.style.cssText = 'background:#f8fafc; border: 2px solid #e5e7eb;';

            card.innerHTML = `
                ${previewSrc
                    ? `<img src="${previewSrc}"
                            alt="${file.name}"
                            class="w-full object-cover"
                            style="height:180px">`
                    : `<div class="w-full flex items-center justify-center bg-gray-100 font-bold text-gray-400"
                              style="height:180px;font-size:1.5rem">${ext}</div>`
                }
                <!-- Overlay escuro ao hover com botão de remover -->
                <div class="absolute inset-0 flex flex-col items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-all duration-200"
                     style="background:rgba(0,0,0,0.55)">
                    <button onclick="event.stopPropagation(); window._convRemoveFile(${idx})"
                        class="text-white rounded-xl font-bold transition-all"
                        style="background:#ef4444; padding:0.5rem 1.2rem; font-size:0.85rem">
                        ✕ Remover
                    </button>
                </div>
                <!-- Nome do arquivo (barra inferior) -->
                <div class="px-3 py-2 border-t" style="border-color:#e5e7eb; background:#fff">
                    <p class="text-xs font-medium text-gray-600 truncate" title="${file.name}">${file.name}</p>
                    <p class="text-xs text-gray-400">${_formatFileSize(file.size)}</p>
                </div>
            `;
            galleryGrid.appendChild(card);
        });

        updateProcessLabel();
    }

    // Formata tamanho de arquivo (ex: 1.2 MB)
    function _formatFileSize(bytes) {
        if (bytes < 1024)       return bytes + ' B';
        if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
        return (bytes/(1024*1024)).toFixed(1) + ' MB';
    }

    // ---- Atualiza texto do botão de converter ----
    function updateProcessLabel() {
        const fmt   = selectedFormat.toUpperCase();
        const count = currentFiles.length;
        processLabel.textContent = count > 0
            ? `Converter ${count} arquivo${count > 1 ? 's' : ''} para ${fmt}`
            : `Converter para ${fmt}`;
    }

    // ---- Remove arquivo por índice ----
    window._convRemoveFile = (idx) => {
        // Libera ObjectURL para evitar memory leak
        if (currentFiles[idx] && currentFiles[idx].type.startsWith('image/')) {
            const imgEl = document.querySelector(`#conv-gallery-grid .relative:nth-child(${idx + 1}) img`);
            if (imgEl) URL.revokeObjectURL(imgEl.src);
        }
        currentFiles.splice(idx, 1);
        renderFiles();
    };

    // ---- Aceitar novos arquivos ----
    function addFiles(newFileList) {
        const accepted = Array.from(newFileList).filter(f => {
            const isImg = f.type.startsWith('image/') ||
                f.name.match(/\.(jpg|jpeg|png|webp|bmp|gif|tif|tiff|avif|heic)$/i);
            if (!isImg && window.showToast) {
                window.showToast(`${f.name} ignorado — apenas imagens.`, 'error');
            }
            return isImg;
        });
        currentFiles = [...currentFiles, ...accepted];
        renderFiles();
        fileInput.value = '';
    }

    // ---- Eventos de Upload — Drop Zone (estado vazio) ----
    const dropZone = document.getElementById('conv-drop-zone');
    const selectBtn = document.getElementById('conv-select-btn');

    selectBtn.onclick = (e) => { e.stopPropagation(); fileInput.click(); };
    fileInput.onchange  = (e) => addFiles(e.target.files);
    dropZone.onclick    = (e) => {
        if (e.target !== selectBtn && !selectBtn.contains(e.target)) fileInput.click();
    };

    // Drag and drop na drop zone (estado vazio)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    dropZone.addEventListener('dragover',  () => dropZone.classList.add('border-red-400', 'bg-red-50'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-red-400', 'bg-red-50'));
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('border-red-400', 'bg-red-50');
        addFiles(e.dataTransfer.files);
    });

    // ---- Drag and drop na galeria (estado com arquivos) ----
    // Permite arrastar mais imagens diretamente sobre a galeria
    const galleryPanel = document.getElementById('conv-gallery-panel');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        galleryPanel.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    galleryPanel.addEventListener('dragover',  () => galleryPanel.classList.add('ring-2', 'ring-indigo-400'));
    galleryPanel.addEventListener('dragleave', () => galleryPanel.classList.remove('ring-2', 'ring-indigo-400'));
    galleryPanel.addEventListener('drop', (e) => {
        galleryPanel.classList.remove('ring-2', 'ring-indigo-400');
        addFiles(e.dataTransfer.files);
    });

    // ---- Botão "+ Adicionar mais" na galeria ----
    document.getElementById('conv-add-more-btn').onclick = () => fileInput.click();



    // ---- Seleção de Formato ---- (usa inline styles para consistência com o template)
    function _applyFormatSelection(activeBtn) {
        formatBtns.forEach(b => {
            // Estilo INATIVO
            b.style.borderColor = '#e5e7eb';
            b.style.background  = '#fff';
            b.style.color       = '#4b5563';
        });
        // Estilo ATIVO no botão clicado
        activeBtn.style.borderColor = '#6366f1';
        activeBtn.style.background  = '#eef2ff';
        activeBtn.style.color       = '#4338ca';
    }

    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.format === 'png') {
                if (currentFiles.length === 0) {
                    if (window.showToast) window.showToast('Adicione 1 imagem primeiro para Remover o Fundo.', 'error');
                    return;
                }
                if (currentFiles.length > 1) {
                    if (window.showToast) window.showToast('Remoção de fundo avançada suporta apenas 1 imagem por vez.', 'error');
                    return;
                }
                
                // Se tem exatamente 1 imagem, abre o editor visual!
                if (typeof setupRemoveBgVisualEditor === 'function') {
                    setupRemoveBgVisualEditor(currentFiles[0]);
                } else {
                    console.error("Módulo de remover fundo não carregado.");
                }
                return;
            }

            _applyFormatSelection(btn);
            selectedFormat = btn.dataset.format;
            updateProcessLabel();
        });
    });

    // ---- Botão Voltar ----
    backBtn.onclick = () => {
        location.reload();
    };


    // ---- Processar / Converter ----
    processBtn.onclick = async () => {

        if (currentFiles.length === 0) return;

        const originalHTML = processBtn.innerHTML;
        processBtn.disabled = true;
        processBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962
                       7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Convertendo...
        `;

        const formData = new FormData();
        currentFiles.forEach(f => formData.append('files', f));
        formData.append('formato', selectedFormat);

        try {
            const response = await fetch('/api/converter-imagem', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.style.display = 'none';

                const ts = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
                let filename = `Convertido_${selectedFormat.toUpperCase()}_${ts}.zip`;
                
                // Tenta extrair o nome exato retornado pelo servidor
                const disposition = response.headers.get('Content-Disposition');
                if (disposition && disposition.indexOf('filename=') !== -1) {
                    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                    if (matches != null && matches[1]) { 
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);


                if (window.showToast) {
                    window.showToast(
                        `✅ ${currentFiles.length} imagem(ns) convertida(s) para ${selectedFormat.toUpperCase()}!`,
                        'success'
                    );
                }

                // ── Sucesso: zera o lote e volta para o estado inicial (drop zone limpa)
                currentFiles = [];
                processBtn.innerHTML = '✅ Concluído!';
                setTimeout(() => {
                    renderFiles(); // volta para drop zone
                    processBtn.innerHTML = originalHTML;
                    processBtn.disabled  = false;
                }, 1800);

            } else {
                const errText = await response.text();
                console.error('[convert_img_ui] Erro do servidor:', errText);
                if (window.showToast) window.showToast('Erro no servidor ao converter.', 'error');
                processBtn.innerHTML = originalHTML;
                processBtn.disabled  = false;
            }

        } catch (err) {
            console.error('[convert_img_ui] Erro de conexão:', err);
            if (window.showToast) window.showToast('Erro de conexão com o servidor.', 'error');
            processBtn.innerHTML = originalHTML;
            processBtn.disabled  = false;
        }
    };

    // ---- Renderiza estado inicial ----
    renderFiles();
}

// Exporta para uso global pelo script.js
window.setupConvertImageUI = setupConvertImageUI;
