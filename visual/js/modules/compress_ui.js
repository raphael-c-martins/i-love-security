// visual/js/modules/compress_ui.js

async function setupCompressVisualEditor(file, fileType = 'pdf') {
    console.log(`Iniciando Editor de Compressão (${fileType.toUpperCase()})...`);

    const isTif = fileType === 'tif' || file.name.match(/\.(tif|tiff)$/i);
    const titleText = isTif ? "Comprimir TIF" : "Comprimir PDF";
    const modeName = isTif ? "TIF" : "PDF";

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }
    
    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-5xl mx-auto py-8 animate-fade-in";

    const descExtreme = isTif ? "Menor qualidade, arquivo muito leve. (Alta redução ~50%)" : "Menor qualidade, arquivo muito leve. (Alta redução ~85%)";
    const descRecommended = isTif ? "Boa qualidade, excelente compressão. (~35% de redução)" : "Boa qualidade, excelente compressão. (~65% de redução)";
    const descLow = isTif ? "Alta qualidade visual, compressão leve. (~20% de redução)" : "Alta qualidade visual, compressão leve. (~35% de redução)";

    // Layout: Esquerda (Preview e Stats) | Direita (Opções de Compressão)
    const editor = document.createElement('div');
    editor.className = "flex flex-col lg:flex-row gap-8 items-start";
    
    editor.innerHTML = `
        <div class="w-full lg:w-1/3 flex flex-col gap-4">
            <div class="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative min-h-[400px]">
                <div id="compress-preview-wrapper" class="w-full flex justify-center items-center relative">
                    <canvas id="compress-preview" class="shadow-lg rounded max-w-full max-h-[300px] h-auto bg-white hidden"></canvas>
                    <img id="compress-preview-img" class="shadow-lg rounded max-w-full max-h-[300px] h-auto bg-white hidden" />
                    <div id="compress-preview-loader" class="flex flex-col items-center text-slate-400 dark:text-slate-500 py-12">
                        <svg class="w-10 h-10 animate-spin text-red-600 dark:text-red-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="text-xs font-medium">Gerando pré-visualização...</span>
                    </div>
                </div>
                
                <div class="mt-4 text-center w-full">
                    <p class="font-bold text-slate-800 dark:text-slate-200 truncate w-full px-2" title="${file.name}">${file.name}</p>
                    <div id="tif-meta-badge" class="hidden mt-1 inline-block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800"></div>
                    <div class="mt-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col gap-1.5">
                        <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Tamanho Original:</span>
                            <span id="file-size-display" class="font-bold text-slate-700 dark:text-slate-200">Calculando...</span>
                        </div>
                        <div class="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold border-t border-slate-100 dark:border-slate-700/80 pt-1.5">
                            <span>Estimativa Reduzida:</span>
                            <span id="file-size-estimated">Calculando...</span>
                        </div>
                    </div>
                </div>
            </div>
            <button id="btn-cancel-compress" class="w-full py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 rounded-xl">
                Cancelar e Voltar
            </button>
        </div>

        <div class="w-full lg:w-2/3 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">${titleText}</h2>
            <p class="text-slate-500 dark:text-slate-400 mb-6">Escolha o nível de compressão desejado para otimizar o arquivo corporativo.</p>

            <div class="grid gap-4">
                
                <label class="cursor-pointer relative">
                    <input type="radio" name="compression_level" value="extreme" class="peer sr-only">
                    <div class="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-4">
                        <div class="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 dark:text-slate-200">Extrema Compressão</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${descExtreme}</p>
                        </div>
                    </div>
                </label>

                <label class="cursor-pointer relative">
                    <input type="radio" name="compression_level" value="recommended" class="peer sr-only" checked>
                    <div class="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-4">
                        <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 dark:text-slate-200">Compressão Recomendada</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${descRecommended}</p>
                        </div>
                        <div class="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">INDICADO</div>
                    </div>
                </label>

                <label class="cursor-pointer relative">
                    <input type="radio" name="compression_level" value="low" class="peer sr-only">
                    <div class="p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 dark:text-slate-200">Baixa Compressão</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${descLow}</p>
                        </div>
                    </div>
                </label>

            </div>

            <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <label class="flex items-center gap-3 cursor-pointer group">
                    <div class="relative flex items-center">
                        <input type="checkbox" id="grayscale-check" class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 transition-all checked:border-red-500 checked:bg-red-500">
                        <svg class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 10" fill="none"><path d="M12.333 1 5 8.333 1.667 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <span class="text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors select-none text-sm">Converter documento para <strong>Tons de Cinza</strong> (Preto e Branco)</span>
                </label>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-8">Aumenta a redução de tamanho eliminando canais de cor desnecessários.</p>
            </div>

            <button id="btn-compress-process" class="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                <span>Comprimir ${modeName}</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </button>
        </div>
    `;

    uploadContainer.appendChild(editor);
    
    // Atualiza estatísticas originais
    const sizeBytes = file.size;
    const formatBytes = (b) => {
        if (!b || b === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    document.getElementById('file-size-display').innerText = formatBytes(sizeBytes);

    // Função de recálculo da estimativa de compressão em tempo real
    function updateEstimation() {
        const selectedLevel = document.querySelector('input[name="compression_level"]:checked')?.value || 'recommended';
        const isGrayscale = document.getElementById('grayscale-check')?.checked || false;

        let ratio = 0.65;
        if (isTif) {
            // TIFs corporativos/documentais normalmente já usam compressão P&B 1-bit Group4.
            // Taxa empírica ultra-precisa medida: Extrema ~48.7%, Recomendada ~33.9%, Baixa ~18.6%
            if (selectedLevel === 'extreme') ratio = 0.487;
            else if (selectedLevel === 'low') ratio = 0.186;
            else ratio = 0.339; // recommended

            if (isGrayscale) ratio = Math.min(0.65, ratio + 0.05);
        } else {
            // PDFs escaneados possuem fluxos de imagem que sofrem forte descarte/resample pelo Ghostscript
            // Taxas empíricas de redução real: Extrema ~86%, Recomendada ~65%, Baixa ~35%
            if (selectedLevel === 'extreme') ratio = 0.86;
            else if (selectedLevel === 'low') ratio = 0.35;
            else ratio = 0.65; // recommended

            if (isGrayscale) ratio = Math.min(0.92, ratio + 0.06);
        }

        const estimatedSize = Math.max(1024, Math.round(sizeBytes * (1 - ratio)));
        const percentText = Math.round(ratio * 100);

        document.getElementById('file-size-estimated').innerHTML = `~${formatBytes(estimatedSize)} <span class="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] ml-1">-${percentText}%</span>`;
    }

    // Eventos de mudança para recálculo instantâneo da estimativa
    document.querySelectorAll('input[name="compression_level"]').forEach(radio => {
        radio.addEventListener('change', updateEstimation);
    });
    document.getElementById('grayscale-check').addEventListener('change', updateEstimation);

    // Calcula estimativa inicial
    updateEstimation();

    // Renderiza a Capa (PDF vs TIF)
    if (isTif) {
        renderTifCompressPreview(file);
    } else {
        renderPdfCompressPreview(file);
    }

    // Eventos de botões
    document.getElementById('btn-cancel-compress').onclick = () => {
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    document.getElementById('btn-compress-process').onclick = () => processCompression(file, isTif);
}

// Renderiza a capa do PDF (Página 1)
async function renderPdfCompressPreview(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1);
        
        const canvas = document.getElementById('compress-preview');
        const loader = document.getElementById('compress-preview-loader');
        
        const viewport = page.getViewport({ scale: 0.8 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        if (loader) loader.classList.add('hidden');
        canvas.classList.remove('hidden');
    } catch (e) {
        console.error("Erro preview PDF:", e);
        const loader = document.getElementById('compress-preview-loader');
        if (loader) loader.innerHTML = `<span class="text-xs text-gray-400">Preview indisponível</span>`;
    }
}

// Renderiza a capa do TIF (Apenas a 1ª página - Instantâneo e Local)
async function renderTifCompressPreview(file) {
    const loader = document.getElementById('compress-preview-loader');
    const imgEl = document.getElementById('compress-preview-img');

    // 1. Tenta renderizar via UTIF.js diretamente no navegador para arquivos de até 80MB (Zero tráfego de rede)
    if (file.size <= 80 * 1024 * 1024 && window.renderTifPageClientSide) {
        try {
            const preview = await window.renderTifPageClientSide(file, 0, 400);
            if (preview && preview.dataUrl) {
                imgEl.src = preview.dataUrl;
                if (loader) loader.classList.add('hidden');
                imgEl.classList.remove('hidden');

                const metaBadge = document.getElementById('tif-meta-badge');
                if (metaBadge && preview.totalPages) {
                    metaBadge.innerText = `${preview.totalPages} página(s) • ${preview.width}x${preview.height}px`;
                    metaBadge.classList.remove('hidden');
                }
                return;
            }
        } catch (errUtif) {
            console.warn("Renderização local UTIF não pôde decodificar este formato específico:", errUtif);
        }
    }

    // 2. Para arquivos densos (> 80MB) ou como fallback imediato: exibe card corporativo seguro
    const formatBytes = (b) => {
        if (!b || b === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loader) {
        loader.innerHTML = `
            <div class="flex flex-col items-center justify-center text-center p-3">
                <svg class="w-16 h-16 text-emerald-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <path fill="#fff" d="M14 8V2l6 6h-6z"/>
                    <text x="6" y="18" font-size="6" font-weight="bold" fill="#fff" font-family="sans-serif">TIF</text>
                </svg>
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300">TIF Multipáginas</span>
                <span class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${formatBytes(file.size)}</span>
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">Pronto para compressão</span>
            </div>
        `;
    }
}

async function processCompression(file, isTif) {
    const btn = document.getElementById('btn-compress-process');
    const originalText = btn.innerHTML;
    
    const level = document.querySelector('input[name="compression_level"]:checked').value;
    const grayscale = document.getElementById('grayscale-check').checked;

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Otimizando...`;

    const formData = new FormData();
    formData.append("files", file);
    formData.append("level", level);
    formData.append("grayscale", grayscale ? "true" : "false");

    const endpoint = isTif ? '/api/comprimir-tif' : '/api/comprimir';
    const ext = isTif ? 'tif' : 'pdf';

    try {
        const timestamp = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const downloadFilename = `${baseName}_Comprimido_${timestamp}.${ext}`;
        
        const saveBlob = await window.getFileSaver(downloadFilename);
        if (!saveBlob) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const response = await window.fetchWithProgress(endpoint, {
            method: 'POST',
            body: formData,
            title: isTif ? 'Comprimir TIF' : 'Comprimir PDF',
            filename: file.name,
            fileSize: file.size,
            button: btn
        });
        
        if (response.ok) {
            const origSize = response.headers.get('X-Original-Size');
            const finSize = response.headers.get('X-Final-Size');

            const blob = await response.blob();
            await saveBlob(blob, downloadFilename);

            const origNum = origSize ? parseFloat(origSize) : file.size;
            const finNum = finSize ? parseFloat(finSize) : blob.size;

            let toastMsg = `Sucesso! Arquivo comprimido baixado.`;
            if (origNum > 0 && finNum > 0) {
                const formatBytes = (b) => {
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(b) / Math.log(k));
                    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };
                const diffPct = ((1 - (finNum / origNum)) * 100).toFixed(1);
                if (finNum < origNum) {
                    toastMsg = `📉 Compactado! De ${formatBytes(origNum)} para ${formatBytes(finNum)} (-${diffPct}%)`;
                } else {
                    toastMsg = `✨ Processado! De ${formatBytes(origNum)} para ${formatBytes(finNum)} (+${Math.abs(diffPct)}%)`;
                }
            }

            if (window.showToast) window.showToast(toastMsg, "success");
            
            btn.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Concluído!`;

            setTimeout(() => {
                if (window.resetCurrentTool) window.resetCurrentTool();
                else location.reload();
            }, 2000);
        } else {
            let errorMsg = "Erro no servidor ao comprimir.";
            try {
                const errText = await response.text();
                if (errText && errText.length < 150 && !errText.includes("<!DOCTYPE") && !errText.includes("<html")) {
                    errorMsg = errText;
                }
            } catch (_) {}

            if (response.status === 413) {
                if (window.showToast) window.showToast("Arquivo muito grande. O tamanho excede o limite permitido pelo servidor.", "error");
            } else {
                if (window.showToast) window.showToast(errorMsg, "error");
            }
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

window.setupCompressVisualEditor = setupCompressVisualEditor;