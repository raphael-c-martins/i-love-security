// visual/js/script.js

// --- CONFIGURAÇÃO ---
const tools = [
    // PDF
    { main: "PDF", title: "Organizar PDF", category: "organizar", desc: "Reordene as páginas do seu PDF visualmente ou remova páginas indesejadas.", iconColor: "text-purple-600", bgColor: "bg-purple-100", iconPath: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { main: "PDF", title: "Juntar PDF", category: "organizar", desc: "Combine múltiplos arquivos PDF em um único documento, na ordem que preferir.", iconColor: "text-red-600", bgColor: "bg-red-100", iconPath: "M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4m-16 5l8 4 8-4" },
    { main: "PDF", title: "Dividir PDF", category: "organizar", desc: "Extraia páginas específicas ou divida um documento em vários arquivos menores.", iconColor: "text-orange-600", bgColor: "bg-orange-100", iconPath: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" },
    { main: "PDF", title: "Comprimir PDF", category: "otimizar", desc: "Reduza o tamanho do arquivo PDF mantendo a qualidade visual para envio fácil.", iconColor: "text-green-600", bgColor: "bg-green-100", iconPath: "M19 14l-7 7m0 0l-7-7m7 7V3" },
    { main: "PDF", title: "PDF ↔ Imagem", category: "converter", desc: "Converta páginas de PDF em imagens ou crie PDFs a partir de suas fotos e scans.", iconColor: "text-purple-600", bgColor: "bg-purple-100", iconPath: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { main: "PDF", title: "PDF ↔ Word", category: "converter", desc: "Converta documentos PDF para Word (DOCX) e edite o texto livremente.", iconColor: "text-blue-700", bgColor: "bg-blue-50", iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    
    // Imagens
    { main: "Imagens", title: "Remover Fundo", category: "edicao", desc: "Remova automaticamente o fundo de suas imagens PNG/JPG.", iconColor: "text-pink-600", bgColor: "bg-pink-100", iconPath: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
    { main: "Imagens", title: "Converter Imagem", category: "converter", desc: "Converta imagens em lote para diversos formatos.", iconColor: "text-indigo-600", bgColor: "bg-indigo-100", iconPath: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },

    // TIF
    { main: "TIF", title: "Organizar TIF", category: "organizar", desc: "Reordene visualmente as páginas de arquivos TIF e exclua frames.", iconColor: "text-teal-600", bgColor: "bg-teal-100", iconPath: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { main: "TIF", title: "Comprimir TIF", category: "otimizar", desc: "Reduza drasticamente o tamanho de arquivos TIF multipágina.", iconColor: "text-teal-600", bgColor: "bg-teal-100", iconPath: "M19 14l-7 7m0 0l-7-7m7 7V3" }
];

let selectedFiles = [];
let currentTool = null;
let currentMainCategory = "PDF";

// --- FUNÇÃO TOAST ---
window.showToast = function (message, type = 'success') {
    const existing = document.getElementById('custom-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.className = `font-medium text-sm ${type}`;

    const icon = type === 'success'
        ? `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        : `<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

    toast.innerHTML = `${icon} <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function getFormattedDate() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    const date = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    return `${time}-${date}`;
}

// --- RENDERIZAÇÃO ---
window.setMainCategory = function(category) {
    currentMainCategory = category;
    
    // Atualiza estilo das abas
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('font-bold', 'text-red-600', 'border-red-600');
        tab.classList.add('font-medium', 'text-gray-500', 'border-transparent');
    });
    
    const activeTab = document.getElementById(`tab-${category}`);
    if(activeTab) {
        activeTab.classList.remove('font-medium', 'text-gray-500', 'border-transparent');
        activeTab.classList.add('font-bold', 'text-red-600', 'border-red-600');
    }

    // Atualiza textos do Header
    const title = document.getElementById('main-title');
    const subtitle = document.getElementById('main-subtitle');
    const headerSection = document.getElementById('header-section');
    const uploadContainer = document.getElementById('upload-container');

    if (category === "Imagens") {
        title.innerText = "Estúdio Criativo: Manipulação de Imagens";
        subtitle.innerText = "Remova fundos e converta formatos com facilidade e sem limites.";
    } else if (category === "PDF") {
        title.innerText = "Privacidade Total: Ferramentas Locais de PDF";
        subtitle.innerText = "Seus dados nunca saem da sua máquina. Segurança e rapidez offline.";
    } else if (category === "TIF") {
        title.innerText = "Ferramentas TIF de Alta Densidade";
        subtitle.innerText = "Comprima e manipule arquivos corporativos TIF localmente.";
    }

    // Restaura layout padrão (cards)
    if (headerSection) {
        headerSection.classList.remove('hidden');
        headerSection.classList.remove('pt-6', 'pb-4');
        headerSection.classList.add('py-12');
    }
    if (title) title.classList.replace('mb-1', 'mb-4');
    
    if (uploadContainer) {
        uploadContainer.classList.add('hidden');
        uploadContainer.classList.replace('pb-6', 'pb-20');
    }

    const mainElement = document.querySelector('main');
    if (mainElement) mainElement.classList.remove('hidden');
    
    const filters = document.querySelector('.flex.flex-wrap');
    if (filters) filters.classList.remove('hidden');

    renderSubFilters(category);
    filterTools('all');
}


function renderSubFilters(mainCategory) {
    const container = document.getElementById('sub-filters');
    if(!container) return;
    container.innerHTML = '';
    
    const relevantTools = tools.filter(t => t.main === mainCategory);
    const categories = new Set(relevantTools.map(t => t.category));
    
    // Botão "Todas"
    const btnAll = document.createElement('button');
    btnAll.onclick = () => filterTools('all');
    btnAll.className = "filter-btn bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors";
    btnAll.innerText = "Todas";
    btnAll.dataset.category = "all";
    container.appendChild(btnAll);

    // Dicionário de labels bonitos
    const labels = {
        'organizar': 'Organizar',
        'otimizar': 'Otimizar',
        'converter': 'Converter',
        'seguranca': 'Segurança',
        'edicao': 'Edição'
    };

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.onclick = () => filterTools(cat);
        btn.className = "filter-btn bg-white text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors";
        btn.innerText = labels[cat] || cat;
        btn.dataset.category = cat;
        container.appendChild(btn);
    });
}

function renderTools(toolsToDisplay = tools) {
    const grid = document.getElementById('tools-grid');
    if (!grid) return;
    grid.innerHTML = '';

    toolsToDisplay.forEach(tool => {
        const card = document.createElement('div');
        card.className = "bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group";
        card.innerHTML = `
            <div class="mb-4">
                <div class="w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 ${tool.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${tool.iconPath}"></path></svg>
                </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">${tool.title}</h3>
            <p class="text-gray-500 text-sm mt-2">${tool.desc}</p>
        `;
        card.onclick = () => openUploadArea(tool);
        grid.appendChild(card);
    });
}

window.filterTools = function(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.remove('bg-white', 'text-gray-600');
            btn.classList.add('bg-gray-800', 'text-white');
        } else {
            btn.classList.remove('bg-gray-800', 'text-white');
            btn.classList.add('bg-white', 'text-gray-600');
        }
    });

    const relevant = tools.filter(t => t.main === currentMainCategory);
    const filtered = category === 'all' ? relevant : relevant.filter(t => t.category === category);
    renderTools(filtered);
}

// --- UPLOAD AREA ---
function openUploadArea(tool) {
    currentTool = tool;

    document.querySelector('section').classList.add('hidden');
    document.querySelector('main').classList.add('hidden');
    document.querySelector('.flex.flex-wrap').classList.add('hidden');

    const container = document.getElementById('upload-container');
    container.classList.remove('hidden');
    container.className = "container mx-auto px-4 pb-20 max-w-4xl animate-fade-in";

    // --- "Converter Imagem" → abre UI dedicada ANTES do HTML genérico ---
    if (tool.title === "Converter Imagem") {
        if (typeof setupConvertImageUI === 'function') {
            setupConvertImageUI(); // UI com painel de formatos aparece imediatamente
        }
        return;
    }

    container.innerHTML = `
        <button id="back-btn" class="mb-6 flex items-center text-gray-600 hover:text-red-600 transition-colors font-medium">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Voltar para todas as ferramentas
        </button>

        <div class="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center hover:border-red-400 transition-colors cursor-pointer" id="drop-zone">
            <div class="flex flex-col items-center">
                <div id="tool-icon-placeholder" class="mb-6"></div>
                <h2 id="tool-title-active" class="text-3xl font-bold text-gray-800 mb-2"></h2>
                <p class="text-gray-500 mb-8">Arraste os arquivos para cá ou clique para selecionar</p>
                
                <button class="bg-red-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-red-700 transform hover:scale-105 transition-all">
                    Selecionar arquivos
                </button>

                <input type="file" id="file-input" class="hidden" multiple>
            </div>
        </div>

        <div id="file-list" class="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full hidden"></div>

        <div class="mt-8 flex justify-center">
            <button id="process-btn" class="hidden bg-gray-800 text-white px-10 py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-gray-900 transition-all flex items-center">
                Processar Arquivos
            </button>
        </div>
    `;

    // Configura Títulos e Ícones
    document.getElementById('tool-title-active').innerText = tool.title;
    document.getElementById('tool-icon-placeholder').innerHTML = `
        <div class="w-20 h-20 ${tool.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 ${tool.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${tool.iconPath}"></path></svg>
        </div>
    `;

    // --- Filtro de tipo de arquivo ---
    const fileInput = document.getElementById('file-input');

    if (tool.title === "PDF ↔ Imagem") {
        fileInput.setAttribute("accept", ".pdf,.jpg,.jpeg,.png,.webp");
    } else if (tool.title === "PDF ↔ Word") {
        fileInput.setAttribute("accept", ".pdf,.docx");
    } else if (tool.title === "Remover Fundo") {
        fileInput.setAttribute("accept", ".jpg,.jpeg,.png,.webp");
    } else if (tool.title === "Comprimir TIF" || tool.title === "Organizar TIF") {
        fileInput.setAttribute("accept", ".tif,.tiff");
    } else {
        fileInput.setAttribute("accept", ".pdf");
    }

    setupUploadEvents();

    selectedFiles = [];
    document.getElementById('back-btn').onclick = () => location.reload();
}

window.resetCurrentTool = function () {
    if (currentTool) {
        openUploadArea(currentTool);
    } else {
        location.reload();
    }
};

function setupUploadEvents() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (dropZone && fileInput) {
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => handleFiles(e.target.files);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
        });
        dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
    }
}

window.handleFiles = function (files) {
    const toolTitle = document.getElementById('tool-title-active').innerText;

    for (let file of files) {
        // Validação extra via JS caso o usuário arraste arquivo errado
        const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp)$/i);
        const isTif = file.name.match(/\.(tif|tiff)$/i);
        const isPdf = file.type === "application/pdf";

        if (toolTitle === "PDF ↔ Imagem") {
            if (isImage || isPdf) selectedFiles.push(file);
            else window.showToast(`Arquivo ${file.name} ignorado. Apenas PDF ou Imagens.`, 'error');
        } else if (toolTitle === "PDF ↔ Word") {
            const isDocx = file.name.toLowerCase().endsWith('.docx');
            if (isPdf || isDocx) selectedFiles.push(file);
            else window.showToast(`Arquivo ${file.name} ignorado. Apenas PDF ou DOCX.`, 'error');
        } else if (toolTitle === "Remover Fundo" || toolTitle === "Converter Imagem") {
            if (isImage) selectedFiles.push(file);
            else window.showToast(`Arquivo ${file.name} ignorado. Apenas Imagens.`, 'error');
        } else if (toolTitle === "Comprimir TIF" || toolTitle === "Organizar TIF") {
            if (isTif) selectedFiles.push(file);
            else window.showToast(`Arquivo ${file.name} ignorado. Apenas TIF/TIFF.`, 'error');
        } else {
            if (isPdf) selectedFiles.push(file);
            else window.showToast(`Arquivo ${file.name} ignorado. Apenas PDF.`, 'error');
        }
    }

    if (toolTitle === "Dividir PDF" && selectedFiles.length > 0) {
        if (typeof setupSplitVisualEditor === 'function') {
            setupSplitVisualEditor(selectedFiles[0]); // Manda só o primeiro
        }
    }
    // --- ADICIONE ESTE BLOCO AQUI ---
    else if (toolTitle === "Juntar PDF" && selectedFiles.length > 0) {
        if (typeof setupMergeVisualEditor === 'function') {
            // Manda TODOS os arquivos selecionados
            // Precisamos clonar o array pq selectedFiles é global e limpo frequentemente
            setupMergeVisualEditor([...selectedFiles]);
        }
    }

    // --- NOVO MÓDULO UNIFICADO ---
    else if (toolTitle === "PDF ↔ Imagem" && selectedFiles.length > 0) {
        if (typeof setupImageConverterVisualEditor === 'function') {
            setupImageConverterVisualEditor([...selectedFiles]);
        }
    }

    // --- NOVO MÓDULO WORD ---
    else if (toolTitle === "PDF ↔ Word" && selectedFiles.length > 0) {
        if (typeof setupWordConverterVisualEditor === 'function') {
            setupWordConverterVisualEditor([...selectedFiles]);
        }
    }

    // --- NOVO MÓDULO ORGANIZAR ---
    else if (toolTitle === "Organizar PDF" && selectedFiles.length > 0) {
        if (typeof setupOrganizeVisualEditor === 'function') {
            setupOrganizeVisualEditor(selectedFiles[0]); // Manda só o primeiro por enquanto
        }
    }

    // --- NOVO MÓDULO TIF ORGANIZAR ---
    else if (toolTitle === "Organizar TIF" && selectedFiles.length > 0) {
        if (typeof setupOrganizeTifVisualEditor === 'function') {
            setupOrganizeTifVisualEditor(selectedFiles[0]);
        }
    }

    // --- NOVO MÓDULO REMOVER FUNDO ---
    else if (toolTitle === "Remover Fundo" && selectedFiles.length > 0) {
        if (typeof setupRemoveBgVisualEditor === 'function') {
            setupRemoveBgVisualEditor(selectedFiles[0]);
        }
    }

    // --- MÓDULO CONVERTER IMAGEM (caso cheguem via drag-and-drop na drop-zone genérica) ---
    else if (toolTitle === "Converter Imagem" && selectedFiles.length > 0) {
        if (typeof setupConvertImageUI === 'function') {
            setupConvertImageUI([...selectedFiles]);
        }
    }

    // --------------------------------
    else {
        renderFileList();
    }
}

function renderFileList() {
    const container = document.getElementById('file-list');
    const btn = document.getElementById('process-btn');
    if (!container) return;

    container.classList.remove('hidden');
    container.innerHTML = '';

    selectedFiles.forEach((file, idx) => {
        const div = document.createElement('div');
        div.className = "relative bg-gray-50 border border-gray-200 p-4 rounded-lg flex flex-col items-center group";
        div.onclick = (e) => e.stopPropagation();
        div.innerHTML = `
            <button onclick="removeFile(${idx})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            <svg class="w-10 h-10 text-red-500 mb-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"></path></svg>
            <span class="text-xs font-medium text-gray-700 truncate w-full text-center">${file.name}</span>
        `;
        container.appendChild(div);
    });

    if (selectedFiles.length > 0) btn.classList.remove('hidden');
}

window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    renderFileList();
};

document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'process-btn') {
        const btn = e.target;
        const toolTitle = document.getElementById('tool-title-active').innerText;

        if (selectedFiles.length === 0) return;

        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando...`;

        let endpoint = "";
        if (toolTitle === "Juntar PDF") endpoint = "/api/juntar";
        else if (toolTitle === "Dividir PDF") endpoint = "/api/dividir";
        else if (toolTitle === "Comprimir PDF") endpoint = "/api/comprimir";
        else if (toolTitle === "PDF para JPG") endpoint = "/api/pdf-para-jpg";
        else if (toolTitle === "JPG para PDF") endpoint = "/api/jpg-para-pdf";
        else if (toolTitle === "PDF para Word") endpoint = "/api/pdf-para-word";
        else if (toolTitle === "Remover Fundo") endpoint = "/api/remover-fundo";
        else if (toolTitle === "Converter Imagem") endpoint = "/api/converter-imagem";
        else if (toolTitle === "Comprimir TIF") endpoint = "/api/comprimir-tif";

        const formData = new FormData();
        selectedFiles.forEach(file => formData.append("files", file));

        if (toolTitle === "Dividir PDF") {
            const rangeInput = document.getElementById('pages-range-input');
            if (rangeInput && rangeInput.value) formData.append("ranges", rangeInput.value);
        }

        try {
            // Função auxiliar para formatar tamanho (KB, MB)
            const formatBytes = (bytes) => {
                if (!bytes || bytes == 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // 1. CAPTURA A VITÓRIA
                const originalSize = response.headers.get('X-Original-Size');
                const finalSize = response.headers.get('X-Final-Size');
                const economy = response.headers.get('X-Economy-Percent');

                // --- DEBUG (Aperte F12 no navegador e olhe o Console) ---
                console.log("Título da Ferramenta:", toolTitle);
                console.log("Tamanho Original:", originalSize);
                console.log("Tamanho Final:", finalSize);
                console.log("Economia:", economy);
                // --------------------------------------------------------

                const blob = await response.blob();
                // ... (resto do código igual)
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                let originalName = selectedFiles[0].name.replace(/\.[^/.]+$/, ""); // Remove qualquer extensão
                let downloadFilename = `Resultado_${timestamp}.zip`;

                // Tenta extrair o nome original enviado pelo Backend via Content-Disposition
                const contentDisposition = response.headers.get('Content-Disposition');
                if (contentDisposition && contentDisposition.includes('filename=')) {
                    const match = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (match && match[1]) {
                        downloadFilename = match[1];
                    }
                } else {
                    // Fallback local baseado na ferramenta
                    if (toolTitle === "Juntar PDF") downloadFilename = `Junto_${timestamp}.pdf`;
                    else if (toolTitle === "Dividir PDF") downloadFilename = `${originalName}_Dividido_${timestamp}.zip`;
                    else if (toolTitle === "Comprimir PDF") downloadFilename = `${originalName}_Otimizado.pdf`;
                    else if (toolTitle.includes("Word")) downloadFilename = `${originalName}.docx`;
                    else if (toolTitle === "Remover Fundo") downloadFilename = `${originalName}_Sem_Fundo.png`;
                    else if (toolTitle === "Comprimir TIF" && selectedFiles.length === 1) downloadFilename = `${originalName}_Comprimido.tif`;
                }

                a.download = downloadFilename;

                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                // 2. MENSAGEM PERSONALIZADA (O Placar do Jogo)
                let msgSucesso = "Sucesso! Download iniciado.";

                // Só mostra os detalhes se for compressão e tiver dados válidos
                if (toolTitle === "Comprimir PDF" && originalSize && finalSize) {
                    msgSucesso = `📉 Compactado! De ${formatBytes(originalSize)} para ${formatBytes(finalSize)} (-${economy}%)`;
                }

                window.showToast(msgSucesso, "success");

                btn.innerHTML = originalText;
                btn.disabled = false;

            } else {
                window.showToast("Erro no servidor.", "error");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error(error);
            window.showToast("Erro de conexão.", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
});

// A inicialização agora é feita individualmente em cada página HTML
// (index.html, imagens.html, tif.html) para garantir a categoria correta.