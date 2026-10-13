// visual/js/modules/feedback_ui.js

/**
 * Módulo de Caixa de Feedback com design Glassmorphism.
 * Injeta o botão flutuante e o modal dinamicamente na página.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Injetar Botão Flutuante
    const fbButton = document.createElement('button');
    fbButton.id = "feedback-floating-btn";
    fbButton.className = "fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 hover:scale-110 transition-all duration-300 z-40 flex items-center justify-center animate-bounce-slow";
    fbButton.title = "Enviar Feedback";
    fbButton.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
    `;
    
    // Animação customizada
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 3s infinite;
        }
        #feedback-modal-bg {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(fbButton);

    // 2. Injetar Modal
    const modalBg = document.createElement('div');
    modalBg.id = "feedback-modal-bg";
    modalBg.className = "fixed inset-0 bg-gray-900 bg-opacity-40 z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300";
    
    modalBg.innerHTML = `
        <div id="feedback-modal-content" class="bg-white/95 backdrop-blur-md border border-white/50 w-full max-w-lg rounded-2xl shadow-2xl p-8 transform scale-95 transition-transform duration-300 relative mx-4">
            
            <button id="close-feedback-btn" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Enviar Feedback</h2>
            </div>

            <p class="text-sm text-gray-600 mb-6">Encontrou algum erro, tem uma sugestão incrível ou apenas quer nos mandar um elogio? Nos conte abaixo!</p>

            <form id="feedback-form" class="space-y-5">
                
                <!-- Tipo -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Tipo de Feedback <span class="text-red-500">*</span></label>
                    <select id="fb-tipo" class="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all cursor-pointer" required>
                        <option value="sugestao" selected>Sugestão de Melhoria</option>
                        <option value="bug">Relatar um Erro (Bug)</option>
                        <option value="elogio">Elogio</option>
                        <option value="outro">Outro assunto</option>
                    </select>
                </div>

                <!-- Mensagem -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Sua Mensagem <span class="text-red-500">*</span></label>
                    <textarea id="fb-mensagem" rows="4" minlength="10" maxlength="1000" placeholder="Escreva aqui (mínimo de 10 caracteres)..." class="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none" required></textarea>
                </div>

                <!-- Opcionais (Nome e Email em grid) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">Seu Nome (opcional)</label>
                        <input type="text" id="fb-nome" placeholder="Como devemos chamá-lo" class="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">Seu E-mail (opcional)</label>
                        <input type="email" id="fb-email" placeholder="Para possível retorno" class="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
                    </div>
                </div>

                <!-- Botões -->
                <div class="pt-4 flex gap-3 justify-end border-t border-gray-100">
                    <button type="button" id="btn-cancel-fb" class="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button type="submit" id="btn-submit-fb" class="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 hover:-translate-y-0.5 transform transition-all flex items-center">
                        <span id="fb-btn-text">Enviar Feedback</span>
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modalBg);

    // 3. Lógica de Abertura/Fechamento
    const modalContent = document.getElementById('feedback-modal-content');
    
    function openModal() {
        modalBg.classList.remove('hidden');
        // Usar requestAnimationFrame para garantir que o CSS aplique a transição
        requestAnimationFrame(() => {
            modalBg.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
        });
        // Foco automático (One-Hand Workflow)
        setTimeout(() => document.getElementById('fb-mensagem').focus(), 300);
    }

    function closeModal() {
        modalBg.classList.add('opacity-0');
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
        setTimeout(() => modalBg.classList.add('hidden'), 300);
    }

    fbButton.addEventListener('click', openModal);
    document.getElementById('close-feedback-btn').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-fb').addEventListener('click', closeModal);
    
    // Fechar ao clicar fora
    modalBg.addEventListener('click', (e) => {
        if (e.target === modalBg) closeModal();
    });

    // 4. Lógica de Envio (Submit)
    document.getElementById('feedback-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('btn-submit-fb');
        const textSpan = document.getElementById('fb-btn-text');
        
        // Coletar dados
        const tipo = document.getElementById('fb-tipo').value;
        const mensagem = document.getElementById('fb-mensagem').value.trim();
        const nome = document.getElementById('fb-nome').value.trim();
        const email = document.getElementById('fb-email').value.trim();

        // Validação JS
        if (mensagem.length < 10) {
            if (window.showToast) window.showToast("A mensagem precisa ter pelo menos 10 caracteres.", "error");
            return;
        }

        // Payload
        const payload = {
            tipo: tipo,
            mensagem: mensagem
        };
        if (nome) payload.nome = nome;
        if (email) payload.email = email;

        // Animação de envio
        btn.disabled = true;
        textSpan.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Enviando...`;

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                if (window.showToast) window.showToast("Feedback enviado com sucesso! Muito obrigado.", "success");
                
                // Limpar form
                document.getElementById('feedback-form').reset();
                closeModal();
            } else {
                const err = await response.json();
                console.error(err);
                if (window.showToast) window.showToast("Não foi possível enviar o feedback. Verifique os dados.", "error");
            }
        } catch (error) {
            console.error("Erro ao enviar feedback:", error);
            if (window.showToast) window.showToast("Falha de conexão. Tente novamente mais tarde.", "error");
        } finally {
            btn.disabled = false;
            textSpan.innerText = "Enviar Feedback";
        }
    });
});
