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

        // Display assistant placeholder
        const assistantMessageDiv = document.createElement('div');
        assistantMessageDiv.className = 'message assistant';
        assistantMessageDiv.innerHTML = `
            <div class="message-label">
                <span class="message-icon">A</span>
                UN!A
            </div>
            <div class="message-content" id="assistantResponse"></div>
        `;
        chatMessages.appendChild(assistantMessageDiv);
        scrollToBottom();

        const assistantResponse = document.getElementById('assistantResponse');

        // Connect to stream
        const eventSource = new EventSource(`/stream?mensagem=${encodeURIComponent(userMessage)}`);
        let fullResponse = '';

        eventSource.onmessage = function(event) {
            const chunk = event.data;
            fullResponse += chunk;
            assistantResponse.innerHTML = fullResponse;
            scrollToBottom();
        };

        eventSource.onerror = function(err) {
            console.error('EventSource failed:', err);
            assistantResponse.innerHTML += '<br>Erro ao carregar a resposta.';
            eventSource.close();
            scrollToBottom();
        };
    });
});
