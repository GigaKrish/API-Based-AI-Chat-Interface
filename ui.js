document.addEventListener('DOMContentLoaded', () => {
    // No API key logic is needed here anymore.
    new ChatApp(); 
});

class ChatApp {
    constructor() { 
        // Use the new, more generic class name from api.js
        this.aiApi = new AiApi(); 
        this.initializeDOMElements();
        this.initializeEventListeners();
        this.initTheme();
    }
    
    initializeDOMElements() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.removeImageBtn = document.getElementById('removeImageBtn');
        this.themeToggle = document.getElementById('theme-toggle');
    }

    initializeEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.imageBtn.addEventListener('click', () => this.imageInput.click());
        this.removeImageBtn.addEventListener('click', () => this.clearImagePreview());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.updateSendButtonState();
            this.autoResizeInput();
        });

        this.imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.handleImageUpload(e.target.files[0]);
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark', savedTheme === 'dark');
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    updateSendButtonState() {
        const hasMessage = this.messageInput.value.trim().length > 0;
        const hasImage = this.previewImg.src.startsWith('data:image');
        this.sendBtn.disabled = !hasMessage && !hasImage;
    }

    autoResizeInput() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = `${this.messageInput.scrollHeight}px`;
    }

    handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.imagePreview.classList.add('show');
            this.updateSendButtonState();
        };
        reader.readAsDataURL(file);
    }

    clearImagePreview() {
        this.imagePreview.classList.remove('show');
        this.previewImg.src = '';
        this.imageInput.value = '';
        this.updateSendButtonState();
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        const imageSrc = this.previewImg.src;

        if (!message && !imageSrc.startsWith('data:image')) return;

        const finalImageSrc = imageSrc.startsWith('data:image') ? imageSrc : null;
        
        let imageData = null;
        if (finalImageSrc) {
            imageData = {
                mime_type: finalImageSrc.match(/data:(.*);/)[1],
                data: finalImageSrc.split(',')[1]
            };
        }

        this.addMessage(message, 'user', finalImageSrc);
        this.messageInput.value = '';
        this.autoResizeInput();
        this.clearImagePreview();

        const typingIndicator = this.showTypingIndicator();

        try {
            const responseText = await this.aiApi.generateResponse(message, imageData);
            this.addMessage(responseText, 'ai');
        } catch (error) {
            this.addMessage(`An error occurred: ${error.message}. Please check the console for more details.`, 'ai');
        } finally {
            this.removeTypingIndicator(typingIndicator);
        }
    }

    addMessage(text, sender, imageSrc = null) {
        const messageWrapper = this.createMessageWrapper(sender);
        const avatar = this.createAvatar(sender);
        const messageBubble = this.createMessageBubble(sender, text, imageSrc);

        if (sender === 'user') {
            messageWrapper.appendChild(messageBubble);
            messageWrapper.appendChild(avatar);
        } else {
            messageWrapper.appendChild(avatar);
            messageWrapper.appendChild(messageBubble);
        }

        this.chatContainer.appendChild(messageWrapper);
        this.scrollToBottom();
    }
    
    createMessageWrapper(sender) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        return wrapper;
    }

    createAvatar(sender) {
        const avatar = document.createElement('div');
        avatar.className = `avatar ${sender}`;
        avatar.textContent = sender === 'user' ? 'You' : 'AI';
        return avatar;
    }

    createMessageBubble(sender, text, imageSrc) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${sender}`;

        if (imageSrc && sender === 'user') {
            const img = document.createElement('img');
            img.src = imageSrc;
            img.className = 'message-image';
            bubble.appendChild(img);
        }

        if (text) {
             if (sender === 'ai') {
                bubble.innerHTML += marked.parse(text);
                this.highlightCode(bubble);
            } else {
                const p = document.createElement('p');
                p.textContent = text;
                bubble.appendChild(p);
            }
        }
        return bubble;
    }
    
    highlightCode(element) {
        element.querySelectorAll('pre code').forEach(block => {
            Prism.highlightElement(block);
            const pre = block.parentElement;
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(block.textContent);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
            };
            pre.appendChild(copyBtn);
        });
    }

    showTypingIndicator() {
        const wrapper = this.createMessageWrapper('ai');
        const avatar = this.createAvatar('ai');
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble ai';
        bubble.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
        
        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        this.chatContainer.appendChild(wrapper);
        this.scrollToBottom();
        return wrapper;
    }

    removeTypingIndicator(element) {
        if (element) {
            element.remove();
        }
    }

    scrollToBottom() {
        this.chatContainer.scrollTo({
            top: this.chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
}
