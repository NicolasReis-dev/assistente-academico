// Auto-resize textarea
const textarea = document.getElementById('messageInput');
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

// Auto-scroll to bottom
const chatMessages = document.getElementById('chatMessages');
chatMessages.scrollTop = chatMessages.scrollHeight;

// Focus textarea on load
textarea.focus();

// Submit on Enter (Shift+Enter for new line)
textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.form.submit();
    }
});