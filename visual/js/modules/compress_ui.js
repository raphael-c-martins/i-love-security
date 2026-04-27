// visual/js/modules/compress_ui.js

async function setupCompressVisualEditor(file) {
    console.log("Iniciando Editor de Compressão...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }
    
    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-5xl mx-auto py-8 animate-fade-in";

    // Layout: Esquerda (Preview) | Direita (Opções)
    const editor = document.createElement('div');
    editor.className = "flex flex-col lg:flex-row gap-8 items-start";
    
    editor.innerHTML = `
        <div class="w-full lg:w-1/3 flex flex-col gap-4">
            <div class="bg-gray-100 p-8 rounded-2xl border border-gray-200 flex flex-col items-center justify-center relative min-h-[400px]">
                <canvas id="compress-preview" class="shadow-lg rounded max-w-full h-auto bg-white"></canvas>
                <div class="mt-4 text-center">
                    <p class="font-bold text-gray-700 truncate w-64">${file.name}</p>
                    <p class="text-sm text-gray-500" id="file-size-display">Calculando tamanho...</p>
                </div>
            </div>
            <button id="btn-cancel" class="w-full py-3 text-gray-500 hover:text-red-600 font-medium transition bg-white border border-gray-200 hover:border-red-200 rounded-xl">
                Cancelar e Voltar
            </button>
        </div>

        <div class="w-full lg:w-2/3 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Nível de Compressão</h2>
            <p class="text-gray-500 mb-8">Escolha o equilíbrio ideal entre tamanho e qualidade.</p>

            <div class="grid gap-4">
                
                <label class="cursor-pointer relative">
                    <input type="radio" name="compression_level" value="extreme" class="peer sr-only">
                    <div class="p-5 rounded-xl border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 hover:bg-gray-50 transition-all flex items-center gap-4">
                        <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">Extrema Compressão</h3>
                            <p class="text-sm text-gray-500">Menor qualidade, arquivo muito leve. (72 DPI)</p>
                        </div>
                    </div>
                </label>

                <label class="cursor-pointer relative">
                    <input type="radio" name="compression_level" value="recommended" class="peer sr-only" checked>
                    <div class="p-5 rounded-xl border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 hover:bg-gray-50 transition-all flex items-center gap-4">
                        <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">Compressão Recomendada</h3>
                            <p class="text-sm text-gray-500">Boa qualidade, boa compressão. (150 DPI)</p>
                        </div>
                        <div class="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">INDICADO</div>
                    </div>
                </label>

                <label class="cursor-pointer relative">
                    <input type="radio" name="compression_level" value="low" class="peer sr-only">
                    <div class="p-5 rounded-xl border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 hover:bg-gray-50 transition-all flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800">Baixa Compressão</h3>
                            <p class="text-sm text-gray-500">Alta qualidade, menos redução. (300 DPI)</p>
                        </div>
                    </div>
                </label>

            </div>

            <div class="mt-6 pt-6 border-t border-gray-100">
                <label class="flex items-center gap-3 cursor-pointer group">
                    <div class="relative flex items-center">
                        <input type="checkbox" id="grayscale-check" class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-red-500 checked:bg-red-500">
                        <svg class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 10" fill="none"><path d="M12.333 1 5 8.333 1.667 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <span class="text-gray-700 group-hover:text-red-600 transition-colors select-none">Converter tudo para <strong>Tons de Cinza</strong> (Preto e Branco)</span>
                </label>
                <p class="text-xs text-gray-400 mt-1 ml-8">Isso ajuda a reduzir ainda mais o tamanho do arquivo.</p>
            </div>

            <button id="btn-compress-process" class="w-full mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                <span>Comprimir PDF</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </button>
        </div>
    `;

    uploadContainer.appendChild(editor);
    
    // Mostra tamanho do arquivo
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    document.getElementById('file-size-display').innerText = `Tamanho atual: ${sizeMB} MB`;

    // Renderiza a Capa
    renderCoverPreview(file);

    // Eventos
    document.getElementById('btn-cancel').onclick = () => {
        if(window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    document.getElementById('btn-compress-process').onclick = () => processCompression(file);
}

// Renderiza a capa do PDF (Página 1)
async function renderCoverPreview(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1);
        
        const canvas = document.getElementById('compress-preview');
        const viewport = page.getViewport({ scale: 1.0 }); // Full quality pro preview principal
        
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Se a imagem for muito grande pro CSS, o max-width cuida do resize visual
        await page.render({ canvasContext: context, viewport: viewport }).promise;
    } catch (e) {
        console.error("Erro preview:", e);
    }
}

async function processCompression(file) {
    const btn = document.getElementById('btn-compress-process');
    const originalText = btn.innerHTML;
    
    // Pega os valores
    const level = document.querySelector('input[name="compression_level"]:checked').value;
    const grayscale = document.getElementById('grayscale-check').checked;

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Otimizando...`;

    const formData = new FormData();
    formData.append("files", file);
    formData.append("level", level);
    formData.append("grayscale", grayscale ? "true" : "false");

    try {
        const response = await fetch('/api/comprimir', { method: 'POST', body: formData });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const timestamp = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
            a.download = `${file.name.replace('.pdf','')}_Otimizado_${timestamp}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            if(window.showToast) window.showToast("Sucesso! Download iniciado.", "success");
            
            btn.innerHTML = `Concluído!`;

            setTimeout(() => {
                if(window.resetCurrentTool) window.resetCurrentTool();
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

window.setupCompressVisualEditor = setupCompressVisualEditor;