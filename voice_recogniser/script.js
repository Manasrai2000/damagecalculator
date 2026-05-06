/**
 * VoiceFlow - Professional Voice-to-Text Application
 * Author: Antigravity AI
 */

class VoiceFlow {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.history = JSON.parse(localStorage.getItem('vf_history') || '[]');

        // DOM Elements
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearBtn: document.getElementById('clearBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            exportBtn: document.getElementById('exportBtn'),
            transcriptionArea: document.getElementById('transcriptionArea'),
            charCount: document.getElementById('charCount'),
            wordCount: document.getElementById('wordCount'),
            languageSelect: document.getElementById('languageSelect'),
            timestampToggle: document.getElementById('timestampToggle'),
            statusIndicator: document.getElementById('statusIndicator'),
            historyList: document.getElementById('historyList'),
            themeToggle: document.getElementById('themeToggle')
        };

        this.init();
    }

    init() {
        this.setupRecognition();
        this.attachEventListeners();
        this.renderHistory();
        this.setupTheme();
    }

    setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.showToast('Speech Recognition not supported in this browser.', 'error');
            this.elements.startBtn.disabled = true;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUIStatus();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    let finalPart = event.results[i][0].transcript;
                    if (this.elements.timestampToggle.checked) {
                        const now = new Date();
                        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        finalPart = `\n[${time}] ${finalPart}`;
                    }
                    this.transcript += finalPart + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            this.updateTranscription(interimTranscript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showToast(`Error: ${event.error}`, 'error');
            this.stopListening();
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                // Keep listening if we didn't explicitly stop (handles silent pauses)
                this.recognition.start();
            } else {
                this.updateUIStatus();
            }
        };
    }

    attachEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startListening());
        this.elements.stopBtn.addEventListener('click', () => this.stopListening());
        this.elements.clearBtn.addEventListener('click', () => this.clearText());
        this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadAsTxt());
        this.elements.exportBtn.addEventListener('click', () => this.saveToHistory());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Handle manual edits
        this.elements.transcriptionArea.addEventListener('input', () => {
            this.transcript = this.elements.transcriptionArea.innerText;
            this.updateStats();
        });

        // Language change
        this.elements.languageSelect.addEventListener('change', () => {
            if (this.isListening) {
                this.stopListening();
                setTimeout(() => this.startListening(), 300);
            }
        });
    }

    startListening() {
        if (!this.recognition) return;

        this.recognition.lang = this.elements.languageSelect.value;
        try {
            this.recognition.start();
            this.showToast('Listening...', 'success');
        } catch (e) {
            console.error(e);
        }
    }

    stopListening() {
        if (!this.recognition) return;
        this.isListening = false;
        this.recognition.stop();
        this.showToast('Stopped listening.', 'info');
    }

    updateUIStatus() {
        if (this.isListening) {
            this.elements.startBtn.classList.add('hidden');
            this.elements.stopBtn.classList.remove('hidden');
            this.elements.statusIndicator.classList.add('listening');
            this.elements.statusIndicator.querySelector('.status-text').innerText = 'Listening...';
        } else {
            this.elements.startBtn.classList.remove('hidden');
            this.elements.stopBtn.classList.add('hidden');
            this.elements.statusIndicator.classList.remove('listening');
            this.elements.statusIndicator.querySelector('.status-text').innerText = 'Ready';
        }
    }

    updateTranscription(interimText) {
        // We use innerText to preserve line breaks if timestamps are on
        const finalHTML = this.transcript;
        const interimHTML = `<span style="color: var(--text-secondary); opacity: 0.7;">${interimText}</span>`;

        this.elements.transcriptionArea.innerHTML = finalHTML + interimHTML;
        this.autoScroll();
        this.updateStats();
    }

    updateStats() {
        const text = this.elements.transcriptionArea.innerText.trim();
        const chars = text.length;
        const words = text === '' ? 0 : text.split(/\s+/).length;

        this.elements.charCount.innerText = `${chars} characters`;
        this.elements.wordCount.innerText = `${words} words`;
    }

    autoScroll() {
        this.elements.transcriptionArea.scrollTop = this.elements.transcriptionArea.scrollHeight;
    }

    clearText() {
        if (confirm('Are you sure you want to clear all text?')) {
            this.transcript = '';
            this.elements.transcriptionArea.innerHTML = '';
            this.updateStats();
            this.showToast('Text cleared.', 'info');
        }
    }

    copyToClipboard() {
        const text = this.elements.transcriptionArea.innerText;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!', 'success');
        });
    }

    downloadAsTxt() {
        const text = this.elements.transcriptionArea.innerText;
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcription-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('Download started.', 'success');
    }

    saveToHistory() {
        const text = this.elements.transcriptionArea.innerText.trim();
        if (!text) {
            this.showToast('Nothing to save.', 'info');
            return;
        }

        const item = {
            id: Date.now(),
            text: text,
            date: new Date().toLocaleString(),
            preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        };

        this.history.unshift(item);
        if (this.history.length > 10) this.history.pop(); // Keep last 10

        localStorage.setItem('vf_history', JSON.stringify(this.history));
        this.renderHistory();
        this.showToast('Saved to history.', 'success');
    }

    renderHistory() {
        const list = this.elements.historyList;
        list.innerHTML = '';

        if (this.history.length === 0) {
            list.innerHTML = '<li class="empty-history">No history yet</li>';
            return;
        }

        this.history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span class="date">${item.date}</span>
                <p class="preview">${item.preview}</p>
            `;
            li.onclick = () => {
                if (this.transcript && confirm('Overwrite current text with this history item?')) {
                    this.transcript = item.text;
                    this.elements.transcriptionArea.innerText = item.text;
                    this.updateStats();
                } else if (!this.transcript) {
                    this.transcript = item.text;
                    this.elements.transcriptionArea.innerText = item.text;
                    this.updateStats();
                }
            };
            list.appendChild(li);
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('vf_theme') || 'light';
        document.body.className = savedTheme + '-theme';
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const isDark = document.body.classList.contains('dark-theme');
        const newTheme = isDark ? 'light' : 'dark';
        document.body.className = newTheme + '-theme';
        localStorage.setItem('vf_theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.elements.themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.setAttribute('data-lucide', 'sun');
        } else {
            icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-circle';

        toast.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Instantiate the app
document.addEventListener('DOMContentLoaded', () => {
    window.voiceFlow = new VoiceFlow();
});
