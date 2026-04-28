// visual/js/modules/remove_bg_ui.js

async function setupRemoveBgVisualEditor(file) {
    console.log("Iniciando Modo Removedor de Fundo Visual...");

    const uploadContainer = document.getElementById('upload-container');
    if (!window.originalUploadHtml) {
        window.originalUploadHtml = uploadContainer.innerHTML;
    }

    uploadContainer.innerHTML = '';
    uploadContainer.className = "w-full max-w-[95%] mx-auto py-6 animate-fade-in";

    // Cria a URL local do arquivo original para exibição imediata
    const originalImageUrl = URL.createObjectURL(file);

    // Estrutura principal da UI (Enquanto processa)
    const editorWrapper = document.createElement('div');
    editorWrapper.className = "flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]";

    editorWrapper.innerHTML = `
        <!-- Área Visual (Esquerda/Centro) -->
        <div class="flex-1 bg-gray-100 rounded-xl border border-gray-200 flex flex-col overflow-hidden relative" id="bg-editor-area">
            
            <div class="bg-white p-3 border-b border-gray-200 flex justify-between items-center z-10">
                <span class="text-sm font-bold text-gray-500 uppercase tracking-wide px-2">Remoção de Fundo com IA</span>
            </div>

            <!-- Loading State -->
            <div id="remove-bg-loading" class="flex-1 flex flex-col items-center justify-center text-gray-500 absolute inset-0 z-20 bg-white/80 backdrop-blur-sm">
                <svg class="w-12 h-12 animate-spin mb-4 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-lg font-bold text-gray-800">Mágica acontecendo...</span>
                <span class="text-sm mt-2 text-center max-w-sm">Nossa IA está identificando o objeto principal e apagando o cenário. Isso pode levar alguns segundos.</span>
            </div>

            <!-- Slider Container (Inicialmente escondido) -->
            <div id="comparison-container" class="relative w-full h-full hidden overflow-hidden bg-gray-200 flex items-center justify-center p-4">
                
                <div class="relative flex shadow-xl rounded-lg overflow-hidden" id="image-wrapper" style="max-width: 100%; max-height: 100%; user-select: none;">
                    <!-- Fundo Quadriculado restrito ao tamanho da imagem -->
                    <div class="absolute inset-0 z-0 bg-white" style="background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;"></div>
                    
                    <!-- Canvas Sem Fundo (Edição de Pincel) -->
                    <canvas id="canvas-no-bg" class="relative z-10 max-w-full object-contain cursor-crosshair" style="max-height: calc(100vh - 200px); touch-action: none;"></canvas>
                    
                    <!-- Imagem Original (Cima - Recortada) -->
                    <img id="img-original" src="${originalImageUrl}" class="absolute top-0 left-0 w-full h-full object-contain pointer-events-none z-20" style="clip-path: inset(0 50% 0 0);" />
                    
                    <!-- Slider Handle -->
                    <div id="slider-handle" class="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center justify-center" style="left: 50%; width: 40px; margin-left: -20px;">
                        <div class="w-1 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                        <div class="absolute w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs tracking-tighter">
                            &lt;|&gt;
                        </div>
                    </div>

                    <!-- Cursor Visual do Pincel -->
                    <div id="brush-cursor" class="absolute rounded-full pointer-events-none z-[60] hidden" style="border: 2px solid white; background-color: rgba(236, 72, 153, 0.4); transform: translate(-50%, -50%); box-shadow: 0 0 4px rgba(0,0,0,0.5); transition: width 0.1s, height 0.1s;"></div>
                </div>
            </div>
        </div>

        <!-- Sidebar de Ação (Direita) -->
        <div class="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div class="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <div class="overflow-hidden">
                        <h2 class="text-lg font-bold text-gray-800">Recorte Finalizado</h2>
                        <p class="text-xs text-gray-400 truncate block" title="${file.name}">${file.name}</p>
                    </div>
                </div>

                <!-- Nova seção de Edição -->
                <div id="brush-tools" class="hidden flex flex-col gap-4 mb-6 pb-4 border-b border-gray-100">
                    <h3 class="text-sm font-bold text-gray-700">Pincel Mágico</h3>
                    
                    <div class="flex bg-gray-100 p-1 rounded-lg">
                        <button id="btn-mode-erase" class="flex-1 py-2 text-sm font-bold bg-white shadow-sm rounded text-gray-800 transition">Apagar</button>
                        <button id="btn-mode-restore" class="flex-1 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition">Restaurar</button>
                    </div>
                    
                    <div class="flex flex-col gap-2 mt-2">
                        <div class="flex justify-between text-xs text-gray-500 font-medium">
                            <span>Tamanho do Pincel</span>
                            <span id="brush-size-val">50px</span>
                        </div>
                        <input type="range" id="brush-size" min="5" max="200" value="50" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600">
                    </div>
                </div>

                <div class="space-y-4 flex-1 text-sm text-gray-600">
                    <p>Deslize a barra central na imagem para ver o "Antes" e "Depois".</p>
                    <p class="text-xs text-gray-400">O fundo quadriculado indica as áreas que ficaram perfeitamente transparentes (formato PNG).</p>
                </div>

                <div class="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3">
                    <button id="btn-download-bg" disabled class="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span>Fazer Download</span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                    
                    <button id="btn-cancel-bg" class="w-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 font-medium py-2 px-4 rounded-lg transition text-sm">
                        Processar Outra Imagem
                    </button>
                </div>
            </div>
        </div>
    `;

    uploadContainer.appendChild(editorWrapper);

    document.getElementById('btn-cancel-bg').onclick = () => {
        URL.revokeObjectURL(originalImageUrl);
        if (window.resetCurrentTool) window.resetCurrentTool();
        else location.reload();
    };

    let processedImageB64 = null;
    let finalFilename = "Imagem_Sem_Fundo.png";

    // Chama a API de IA do backend
    try {
        const formData = new FormData();
        formData.append("files", file);

        const response = await fetch("/api/remover-fundo", {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Erro no processamento da imagem.");
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Erro desconhecido.");

        processedImageB64 = data.image_b64;
        finalFilename = data.filename;

        // Oculta o loading e exibe a interface
        document.getElementById('remove-bg-loading').classList.add('hidden');
        document.getElementById('comparison-container').classList.remove('hidden');
        document.getElementById('btn-download-bg').disabled = false;

        // Configura as imagens no slider
        const canvasNoBg = document.getElementById('canvas-no-bg');
        const imgOriginal = document.getElementById('img-original');
        const ctx = canvasNoBg.getContext('2d', { willReadFrequently: true });
        
        const tempImg = new Image();
        tempImg.onload = () => {
            // Define as dimensões reais do canvas para evitar perda de qualidade
            canvasNoBg.width = tempImg.naturalWidth;
            canvasNoBg.height = tempImg.naturalHeight;
            
            // Desenha o resultado da IA na tela
            ctx.drawImage(tempImg, 0, 0);
            
            // Ativa controles de edição
            setupBrushEditor(canvasNoBg, ctx, imgOriginal);
        };
        tempImg.src = processedImageB64;

        setupSlider();

    } catch (e) {
        console.error(e);
        document.getElementById('remove-bg-loading').innerHTML = `
            <div class="text-red-500 flex flex-col items-center">
                <svg class="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span class="font-bold">Falha no processamento</span>
                <span class="text-sm mt-2">${e.message}</span>
            </div>
        `;
    }

    // Ação do Botão Download
    document.getElementById('btn-download-bg').onclick = () => {
        if (!processedImageB64) return;
        const canvasNoBg = document.getElementById('canvas-no-bg');
        
        // Exporta do Canvas para pegar edições manuais
        const finalDataURL = canvasNoBg.toDataURL('image/png');
        
        const a = document.createElement('a');
        a.href = finalDataURL;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

function setupSlider() {
    const wrapper = document.getElementById('image-wrapper');
    const handle = document.getElementById('slider-handle');
    
    let isDragging = false;

    const onMove = (e) => {
        if (!isDragging) return;
        
        let clientX = e.clientX;
        if (e.touches && e.touches.length > 0) clientX = e.touches[0].clientX;

        const rect = wrapper.getBoundingClientRect();
        let x = clientX - rect.left;
        
        // Limita o movimento dentro dos limites da imagem
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        
        const percent = (x / rect.width) * 100;
        
        handle.style.left = `${percent}%`;
        const imgOriginal = document.getElementById('img-original');
        imgOriginal.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    };

    handle.addEventListener('mousedown', () => isDragging = true);
    handle.addEventListener('touchstart', () => isDragging = true);
    
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('touchend', () => isDragging = false);
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
}

function setupBrushEditor(canvas, ctx, originalImg) {
    document.getElementById('brush-tools').classList.remove('hidden');
    
    let isDrawing = false;
    let brushMode = 'erase';
    let brushSize = 50;
    
    const btnErase = document.getElementById('btn-mode-erase');
    const btnRestore = document.getElementById('btn-mode-restore');
    const brushInput = document.getElementById('brush-size');
    const brushVal = document.getElementById('brush-size-val');
    const brushCursor = document.getElementById('brush-cursor');
    
    const updateCursorSize = () => {
        const rect = canvas.getBoundingClientRect();
        const scaleDisplay = rect.width / canvas.width; // Fator de escala visual
        const visualSize = brushSize * scaleDisplay;
        brushCursor.style.width = `${visualSize}px`;
        brushCursor.style.height = `${visualSize}px`;
    };

    const setActiveBtn = (active, inactive) => {
        active.className = "flex-1 py-2 text-sm font-bold bg-white shadow-sm rounded text-gray-800 transition";
        inactive.className = "flex-1 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition";
    };

    btnErase.onclick = () => { brushMode = 'erase'; setActiveBtn(btnErase, btnRestore); };
    btnRestore.onclick = () => { brushMode = 'restore'; setActiveBtn(btnRestore, btnErase); };
    
    brushInput.oninput = (e) => {
        brushSize = parseInt(e.target.value);
        brushVal.textContent = brushSize + 'px';
        updateCursorSize();
    };

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        // Mapeia para a escala real da imagem desenhada
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const drawLine = (startPos, endPos) => {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (brushMode === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            const pattern = ctx.createPattern(originalImg, 'no-repeat');
            ctx.strokeStyle = pattern;
        }
        
        ctx.stroke();
    };

    let lastPos = null;

    const startDraw = (e) => {
        // Bloqueia desenho se estiver arrastando o Slider de Antes/Depois
        if (e.target.id === 'slider-handle' || e.target.closest('#slider-handle')) return;
        
        isDrawing = true;
        lastPos = getPos(e);
        drawLine(lastPos, {x: lastPos.x + 0.1, y: lastPos.y});
        
        if (e.type === 'touchstart') e.preventDefault();
    };

    const moveDraw = (e) => {
        // Atualiza a posição do cursor visual
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX && clientY) {
            brushCursor.style.left = `${clientX - rect.left}px`;
            brushCursor.style.top = `${clientY - rect.top}px`;
        }

        if (!isDrawing) return;
        const newPos = getPos(e);
        drawLine(lastPos, newPos);
        lastPos = newPos;
        if (e.type === 'touchmove') e.preventDefault();
    };

    const endDraw = () => {
        isDrawing = false;
        lastPos = null;
    };

    canvas.addEventListener('mouseenter', () => {
        brushCursor.classList.remove('hidden');
        updateCursorSize();
    });
    canvas.addEventListener('mouseleave', () => {
        brushCursor.classList.add('hidden');
    });

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', moveDraw, {passive: false});
    window.addEventListener('touchend', endDraw);
}

window.setupRemoveBgVisualEditor = setupRemoveBgVisualEditor;
