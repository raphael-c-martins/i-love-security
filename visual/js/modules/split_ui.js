// visual/js/modules/split_ui.js

window.selectedPages = new Set(); 

async function setupSplitVisualEditor(file) {
    console.log("Iniciando Modo Imersivo HD...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }
    
    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-[95%] mx-auto py-6 animate-fade-in";

    const editorWrapper = document.createElement('div');
    editorWrapper.className = "flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]";

    editorWrapper.innerHTML = `
        <div class="flex-1 bg-gray-100 rounded-xl border border-gray-200 flex flex-col overflow-hidden relative">
            
            <div class="bg-white p-3 border-b border-gray-200 flex justify-between items-center z-10">
                <span class="text-sm font-bold text-gray-500 uppercase tracking-wide px-2">Visualizador</span>
                <div class="flex gap-2">
                    <button id="btn-select-all" class="text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition">Selecionar Tudo</button>
                    <button id="btn-clear-all" class="text-xs font-medium text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded transition">Limpar</button>
                </div>
            </div>

            <div id="pages-grid" class="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 content-start custom-scrollbar">
                <div class="col-span-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg class="w-10 h-10 animate-spin mb-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-sm font-medium">Gerando miniaturas em alta qualidade...</span>
                </div>
            </div>
        </div>

        <div class="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div class="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                    </div>
                    <div class="overflow-hidden">
                        <h2 class="text-lg font-bold text-gray-800">Dividir PDF</h2>
                        <p class="text-xs text-gray-400 truncate block" title="${file.name}">${file.name}</p>
                    </div>
                </div>

                <div class="space-y-4 flex-1">
                    <div>
                        <label class="text-xs font-bold text-gray-500 uppercase mb-2 block">Modo de Extração</label>
                        <div class="flex p-1 bg-gray-100 rounded-lg">
                            <button class="flex-1 py-1.5 text-xs font-bold rounded shadow bg-white text-gray-800 text-center">Selecionar Páginas</button>
                        </div>
                    </div>

                    <div>
                        <label class="text-xs font-bold text-gray-500 uppercase mb-2 block">Páginas Selecionadas</label>
                        <input type="text" id="pages-range-input" 
                            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition" 
                            placeholder="Ex: 1-5, 8">
                        <p class="text-[10px] text-gray-400 mt-1">Clique nas páginas à esquerda.</p>
                    </div>

                    <div class="flex items-start gap-2 pt-2">
                        <input type="checkbox" id="merge-checkbox" class="mt-1 rounded text-red-600 focus:ring-red-500 border-gray-300">
                        <label for="merge-checkbox" class="text-xs text-gray-600 leading-tight">Juntar todas as partes selecionadas em um único PDF.</label>
                    </div>
                </div>

                <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                    <button id="process-btn-sidebar" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                        <span>Dividir PDF</span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </button>
                    
                    <button id="btn-cancel" class="w-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 font-medium py-2 px-4 rounded-lg transition text-sm">
                        Cancelar / Trocar Arquivo
                    </button>
                </div>
            </div>
        </div>
    `;

    uploadContainer.appendChild(editorWrapper);

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const grid = document.getElementById('pages-grid');
        grid.innerHTML = ''; 
        window.selectedPages.clear();

        document.getElementById('btn-clear-all').onclick = () => {
            window.selectedPages.clear();
            document.querySelectorAll('[id^="check-"]').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('canvas').forEach(el => el.classList.remove('opacity-90', 'ring-4', 'ring-red-500/30'));
            updateRangeInput();
        };

        document.getElementById('btn-select-all').onclick = () => {
            window.selectedPages.clear();
            for(let i=1; i<=pdf.numPages; i++) window.selectedPages.add(i);
            document.querySelectorAll('[id^="check-"]').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('canvas').forEach(el => el.classList.add('opacity-90', 'ring-4', 'ring-red-500/30'));
            updateRangeInput();
        };

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            // Mantendo a qualidade HD (0.6) que definimos antes
            const viewport = page.getViewport({ scale: 0.6 }); 
            
            const wrapper = document.createElement('div');
            wrapper.className = "relative group cursor-pointer transition-transform transform hover:-translate-y-1 duration-200";

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = "w-full h-auto rounded-lg shadow-sm border border-gray-200 bg-white transition-all";
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const numberBadge = `<div class="absolute bottom-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none backdrop-blur-sm">${i}</div>`;
            const checkOverlay = `<div id="check-${i}" class="absolute inset-0 bg-red-600/10 border-4 border-red-500 rounded-lg hidden flex items-center justify-center z-10 animate-fade-in"><div class="bg-red-500 text-white rounded-full p-1.5 shadow-md"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div></div>`;
            
            wrapper.innerHTML = checkOverlay + numberBadge;
            wrapper.prepend(canvas);

            wrapper.onclick = () => {
                const check = document.getElementById(`check-${i}`);
                if (window.selectedPages.has(i)) {
                    window.selectedPages.delete(i);
                    check.classList.add('hidden');
                    canvas.classList.remove('opacity-90', 'ring-4', 'ring-red-500/30');
                } else {
                    window.selectedPages.add(i);
                    check.classList.remove('hidden');
                    canvas.classList.add('opacity-90', 'ring-4', 'ring-red-500/30');
                }
                updateRangeInput();
            };

            grid.appendChild(wrapper);
        }

    } catch (error) {
        console.error(error);
        alert("Erro ao ler PDF.");
    }

    // Botão Cancelar usando a função inteligente
    document.getElementById('btn-cancel').onclick = () => {
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    // Botão Processar
    document.getElementById('process-btn-sidebar').onclick = async () => {
        const btn = document.getElementById('process-btn-sidebar');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando...`;

        const formData = new FormData();
        formData.append("files", file);
        
        const rangeInput = document.getElementById('pages-range-input');
        if (rangeInput && rangeInput.value) {
            formData.append("ranges", rangeInput.value);
        }

        const mergeCheckbox = document.getElementById('merge-checkbox');
        const shouldMerge = mergeCheckbox && mergeCheckbox.checked ? "true" : "false";
        formData.append("merge_pages", shouldMerge);

        try {
            const response = await fetch('/api/dividir', { method: 'POST', body: formData });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                const timestamp = new Date().toLocaleTimeString('pt-BR').replace(/:/g, 'h');
                let ext = shouldMerge === "true" ? "pdf" : "zip";
                a.download = `${file.name.replace('.pdf','')}_Dividido_${timestamp}.${ext}`;
                
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                
                btn.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Concluído!`;
                
                if(window.showToast) window.showToast("Sucesso! Download iniciado.", "success");

                // --- AQUI ESTÁ A MUDANÇA ---
                // Espera 2 segundos (pra ler o sucesso) e reseta a ferramenta atual (volta pro upload)
                // em vez de recarregar a página (voltar pra home)
                setTimeout(() => {
                    if (window.resetCurrentTool) window.resetCurrentTool();
                    else location.reload();
                }, 2000);

            } else {
                if(window.showToast) window.showToast("Erro no servidor.", "error");
                else alert("Erro no servidor.");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            if(window.showToast) window.showToast("Erro de conexão.", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };
}

function updateRangeInput() {
    const pages = Array.from(window.selectedPages).sort((a, b) => a - b);
    const input = document.getElementById('pages-range-input');
    if(input) input.value = pages.join(', ');
}

window.setupSplitVisualEditor = setupSplitVisualEditor;