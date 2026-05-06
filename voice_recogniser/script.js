/**
 * VoiceFlow - Professional Voice-to-Text Application
 * Author: Antigravity AI
 * Mobile Stability Enhanced Version
 */

class VoiceFlow {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isStarting = false; // Prevents double-start errors
        this.manualStop = false;  // Tracks if the user explicitly clicked stop
        this.transcript = '';
        this.history = JSON.parse(localStorage.getItem('vf_history') || '[]');
        
        // Mobile detection
        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
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
        
        if (this.isMobile) {
            console.log('Mobile device detected. Applying stability tweaks.');
        }
    }

    setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.showToast('Speech Recognition not supported in this browser.', 'error');
            this.elements.startBtn.disabled = true;
            return;
        }

        this.recognition = new SpeechRecognition();
        
        // Mobile Chrome often works better with continuous set to true but manually handled restarts
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.isStarting = false;
            this.updateUIStatus();
            console.log('Recognition started');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                if (result.isFinal) {
                    let finalPart = result[0].transcript;
                    if (this.elements.timestampToggle.checked) {
                        const now = new Date();
                        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        finalPart = `\n[${time}] ${finalPart}`;
                    }
                    this.transcript += finalPart + ' ';
                } else {
                    interimTranscript += result[0].transcript;
                }
            }
            this.updateTranscription(interimTranscript);
        };

        this.recognition.onerror = (event) => {
            this.isStarting = false;
            console.error('Speech recognition error:', event.error);
            
            switch (event.error) {
                case 'not-allowed':
                    this.showToast('Microphone access denied.', 'error');
                    this.stopListening(true);
                    break;
                case 'no-speech':
                    // Silent pauses are common on mobile, just log it
                    console.warn('No speech detected.');
                    break;
                case 'network':
                    this.showToast('Network error.', 'error');
                    break;
                default:
                    console.warn('Recognition error:', event.error);
            }
        };

        this.recognition.onend = () => {
            console.log('Recognition ended. Manual Stop:', this.manualStop);
            
            // Auto-restart logic for continuous listening, especially on mobile
            if (!this.manualStop && this.isListening) {
                this.restartRecognition();
            } else {
                this.isListening = false;
                this.isStarting = false;
                this.updateUIStatus();
            }
        };
    }

    restartRecognition() {
        if (this.isStarting || this.manualStop) return;
        
        this.isStarting = true;
        const statusText = this.elements.statusIndicator.querySelector('.status-text');
        if (statusText) statusText.innerText = 'Reconnecting...';
        
        // Small delay to prevent rapid-fire restarts
        setTimeout(() => {
            if (!this.manualStop && this.isListening) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.error('Restart failed:', e);
                    this.isStarting = false;
                }
            }
        }, 300);
    }

    startListening() {
        if (!this.recognition || this.isStarting || this.isListening) return;
        
        this.manualStop = false;
        this.isStarting = true;
        this.recognition.lang = this.elements.languageSelect.value;
        
        try {
            this.recognition.start();
            this.showToast('Listening...', 'success');
        } catch (e) {
            console.error('Start failed:', e);
            this.isStarting = false;
            this.showToast('Failed to start recognition.', 'error');
        }
    }

    stopListening(force = false) {
        if (!this.recognition) return;
        
        this.manualStop = true;
        this.isListening = false;
        this.isStarting = false;
        
        try {
            if (force) {
                this.recognition.abort();
            } else {
                this.recognition.stop();
            }
        } catch (e) {
            console.error('Stop error:', e);
        }
        
        this.updateUIStatus();
        this.showToast('Stopped listening.', 'info');
    }

    attachEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startListening());
        this.elements.stopBtn.addEventListener('click', () => this.stopListening());
        this.elements.clearBtn.addEventListener('click', () => this.clearText());
        this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadAsTxt());
        this.elements.exportBtn.addEventListener('click', () => this.saveToHistory());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        this.elements.transcriptionArea.addEventListener('input', () => {
            this.transcript = this.elements.transcriptionArea.innerText;
            this.updateStats();
        });

        this.elements.languageSelect.addEventListener('change', () => {
            if (this.isListening) {
                this.stopListening();
                setTimeout(() => this.startListening(), 400);
            }
        });
    }

    updateUIStatus() {
        const isListening = this.isListening || this.isStarting;
        
        if (isListening) {
            this.elements.startBtn.classList.add('hidden');
            this.elements.stopBtn.classList.remove('hidden');
            this.elements.statusIndicator.classList.add('listening');
            
            const statusText = this.elements.statusIndicator.querySelector('.status-text');
            if (statusText) {
                statusText.innerText = this.isStarting ? 'Connecting...' : 'Listening...';
            }
        } else {
            this.elements.startBtn.classList.remove('hidden');
            this.elements.stopBtn.classList.add('hidden');
            this.elements.statusIndicator.classList.remove('listening');
            
            const statusText = this.elements.statusIndicator.querySelector('.status-text');
            if (statusText) statusText.innerText = 'Ready';
        }
    }

    updateTranscription(interimText) {
        const finalHTML = this.transcript;
        const interimHTML = `<span class="interim-text">${interimText}</span>`;
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
        if (confirm('Clear all text?')) {
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
            this.showToast('Copied!', 'success');
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
        this.showToast('Downloaded.', 'success');
    }

    saveToHistory() {
        const text = this.elements.transcriptionArea.innerText.trim();
        if (!text) return;
        const item = {
            id: Date.now(),
            text: text,
            date: new Date().toLocaleString(),
            preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        };
        this.history.unshift(item);
        if (this.history.length > 10) this.history.pop();
        localStorage.setItem('vf_history', JSON.stringify(this.history));
        this.renderHistory();
        this.showToast('Saved.', 'success');
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
            li.innerHTML = `<span class="date">${item.date}</span><p class="preview">${item.preview}</p>`;
            li.onclick = () => {
                if (confirm('Load this transcription?')) {
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
        toast.innerHTML = `<i data-lucide="${iconName}"></i><span>${message}</span>`;
        container.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.voiceFlow = new VoiceFlow();
});

