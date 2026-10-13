// visual/js/script.js

// --- CONFIGURAÇÃO ---
const tools = [
    // PDF
    { main: "PDF", slug: "organizar", title: "Organizar PDF", category: "organizar", desc: "Reordene as páginas do seu PDF visualmente ou remova páginas indesejadas.", iconColor: "text-purple-600", bgColor: "bg-purple-100", iconPath: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { main: "PDF", slug: "juntar", title: "Juntar PDF", category: "organizar", desc: "Combine múltiplos arquivos PDF em um único documento, na ordem que preferir.", iconColor: "text-red-600", bgColor: "bg-red-100", iconPath: "M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4m-16 5l8 4 8-4" },
    { main: "PDF", slug: "dividir", title: "Dividir PDF", category: "organizar", desc: "Extraia páginas específicas ou divida um documento em vários arquivos menores.", iconColor: "text-orange-600", bgColor: "bg-orange-100", iconPath: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" },
    { main: "PDF", slug: "comprimir", title: "Comprimir PDF", category: "otimizar", desc: "Reduza o tamanho do arquivo PDF mantendo a qualidade visual para envio fácil.", iconColor: "text-green-600", bgColor: "bg-green-100", iconPath: "M19 14l-7 7m0 0l-7-7m7 7V3" },
    { main: "PDF", slug: "pdf-imagem", title: "PDF ↔ Imagem", category: "converter", desc: "Converta páginas de PDF em imagens ou crie PDFs a partir de suas fotos e scans.", iconColor: "text-purple-600", bgColor: "bg-purple-100", iconPath: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { main: "PDF", slug: "pdf-word", title: "PDF ↔ Word", category: "converter", desc: "Converta documentos PDF para Word (DOCX) e edite o texto livremente.", iconColor: "text-blue-700", bgColor: "bg-blue-50", iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { main: "PDF", slug: "pdf-tiff", title: "PDF ↔ TIFF", category: "converter", desc: "Converta PDF em TIFF multipáginas ou transforme TIFFs em PDF unificado.", iconColor: "text-emerald-600", bgColor: "bg-emerald-100", iconPath: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
    
    // Imagens
    { main: "Imagens", slug: "remover-fundo", title: "Remover Fundo", category: "edicao", desc: "Remova automaticamente o fundo de suas imagens PNG/JPG.", iconColor: "text-pink-600", bgColor: "bg-pink-100", iconPath: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
    { main: "Imagens", slug: "converter", title: "Converter Imagem", category: "converter", desc: "Converta imagens em lote para diversos formatos.", iconColor: "text-indigo-600", bgColor: "bg-indigo-100", iconPath: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },

    // TIF
    { main: "TIF", slug: "juntar", title: "Juntar TIF", category: "organizar", desc: "Combine múltiplos arquivos ou páginas TIF em um único documento multipáginas.", iconColor: "text-indigo-600", bgColor: "bg-indigo-100", iconPath: "M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4m-16 5l8 4 8-4", badge: { type: "novo", date: "2026-07-21" } },
    { main: "TIF", slug: "organizar", title: "Organizar TIF", category: "organizar", desc: "Reordene visualmente as páginas de arquivos TIF e exclua frames.", iconColor: "text-teal-600", bgColor: "bg-teal-100", iconPath: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { main: "TIF", slug: "recortar", title: "Recortar TIF", category: "organizar", desc: "Extraia páginas específicas usando intervalos rápidos como 1-5, 7-9, 15-40.", iconColor: "text-amber-600", bgColor: "bg-amber-100", iconPath: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" },
    { main: "TIF", slug: "comprimir", title: "Comprimir TIF", category: "otimizar", desc: "Reduza drasticamente o tamanho de arquivos TIF multipágina.", iconColor: "text-teal-600", bgColor: "bg-teal-100", iconPath: "M19 14l-7 7m0 0l-7-7m7 7V3" },
    { main: "TIF", slug: "pdf-tiff", title: "PDF ↔ TIFF", category: "converter", desc: "Converta PDF em TIFF multipáginas ou transforme TIFFs em PDF unificado.", iconColor: "text-emerald-600", bgColor: "bg-emerald-100", iconPath: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" }
];

let selectedFiles = [];
let currentTool = null;
let currentMainCategory = "PDF";

// --- FUNÇÃO TOAST DE ALTA DENSIDADE ---
window.showToast = function (message, type = 'success') {
    const existing = document.getElementById('custom-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.className = `font-medium text-sm ${type}`;

    let icon = `<svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    if (type === 'error') {
        icon = `<svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    } else if (type === 'info') {
        icon = `<svg class="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else if (type === 'warning') {
        icon = `<svg class="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    }

    toast.innerHTML = `${icon} <span class="leading-snug">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4500);
};

function getFormattedDate() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    const date = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    return `${time}-${date}`;
}

// --- FUNÇÃO GLOBAL DE DOWNLOAD (Super Save As) ---
// Utiliza a API moderna para forçar a extensão e lembrar da pasta
window.getFileSaver = async function (defaultFilename) {
    let fileHandle = null;

    if (window.showSaveFilePicker) {
        try {
            // Extrai a extensão do defaultFilename para forçar o tipo
            const extMatch = defaultFilename.match(/\.([^.]+)$/);
            const ext = extMatch ? extMatch[1].toLowerCase() : '*';
            
            // Mapeamento básico de MIME types para forçar a extensão no Windows
            let mimeType = 'application/octet-stream';
            let desc = 'Arquivo';
            if (ext === 'tif' || ext === 'tiff') { mimeType = 'image/tiff'; desc = 'Imagem TIFF'; }
            else if (ext === 'pdf') { mimeType = 'application/pdf'; desc = 'Documento PDF'; }
            else if (ext === 'zip') { mimeType = 'application/zip'; desc = 'Arquivo ZIP'; }
            else if (ext === 'png') { mimeType = 'image/png'; desc = 'Imagem PNG'; }
            else if (ext === 'jpg' || ext === 'jpeg') { mimeType = 'image/jpeg'; desc = 'Imagem JPEG'; }
            else if (ext === 'docx') { mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; desc = 'Documento Word'; }

            const opts = {
                suggestedName: defaultFilename,
                id: 'i-love-security-save', // Força o Windows a lembrar a ÚLTIMA pasta usada por este app
                types: [{
                    description: desc,
                    accept: { [mimeType]: ['.' + ext] }
                }]
            };

            fileHandle = await window.showSaveFilePicker(opts);
        } catch (err) {
            if (err.name === 'AbortError') {
                return null; // Usuário cancelou
            }
            console.error("Erro no File System Access API:", err);
            fetch('/api/log-frontend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: "warning",
                    mensagem: "Fallback no pré-save",
                    detalhes: err.toString()
                })
            }).catch(() => {});
        }
    }

    return async function saveBlob(blob, finalFilename = defaultFilename) {
        if (fileHandle) {
            try {
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                return true;
            } catch (writeErr) {
                console.error("Erro ao escrever no fileHandle:", writeErr);
            }
        }

        // Fallback para a.download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        return true;
    };
};

// ==========================================
// SISTEMA UNIVERSAL DE TELEMETRIA E PROGRESSO (SRE)
// Suporte a arquivos de até 4 GB com Upload %, MB/s, ETA e Servidor Timer
// ==========================================
function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatETA(seconds) {
    if (!seconds || seconds <= 0 || !isFinite(seconds)) return 'Calculando...';
    if (seconds < 60) return `~${seconds}s restantes`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `~${m}m ${s > 0 ? s + 's' : ''} restantes`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `~${h}h ${remM}m restantes`;
}

function calculateFormDataBytes(formData) {
    if (!formData || typeof formData.entries !== 'function') return 0;
    let total = 0;
    try {
        for (let pair of formData.entries()) {
            const val = pair[1];
            if (val instanceof Blob || val instanceof File) {
                total += val.size;
            } else if (typeof val === 'string') {
                total += val.length;
            }
        }
    } catch (_) {}
    return total;
}

function createProgressHUD(config) {
    const existing = document.getElementById('universal-progress-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'universal-progress-overlay';
    overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none';

    const fileSizeStr = config.fileSize > 0 ? ` • ${formatFileSize(config.fileSize)}` : '';
    const isLarge = config.fileSize > 200 * 1024 * 1024; // > 200MB
    const estText = isLarge ? ' (Estimativa: ~45s a 2min)' : '';

    overlay.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 flex flex-col gap-5">
            <!-- Cabeçalho com Título e Badge -->
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div id="u-prog-spinner-wrap" class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <div class="min-w-0">
                        <h3 id="u-prog-title" class="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight truncate">${config.title}</h3>
                        <p id="u-prog-filename" class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]" title="${config.filename}">${config.filename}${fileSizeStr}</p>
                    </div>
                </div>
                <span id="u-prog-badge" class="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 tracking-wide uppercase shrink-0">
                    1. Envio
                </span>
            </div>

            <!-- Stepper Horizontal Sequencial (3 Etapas) -->
            <div class="flex items-center justify-between border-y border-slate-100 dark:border-slate-800 py-3 text-xs">
                <div id="u-step-1" class="u-step-pill flex items-center gap-2 font-bold text-red-600 dark:text-red-400">
                    <span class="u-step-circle w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Upload</span>
                </div>
                <div id="u-step-line-1" class="u-step-line h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                <div id="u-step-2" class="u-step-pill flex items-center gap-2 text-slate-400 dark:text-slate-500 font-medium">
                    <span class="u-step-circle w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Processando</span>
                </div>
                <div id="u-step-line-2" class="u-step-line h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                <div id="u-step-3" class="u-step-pill flex items-center gap-2 text-slate-400 dark:text-slate-500 font-medium">
                    <span class="u-step-circle w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Conclusão</span>
                </div>
            </div>

            <!-- Barra de Progresso Principal -->
            <div class="flex flex-col gap-2">
                <div class="flex justify-between items-baseline">
                    <span id="u-prog-status-label" class="text-xs font-semibold text-slate-700 dark:text-slate-300">Enviando dados com segurança...</span>
                    <span id="u-prog-percentage" class="text-xl font-black text-red-600 dark:text-red-400 tracking-tight">0%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                    <div id="u-prog-bar-fill" class="h-full rounded-full bg-red-600 dark:bg-red-500 transition-all duration-200" style="width: 0%"></div>
                </div>
            </div>

            <!-- Grid de Métricas em Tempo Real -->
            <div class="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <div class="flex flex-col">
                    <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Volume</span>
                    <span id="u-prog-stat-volume" class="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">0 MB</span>
                </div>
                <div class="flex flex-col border-x border-slate-200 dark:border-slate-700 px-1">
                    <span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Velocidade</span>
                    <span id="u-prog-stat-speed" class="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">0 MB/s</span>
                </div>
                <div class="flex flex-col">
                    <span id="u-prog-stat-time-label" class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Tempo Estimado</span>
                    <span id="u-prog-stat-time" class="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mt-0.5">Calculando...</span>
                </div>
            </div>

            <!-- Nota Explicativa com Feedback Corporativo -->
            <div id="u-prog-note" class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span id="u-prog-note-text">${isLarge ? 'Documento denso detectado (> 200 MB)' + estText + '. O processamento roda isolado no servidor. Mantenha a aba aberta.' : 'Operação assíncrona protegida na rede interna. Mantenha esta página aberta.'}</span>
            </div>

            <!-- Botão de Cancelamento com Dupla Confirmação -->
            <div class="flex justify-end gap-3 pt-1">
                <button id="u-prog-btn-cancel" class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900">
                    Cancelar Operação
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Sistema seguro de cancelamento com dupla confirmação contra cliques acidentais
    const btnCancel = overlay.querySelector('#u-prog-btn-cancel');
    if (btnCancel && typeof config.onCancel === 'function') {
        let isConfirming = false;
        let confirmTimer = null;

        btnCancel.onclick = (e) => {
            e.preventDefault();
            if (!isConfirming) {
                isConfirming = true;
                btnCancel.innerText = 'Tem certeza? Clique para abortar';
                btnCancel.className = 'px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-md animate-pulse-subtle';
                confirmTimer = setTimeout(() => {
                    isConfirming = false;
                    btnCancel.innerText = 'Cancelar Operação';
                    btnCancel.className = 'px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900';
                }, 3500);
            } else {
                if (confirmTimer) clearTimeout(confirmTimer);
                config.onCancel();
            }
        };
    }

    return overlay;
}

function updateProgressHUDStageUpload({ percent, loaded, total, speed, etaSeconds }) {
    const bar = document.getElementById('u-prog-bar-fill');
    const pct = document.getElementById('u-prog-percentage');
    const vol = document.getElementById('u-prog-stat-volume');
    const spd = document.getElementById('u-prog-stat-speed');
    const tim = document.getElementById('u-prog-stat-time');

    if (bar) bar.style.width = `${percent}%`;
    if (pct) pct.innerText = `${percent}%`;
    if (vol) vol.innerText = `${formatFileSize(loaded)} / ${formatFileSize(total)}`;
    if (spd) spd.innerText = speed > 0 ? `${(speed / (1024 * 1024)).toFixed(1)} MB/s` : 'Calculando...';
    if (tim) tim.innerText = formatETA(etaSeconds);
}

function updateProgressHUDStageServer({ fileSize }) {
    const badge = document.getElementById('u-prog-badge');
    const label = document.getElementById('u-prog-status-label');
    const pct = document.getElementById('u-prog-percentage');
    const bar = document.getElementById('u-prog-bar-fill');
    const vol = document.getElementById('u-prog-stat-volume');
    const spd = document.getElementById('u-prog-stat-speed');
    const timeLabel = document.getElementById('u-prog-stat-time-label');
    const tim = document.getElementById('u-prog-stat-time');
    const note = document.getElementById('u-prog-note-text');

    // Atualiza Stepper visual
    const step1 = document.getElementById('u-step-1');
    const line1 = document.getElementById('u-step-line-1');
    const step2 = document.getElementById('u-step-2');

    if (step1) {
        step1.className = 'u-step-pill flex items-center gap-2 font-bold u-step-done';
        step1.querySelector('.u-step-circle').innerHTML = '✓';
    }
    if (line1) {
        line1.classList.add('done');
    }
    if (step2) {
        step2.className = 'u-step-pill flex items-center gap-2 font-bold text-amber-500 dark:text-amber-400 u-step-active';
    }

    if (badge) {
        badge.innerText = '2. Processando';
        badge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 tracking-wide uppercase shrink-0';
    }
    if (label) label.innerText = 'Otimizando frames e páginas no servidor...';
    if (pct) pct.innerText = 'Processando...';
    if (bar) {
        bar.style.width = '100%';
        bar.classList.add('progress-stripes-active');
    }
    if (vol) vol.innerText = `${formatFileSize(fileSize)} (Enviado)`;
    if (spd) spd.innerText = 'Conexão OK';
    if (timeLabel) timeLabel.innerText = 'Tempo Decorrido';
    if (tim) tim.innerText = '00:00 decorridos';

    const isLarge = fileSize > 200 * 1024 * 1024;
    if (note) {
        note.innerText = isLarge
            ? 'Envio 100% concluído! Documento volumoso em processamento nos núcleos da CPU. Estimativa média: ~45s a 2min.'
            : 'Envio concluído com sucesso! Os algoritmos de conversão estão sendo aplicados. Aguarde a resposta...';
    }
}

function updateProgressHUDServerTimer(seconds, fileSize) {
    const tim = document.getElementById('u-prog-stat-time');
    if (tim) {
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        tim.innerText = `${mins}:${secs} decorridos`;
    }
}

function updateProgressHUDSuccess() {
    const badge = document.getElementById('u-prog-badge');
    const label = document.getElementById('u-prog-status-label');
    const pct = document.getElementById('u-prog-percentage');
    const bar = document.getElementById('u-prog-bar-fill');
    const spinnerWrap = document.getElementById('u-prog-spinner-wrap');

    // Atualiza Stepper para conclusão
    const step2 = document.getElementById('u-step-2');
    const line2 = document.getElementById('u-step-line-2');
    const step3 = document.getElementById('u-step-3');

    if (step2) {
        step2.className = 'u-step-pill flex items-center gap-2 font-bold u-step-done';
        step2.querySelector('.u-step-circle').innerHTML = '✓';
    }
    if (line2) {
        line2.classList.add('done');
    }
    if (step3) {
        step3.className = 'u-step-pill flex items-center gap-2 font-bold u-step-done';
        step3.querySelector('.u-step-circle').innerHTML = '✓';
    }

    if (spinnerWrap) {
        spinnerWrap.className = 'w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0';
        spinnerWrap.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
    }

    if (badge) {
        badge.innerText = '3. Concluído';
        badge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 tracking-wide uppercase shrink-0';
    }
    if (label) label.innerText = 'Processamento finalizado! Gravando arquivo...';
    if (pct) pct.innerText = '100%';
    if (bar) {
        bar.classList.remove('progress-stripes-active');
        bar.className = 'h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300';
        bar.style.width = '100%';
    }
}

function hideProgressHUD() {
    const overlay = document.getElementById('universal-progress-overlay');
    if (overlay) {
        overlay.classList.add('opacity-0');
        overlay.style.transition = 'opacity 0.25s ease';
        setTimeout(() => overlay.remove(), 250);
    }
}

/**
 * Utilitário Universal de Requisições com Barra de Progresso Real, Métricas e Timer do Servidor
 */
window.fetchWithProgress = function(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const method = options.method || 'POST';
        const formData = options.body;
        const title = options.title || 'Processando';
        const filename = options.filename || 'documento';
        const fileSize = options.fileSize || (formData ? calculateFormDataBytes(formData) : 0);
        const button = options.button || null;
        const originalButtonHtml = button ? button.innerHTML : '';
        const timeoutMs = options.timeout || 1800000; // 30 min

        let xhr = new XMLHttpRequest();
        let serverTimerInterval = null;
        let serverSeconds = 0;

        createProgressHUD({
            title: title,
            filename: filename,
            fileSize: fileSize,
            onCancel: () => {
                if (xhr) {
                    xhr.abort();
                    if (serverTimerInterval) clearInterval(serverTimerInterval);
                    hideProgressHUD();
                    if (button) {
                        button.innerHTML = originalButtonHtml;
                        button.disabled = false;
                    }
                    if (window.showToast) window.showToast('Operação cancelada pelo usuário.', 'error');
                    resolve({
                        ok: false,
                        status: 0,
                        statusText: 'Cancelado pelo usuário',
                        headers: { get: () => null },
                        blob: async () => new Blob(),
                        json: async () => ({ error: 'Cancelado' }),
                        text: async () => 'Cancelado'
                    });
                }
            }
        });

        xhr.open(method, endpoint, true);
        xhr.responseType = 'blob';
        xhr.timeout = timeoutMs;

        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;
        let currentSpeed = 0;

        if (button) {
            button.disabled = true;
        }

        xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) return;
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000;

            if (timeDiff >= 0.4) {
                const bytesDiff = e.loaded - lastLoaded;
                currentSpeed = bytesDiff / timeDiff;
                lastLoaded = e.loaded;
                lastTime = now;
            }

            const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
            const remainingBytes = Math.max(0, e.total - e.loaded);
            const etaSeconds = currentSpeed > 0 ? Math.ceil(remainingBytes / currentSpeed) : null;

            updateProgressHUDStageUpload({
                percent: percent,
                loaded: e.loaded,
                total: e.total,
                speed: currentSpeed,
                etaSeconds: etaSeconds
            });

            if (button) {
                const speedMb = (currentSpeed / (1024 * 1024)).toFixed(1);
                button.innerHTML = `<svg class="animate-spin h-5 w-5 inline mr-2 text-white" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Enviando: ${percent}% (${speedMb} MB/s)`;
            }
        };

        xhr.upload.onload = () => {
            updateProgressHUDStageServer({ fileSize: fileSize });

            if (button) {
                button.innerHTML = `<svg class="animate-spin h-5 w-5 inline mr-2 text-white" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando no servidor...`;
            }

            serverSeconds = 0;
            serverTimerInterval = setInterval(() => {
                serverSeconds++;
                updateProgressHUDServerTimer(serverSeconds, fileSize);
                if (button) {
                    const mins = String(Math.floor(serverSeconds / 60)).padStart(2, '0');
                    const secs = String(serverSeconds % 60).padStart(2, '0');
                    button.innerHTML = `<svg class="animate-spin h-5 w-5 inline mr-2 text-white" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processando no servidor (${mins}:${secs})...`;
                }
            }, 1000);
        };

        xhr.onload = async () => {
            if (serverTimerInterval) clearInterval(serverTimerInterval);

            const ok = xhr.status >= 200 && xhr.status < 300;

            if (ok) {
                updateProgressHUDSuccess();
                setTimeout(() => hideProgressHUD(), 800);
            } else {
                hideProgressHUD();
            }

            if (button) {
                if (ok) {
                    button.innerHTML = 'Concluído!';
                } else {
                    button.innerHTML = originalButtonHtml;
                    button.disabled = false;
                }
            }

            const responseAdapter = {
                ok: ok,
                status: xhr.status,
                statusText: xhr.statusText,
                headers: {
                    get: (headerName) => xhr.getResponseHeader(headerName)
                },
                blob: async () => xhr.response,
                text: async () => {
                    if (xhr.response instanceof Blob) {
                        return await xhr.response.text();
                    }
                    return String(xhr.response || '');
                },
                json: async () => {
                    let text = '';
                    if (xhr.response instanceof Blob) {
                        text = await xhr.response.text();
                    } else {
                        text = String(xhr.response || '');
                    }
                    return JSON.parse(text);
                }
            };

            resolve(responseAdapter);
        };

        xhr.onerror = () => {
            if (serverTimerInterval) clearInterval(serverTimerInterval);
            hideProgressHUD();
            if (button) {
                button.innerHTML = originalButtonHtml;
                button.disabled = false;
            }
            resolve({
                ok: false,
                status: xhr.status || 0,
                statusText: 'Erro de rede',
                headers: { get: () => null },
                blob: async () => new Blob(),
                json: async () => ({ error: 'Erro de rede' }),
                text: async () => 'Erro de rede'
            });
        };

        xhr.ontimeout = () => {
            if (serverTimerInterval) clearInterval(serverTimerInterval);
            hideProgressHUD();
            if (button) {
                button.innerHTML = originalButtonHtml;
                button.disabled = false;
            }
            if (window.showToast) window.showToast('Tempo limite da requisição esgotado (timeout).', 'error');
            resolve({
                ok: false,
                status: 408,
                statusText: 'Timeout',
                headers: { get: () => null },
                blob: async () => new Blob(),
                json: async () => ({ error: 'Timeout' }),
                text: async () => 'Timeout'
            });
        };

        xhr.send(formData);
    });
};

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

    // Ordenação explícita: Converter, Organizar, Otimizar, depois outras
    const categoryOrder = ['converter', 'organizar', 'otimizar', 'seguranca', 'edicao'];
    const sortedCategories = Array.from(categories).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        return valA - valB;
    });

    sortedCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.onclick = () => filterTools(cat);
        btn.className = "filter-btn bg-white text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors";
        btn.innerText = labels[cat] || cat;
        btn.dataset.category = cat;
        container.appendChild(btn);
    });
}

function getBadgeHtml(tool) {
    if (!tool.badge || !tool.badge.type || !tool.badge.date) return '';

    try {
        const parts = tool.badge.date.split('-');
        if (parts.length !== 3) return '';

        const badgeDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const diffTime = now - badgeDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Expira automaticamente após 2 dias (48 horas)
        if (diffDays > 2 || diffDays < 0) return '';

        const type = tool.badge.type.toLowerCase();
        const isNovo = type === 'novo';
        const bgClass = isNovo ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white';
        const label = isNovo ? 'NOVO' : 'ATUALIZADO';

        return `
            <div class="absolute top-4 right-4 ${bgClass} text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm flex items-center gap-1.5 z-10 animate-fade-in">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block"></span>
                <span>${label}</span>
            </div>
        `;
    } catch (e) {
        return '';
    }
}

function renderTools(toolsToDisplay = tools) {
    const grid = document.getElementById('tools-grid');
    if (!grid) return;
    grid.innerHTML = '';

    toolsToDisplay.forEach(tool => {
        const card = document.createElement('div');
        card.className = "bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group relative";
        card.innerHTML = `
            ${getBadgeHtml(tool)}
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

    // Ajusta o grid para 4 colunas na visão de 'Todas' (para alta densidade) e 3 colunas para categorias menores
    const grid = document.getElementById('tools-grid');
    if (grid) {
        if (category === 'all') {
            grid.classList.remove('lg:grid-cols-3', 'max-w-6xl');
            grid.classList.add('lg:grid-cols-4', 'max-w-7xl');
        } else {
            grid.classList.remove('lg:grid-cols-4', 'max-w-7xl');
            grid.classList.add('lg:grid-cols-3', 'max-w-6xl');
        }
    }

    const relevant = tools.filter(t => t.main === currentMainCategory);
    const filtered = category === 'all' ? relevant : relevant.filter(t => t.category === category);
    renderTools(filtered);
}

// --- ROTEAMENTO DINÂMICO DE URLs (SPA) ---
function getToolUrl(tool) {
    if (!tool) return '/';
    if (tool.main === 'TIF') return `/tif/${tool.slug}`;
    if (tool.main === 'Imagens') return `/imagens/${tool.slug}`;
    if (tool.main === 'PDF') return `/pdf/${tool.slug}`;
    return `/${tool.slug}`;
}

function findToolByPath(pathname) {
    if (!pathname || pathname === '/' || pathname === '/index.html') return null;

    const cleanPath = pathname.replace(/\/+$/, '').toLowerCase();
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    // Caso 1: /tif/:slug
    if (parts[0] === 'tif' && parts[1]) {
        const slug = parts[1];
        return tools.find(t => t.main === 'TIF' && (t.slug === slug || t.slug === slug.replace(/-tif$/, '').replace(/-tiff$/, '')));
    }

    // Caso 2: /imagens/:slug
    if (parts[0] === 'imagens' && parts[1]) {
        const slug = parts[1];
        return tools.find(t => t.main === 'Imagens' && (t.slug === slug || t.slug === slug.replace(/-imagem$/, '')));
    }

    // Caso 3: /pdf/:slug
    if (parts[0] === 'pdf' && parts[1]) {
        const slug = parts[1];
        return tools.find(t => t.main === 'PDF' && (t.slug === slug || t.slug === slug.replace(/-pdf$/, '')));
    }

    // Caso 4: Slugs diretos na raiz (ex: /comprimir-pdf, /juntar-pdf, /recortar-tif, /remover-fundo)
    if (parts.length === 1) {
        const single = parts[0];
        if (single === 'tif' || single === 'imagens' || single === 'pdf') return null;

        let found = tools.find(t => t.slug === single);
        if (found) return found;

        const strippedPdf = single.replace(/-pdf$/, '').replace(/^pdf-para-/, 'pdf-');
        const strippedTif = single.replace(/-tif$/, '').replace(/-tiff$/, '');

        found = tools.find(t => (t.main === 'PDF' && t.slug === strippedPdf) ||
                                (t.main === 'TIF' && t.slug === strippedTif) ||
                                (t.main === 'Imagens' && t.slug === single));
        if (found) return found;
    }

    return null;
}

window.closeUploadArea = function(updateHistory = true) {
    currentTool = null;
    selectedFiles = [];

    const headerSection = document.getElementById('header-section');
    const uploadContainer = document.getElementById('upload-container');
    const mainElement = document.querySelector('main');
    const filters = document.querySelector('.flex.flex-wrap');

    if (uploadContainer) {
        uploadContainer.classList.add('hidden');
        uploadContainer.classList.replace('pb-6', 'pb-20');
        uploadContainer.innerHTML = '';
    }

    if (headerSection) {
        headerSection.classList.remove('hidden');
        headerSection.classList.remove('pt-6', 'pb-4');
        headerSection.classList.add('py-12');
    }

    if (mainElement) mainElement.classList.remove('hidden');
    if (filters) filters.classList.remove('hidden');

    const categoryBase = currentMainCategory === 'PDF' ? '/' : `/${currentMainCategory.toLowerCase()}`;
    document.title = `I Love Security | ${currentMainCategory}`;

    if (updateHistory && window.location.pathname !== categoryBase) {
        window.history.pushState({ main: currentMainCategory }, '', categoryBase);
    }

    renderSubFilters(currentMainCategory);
    filterTools('all');
};

// --- UPLOAD AREA ---
function openUploadArea(tool, updateHistory = true) {
    if (!tool) return;
    currentTool = tool;

    // Sincroniza abas e categoria caso a ferramenta seja de outra seção
    if (tool.main && tool.main !== currentMainCategory) {
        currentMainCategory = tool.main;
        document.querySelectorAll('.main-tab').forEach(tab => {
            tab.classList.remove('font-bold', 'text-red-600', 'border-red-600');
            tab.classList.add('font-medium', 'text-gray-500', 'border-transparent');
        });
        const activeTab = document.getElementById(`tab-${tool.main}`);
        if (activeTab) {
            activeTab.classList.remove('font-medium', 'text-gray-500', 'border-transparent');
            activeTab.classList.add('font-bold', 'text-red-600', 'border-red-600');
        }
    }

    // Atualiza a URL na barra de endereços sem recarregar a página
    const toolUrl = getToolUrl(tool);
    if (updateHistory && window.location.pathname !== toolUrl) {
        window.history.pushState({ toolSlug: tool.slug, main: tool.main }, '', toolUrl);
    }
    document.title = `${tool.title} | I Love Security`;

    const section = document.querySelector('section');
    if (section) section.classList.add('hidden');
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.classList.add('hidden');
    const flexWrap = document.querySelector('.flex.flex-wrap');
    if (flexWrap) flexWrap.classList.add('hidden');

    const container = document.getElementById('upload-container');
    if (!container) return;
    container.classList.remove('hidden');
    container.className = "container mx-auto px-4 pt-10 pb-20 max-w-4xl animate-fade-in";

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
    const titleActive = document.getElementById('tool-title-active');
    if (titleActive) titleActive.innerText = tool.title;

    const iconPlaceholder = document.getElementById('tool-icon-placeholder');
    if (iconPlaceholder) {
        iconPlaceholder.innerHTML = `
            <div class="w-20 h-20 ${tool.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 ${tool.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${tool.iconPath}"></path></svg>
            </div>
        `;
    }

    // --- Filtro de tipo de arquivo ---
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        if (tool.title === "PDF ↔ Imagem") {
            fileInput.setAttribute("accept", ".pdf,.jpg,.jpeg,.png,.webp");
        } else if (tool.title === "PDF ↔ Word") {
            fileInput.setAttribute("accept", ".pdf,.docx");
        } else if (tool.title === "Remover Fundo") {
            fileInput.setAttribute("accept", ".jpg,.jpeg,.png,.webp");
        } else if (tool.title === "Comprimir TIF" || tool.title === "Organizar TIF" || tool.title === "Recortar TIF" || tool.title === "Juntar TIF") {
            fileInput.setAttribute("accept", ".tif,.tiff,.png,.jpg,.jpeg");
        } else if (tool.title === "PDF ↔ TIFF") {
            fileInput.setAttribute("accept", ".pdf,.tif,.tiff");
        } else {
            fileInput.setAttribute("accept", ".pdf");
        }
    }

    setupUploadEvents();

    selectedFiles = [];
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.onclick = (e) => {
            e.preventDefault();
            window.closeUploadArea(true);
        };
    }
}
window.openUploadArea = openUploadArea;

window.resetCurrentTool = function () {
    if (currentTool) {
        openUploadArea(currentTool, false);
    } else {
        if (typeof window.closeUploadArea === 'function') window.closeUploadArea();
        else location.reload();
    }
};

function handleUrlRouting(updateHistory = false) {
    const matchedTool = findToolByPath(window.location.pathname);
    if (matchedTool) {
        openUploadArea(matchedTool, updateHistory);
    } else {
        window.closeUploadArea(updateHistory);
    }
}

window.initRouting = function() {
    handleUrlRouting(false);
};

window.addEventListener('popstate', () => {
    handleUrlRouting(false);
});

function setupUploadEvents() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (dropZone && fileInput) {
        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => handleFiles(e.target.files);

        ['dragenter', 'dragover'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
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
        } else if (toolTitle === "Comprimir TIF" || toolTitle === "Organizar TIF" || toolTitle === "Recortar TIF" || toolTitle === "Juntar TIF") {
            if (isTif || isImage) selectedFiles.push(file);
            else window.showToast(`Arquivo ${file.name} ignorado. Apenas TIF/TIFF ou Imagens.`, 'error');
        } else if (toolTitle === "PDF ↔ TIFF") {
            if (isPdf || isTif) selectedFiles.push(file);
            else window.showToast(`Arquivo ${file.name} ignorado. Apenas PDF ou TIF/TIFF.`, 'error');
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

    // --- MÓDULO RECORTAR TIF ---
    else if (toolTitle === "Recortar TIF" && selectedFiles.length > 0) {
        if (typeof setupCropTifVisualEditor === 'function') {
            setupCropTifVisualEditor(selectedFiles[0]);
        }
    }

    // --- NOVO MÓDULO REMOVER FUNDO ---
    else if (toolTitle === "Remover Fundo" && selectedFiles.length > 0) {
        if (typeof setupRemoveBgVisualEditor === 'function') {
            setupRemoveBgVisualEditor(selectedFiles[0]);
        }
    }

    // --- MÓDULO PDF ↔ TIFF ---
    else if (toolTitle === "PDF ↔ TIFF" && selectedFiles.length > 0) {
        if (typeof setupPdfTiffConverterVisualEditor === 'function') {
            setupPdfTiffConverterVisualEditor([...selectedFiles]);
        }
    }

    // --- MÓDULO COMPRIMIR PDF ---
    else if (toolTitle === "Comprimir PDF" && selectedFiles.length > 0) {
        if (typeof setupCompressVisualEditor === 'function') {
            setupCompressVisualEditor(selectedFiles[0], 'pdf');
        }
    }

    // --- MÓDULO JUNTAR TIF ---
    else if (toolTitle === "Juntar TIF" && selectedFiles.length > 0) {
        if (typeof setupMergeTifVisualEditor === 'function') {
            setupMergeTifVisualEditor([...selectedFiles]);
        }
    }

    // --- MÓDULO COMPRIMIR TIF ---
    else if (toolTitle === "Comprimir TIF" && selectedFiles.length > 0) {
        if (typeof setupCompressVisualEditor === 'function') {
            setupCompressVisualEditor(selectedFiles[0], 'tif');
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
        else if (toolTitle === "Juntar TIF") endpoint = "/api/juntar-tiffs";

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

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            let originalName = selectedFiles[0].name.replace(/\.[^/.]+$/, "");
            let defaultFilename = `Resultado_${timestamp}.zip`;

            if (toolTitle === "Juntar PDF") defaultFilename = `Junto_${timestamp}.pdf`;
            else if (toolTitle === "Dividir PDF") defaultFilename = `${originalName}_Dividido_${timestamp}.zip`;
            else if (toolTitle === "Comprimir PDF") defaultFilename = `${originalName}_Otimizado.pdf`;
            else if (toolTitle === "PDF para JPG") {
                // 1 PDF → backend retorna imagem direta se tiver 1 página, ZIP se múltiplas
                defaultFilename = selectedFiles.length === 1
                    ? `${originalName}.jpg`
                    : `Imagens_Convertidas_${timestamp}.zip`;
            }
            else if (toolTitle.includes("Word")) defaultFilename = `${originalName}.docx`;
            else if (toolTitle === "Remover Fundo") defaultFilename = `${originalName}_Sem_Fundo.png`;
            else if (toolTitle === "Converter Imagem") {
                // 1 imagem → arquivo direto, 2+ → ZIP
                defaultFilename = selectedFiles.length === 1
                    ? `${originalName}_Convertido.jpg`
                    : `Imagens_Convertidas_${timestamp}.zip`;
            }
            else if (toolTitle === "Comprimir TIF" && selectedFiles.length === 1) defaultFilename = `${originalName}_Comprimido.tif`;
            else if (toolTitle === "Juntar TIF") defaultFilename = `TIF_Juntado_${timestamp}.tif`;

            // INÍCIO DA MUDANÇA: Pede para salvar ANTES do fetch!
            const saveBlob = await window.getFileSaver(defaultFilename);
            if (!saveBlob) {
                // Usuário cancelou o Save As
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            const totalBytes = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
            const response = await window.fetchWithProgress(endpoint, {
                method: 'POST',
                body: formData,
                title: toolTitle,
                filename: selectedFiles[0]?.name || 'documento',
                fileSize: totalBytes,
                button: btn
            });

            if (response.ok) {
                const originalSize = response.headers.get('X-Original-Size');
                const finalSize = response.headers.get('X-Final-Size');
                const economy = response.headers.get('X-Economy-Percent');

                const blob = await response.blob();
                
                // Extrai nome real caso o servidor tenha enviado outro (ex: fallback)
                let finalName = defaultFilename;
                const contentDisposition = response.headers.get('Content-Disposition');
                if (contentDisposition && contentDisposition.includes('filename=')) {
                    const match = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (match && match[1]) {
                        finalName = match[1];
                    }
                }

                // Efetua a gravação do arquivo (o modal já foi aberto antes!)
                await saveBlob(blob, finalName);

                let msgSucesso = "Sucesso! Download concluído.";
                const origNum = originalSize ? parseFloat(originalSize) : (selectedFiles[0] ? selectedFiles[0].size : 0);
                const finNum = finalSize ? parseFloat(finalSize) : blob.size;

                if (toolTitle.includes("Comprimir") && origNum > 0 && finNum > 0) {
                    const diffPct = ((1 - (finNum / origNum)) * 100).toFixed(1);
                    if (finNum < origNum) {
                        msgSucesso = `📉 Compactado! De ${formatBytes(origNum)} para ${formatBytes(finNum)} (-${diffPct}%)`;
                    } else {
                        msgSucesso = `✨ Processado! De ${formatBytes(origNum)} para ${formatBytes(finNum)} (+${Math.abs(diffPct)}%)`;
                    }
                }

                window.showToast(msgSucesso, "success");
                btn.innerHTML = originalText;
                btn.disabled = false;
            } else {
                if (response.status === 413) {
                    window.showToast("Arquivo muito grande. O tamanho excede o limite permitido pelo servidor.", "error");
                } else {
                    window.showToast("Erro no servidor.", "error");
                }
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

// ==========================================
// MODO ESCURO (THEME SWITCHER)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    // Atualiza os ícones do botão dependendo do tema ativo
    function updateThemeIcons(isDark) {
        if (darkIcon && lightIcon) {
            if (isDark) {
                darkIcon.classList.add('hidden');
                lightIcon.classList.remove('hidden');
            } else {
                lightIcon.classList.add('hidden');
                darkIcon.classList.remove('hidden');
            }
        }
    }

    // Inicializa os ícones de acordo com a classe aplicada no HTML
    const isDarkModeActive = document.documentElement.classList.contains('dark');
    updateThemeIcons(isDarkModeActive);

    // Adiciona listener de clique para alternar o tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentDarkState = document.documentElement.classList.contains('dark');
            if (currentDarkState) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                updateThemeIcons(false);
                window.showToast("Modo Claro ativado.", "success");
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                updateThemeIcons(true);
                window.showToast("Modo Escuro ativado.", "success");
            }
        });
    }
});

// A inicialização agora é feita individualmente em cada página HTML
// (index.html, imagens.html, tif.html) para garantir a categoria correta.

// --- MOTOR CLIENT-SIDE TIFF (UTIF.js) ---
/**
 * Renderiza uma página de arquivo TIFF diretamente no navegador via Canvas.
 * Permite exibição instantânea de miniaturas e metadados sem consumir upload de rede.
 */
window.renderTifPageClientSide = async function (fileOrBuffer, pageIndex = 0, maxWidth = 300) {
    if (!window.UTIF) {
        throw new Error("Biblioteca UTIF.js não disponível.");
    }

    let buffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
        buffer = fileOrBuffer;
    } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
        buffer = await fileOrBuffer.arrayBuffer();
    } else {
        throw new Error("Entrada inválida para decodificação TIFF.");
    }

    const ifds = window.UTIF.decode(buffer);
    if (!ifds || ifds.length === 0) {
        throw new Error("Nenhum IFD válido encontrado no arquivo TIFF.");
    }

    const targetIdx = Math.min(Math.max(0, pageIndex), ifds.length - 1);
    const targetIfd = ifds[targetIdx];

    window.UTIF.decodeImage(buffer, targetIfd);

    const origW = targetIfd.width;
    const origH = targetIfd.height;
    if (!origW || !origH) {
        throw new Error("Dimensões inválidas no quadro TIFF.");
    }

    const rgba = window.UTIF.toRGBA8(targetIfd);

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = origW;
    rawCanvas.height = origH;
    const rawCtx = rawCanvas.getContext('2d');
    const imgData = rawCtx.createImageData(origW, origH);
    imgData.data.set(rgba);
    rawCtx.putImageData(imgData, 0, 0);

    let finalCanvas = rawCanvas;
    if (maxWidth && origW > maxWidth) {
        const ratio = maxWidth / origW;
        const targetW = maxWidth;
        const targetH = Math.max(1, Math.round(origH * ratio));

        finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetW;
        finalCanvas.height = targetH;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.drawImage(rawCanvas, 0, 0, targetW, targetH);
    }

    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.85);

    return {
        dataUrl,
        totalPages: ifds.length,
        width: origW,
        height: origH
    };
};
