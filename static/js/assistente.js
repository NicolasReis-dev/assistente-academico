document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const form = document.querySelector('.input-form');

    // Auto-resize textarea
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    // Auto-scroll to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    scrollToBottom();

    // Focus textarea on load
    textarea.focus();

    // Submit on Enter (Shift+Enter for new line)
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const userMessage = formData.get('mensagem').trim();

        if (!userMessage) {
            return;
        }

        // Remove welcome message if it exists
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        // Display user message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user';
        userMessageDiv.innerHTML = `
            <div class="message-label">
                <span class="message-icon">U</span>
                Você
            </div>
            <div class="message-content">${userMessage}</div>
        `;
        chatMessages.appendChild(userMessageDiv);
        scrollToBottom();

        // Clear input
        textarea.value = '';
        textarea.style.height = 'auto';

        // --- CORREÇÃO AQUI ---
        // Display assistant placeholder
        const assistantMessageDiv = document.createElement('div');
        assistantMessageDiv.className = 'message assistant';
        
        // Note que removi o id="assistantResponse" daqui para não duplicar
        assistantMessageDiv.innerHTML = `
            <div class="message-label">
                <span class="message-icon">A</span>
                UN!A
            </div>
            <div class="message-content"></div>
        `;
        chatMessages.appendChild(assistantMessageDiv);
        scrollToBottom();

        // EM VEZ DE BUSCAR PELO ID, BUSCAMOS DENTRO DA DIV NOVA
        // Isso garante que estamos mexendo apenas na resposta ATUAL
        const assistantResponse = assistantMessageDiv.querySelector('.message-content');

        // Connect to stream
        const eventSource = new EventSource(`/stream?mensagem=${encodeURIComponent(userMessage)}`);
        let fullResponse = '';

        eventSource.onmessage = function(event) {
            const chunk = event.data;
            fullResponse += chunk;
            assistantResponse.innerHTML = fullResponse;
            scrollToBottom();
        };

        // --- SUA CORREÇÃO DO ERRO ESTÁ AQUI ---
        eventSource.onerror = function(err) {
            console.error('EventSource failed:', err);
            
            // Lógica perfeita: só reclama se não tiver escrito nada ainda
            if (assistantResponse.innerHTML.trim() === "") {
                assistantResponse.innerHTML += '<br>Erro ao carregar a resposta.';
            }
            
            eventSource.close();
            scrollToBottom();
        };
    });
});