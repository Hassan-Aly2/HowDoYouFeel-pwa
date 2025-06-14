// Daily Reflection Journal PWA
class DailyReflectionApp {
    constructor() {
        this.currentDate = new Date();
        this.reflectionPrompts = [
            "What made you feel most alive today?",
            "What challenge did you overcome today, and how did it make you stronger?",
            "What are you most proud of from today?",
            "How did you show kindness to yourself or others today?",
            "What did you learn about yourself today?",
            "What moment today would you like to relive?",
            "How did you step outside your comfort zone today?",
            "What are you looking forward to tomorrow?",
            "What pattern in your thoughts or behavior did you notice today?",
            "How did you contribute to making someone else's day better?",
            "What are you curious about right now?",
            "What would you tell your past self about today?",
            "What small victory can you celebrate from today?",
            "How did you practice gratitude today?",
            "What would make tomorrow even better than today?"
        ];
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.registerServiceWorker();
        this.setupEventListeners();
        this.loadTodaysEntry();
        this.updateDateDisplay();
        this.checkInstallPrompt();
    }

    initializeElements() {
        // Date elements
        this.dateElement = document.getElementById('currentDate');
        this.prevDayBtn = document.getElementById('prevDay');
        this.nextDayBtn = document.getElementById('nextDay');
        
        // Entry elements
        this.moodBtns = document.querySelectorAll('.mood-btn');
        this.promptElement = document.getElementById('todayPrompt');
        this.reflectionText = document.getElementById('reflectionText');
        this.gratitudeInputs = [
            document.getElementById('gratitude1'),
            document.getElementById('gratitude2'),
            document.getElementById('gratitude3')
        ];
        this.saveBtn = document.getElementById('saveEntry');
        
        // History elements
        this.toggleHistoryBtn = document.getElementById('toggleHistory');
        this.historyContainer = document.getElementById('historyContainer');
        this.entriesList = document.getElementById('entriesList');
        
        // Other elements
        this.installBtn = document.getElementById('installBtn');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
    }

    setupEventListeners() {
        // Date navigation
        this.prevDayBtn.addEventListener('click', () => this.navigateDate(-1));
        this.nextDayBtn.addEventListener('click', () => this.navigateDate(1));
        
        // Mood selection
        this.moodBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectMood(btn));
        });
        
        // Auto-save on input
        this.reflectionText.addEventListener('input', () => this.autoSave());
        this.gratitudeInputs.forEach(input => {
            input.addEventListener('input', () => this.autoSave());
        });
        
        // Manual save
        this.saveBtn.addEventListener('click', () => this.saveEntry());
        
        // History toggle
        this.toggleHistoryBtn.addEventListener('click', () => this.toggleHistory());
        
        // Install app
        this.installBtn.addEventListener('click', () => this.installApp());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.saveEntry();
                }
            }
        });
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    navigateDate(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + direction);
        
        // Don't allow future dates
        if (newDate > new Date()) {
            return;
        }
        
        this.currentDate = newDate;
        this.updateDateDisplay();
        this.loadTodaysEntry();
    }

    updateDateDisplay() {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        this.dateElement.textContent = this.currentDate.toLocaleDateString(undefined, options);
        
        // Update navigation buttons
        const today = new Date();
        const isToday = this.currentDate.toDateString() === today.toDateString();
        this.nextDayBtn.disabled = isToday;
        
        // Update prompt
        this.updatePrompt();
    }

    updatePrompt() {
        const dayOfYear = Math.floor((this.currentDate - new Date(this.currentDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const promptIndex = dayOfYear % this.reflectionPrompts.length;
        this.promptElement.textContent = this.reflectionPrompts[promptIndex];
    }

    selectMood(selectedBtn) {
        // Remove previous selection
        this.moodBtns.forEach(btn => btn.classList.remove('selected'));
        
        // Add selection to clicked button
        selectedBtn.classList.add('selected');
        
        // Auto-save
        this.autoSave();
    }

    getSelectedMood() {
        const selectedBtn = document.querySelector('.mood-btn.selected');
        return selectedBtn ? selectedBtn.dataset.mood : null;
    }

    getMoodEmoji(mood) {
        const moodEmojis = {
            amazing: '🤩',
            happy: '😊',
            neutral: '😐',
            sad: '😢',
            stressed: '😰'
        };
        return moodEmojis[mood] || '😐';
    }

    loadTodaysEntry() {
        const dateKey = this.formatDateKey(this.currentDate);
        const entries = this.getStoredEntries();
        const entry = entries[dateKey];
        
        if (entry) {
            // Load mood
            this.moodBtns.forEach(btn => btn.classList.remove('selected'));
            if (entry.mood) {
                const moodBtn = document.querySelector(`[data-mood="${entry.mood}"]`);
                if (moodBtn) moodBtn.classList.add('selected');
            }
            
            // Load reflection
            this.reflectionText.value = entry.reflection || '';
            
            // Load gratitude
            this.gratitudeInputs.forEach((input, index) => {
                input.value = entry.gratitude[index] || '';
            });
        } else {
            // Clear form for new entry
            this.moodBtns.forEach(btn => btn.classList.remove('selected'));
            this.reflectionText.value = '';
            this.gratitudeInputs.forEach(input => input.value = '');
        }
    }

    autoSave() {
        // Auto-save every 30 seconds of inactivity
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveEntry(true);
        }, 30000);
    }

    saveEntry(isAutoSave = false) {
        const dateKey = this.formatDateKey(this.currentDate);
        const entries = this.getStoredEntries();
        
        const entry = {
            date: this.currentDate.toISOString(),
            mood: this.getSelectedMood(),
            reflection: this.reflectionText.value.trim(),
            gratitude: this.gratitudeInputs.map(input => input.value.trim()).filter(Boolean),
            lastModified: new Date().toISOString()
        };
        
        entries[dateKey] = entry;
        localStorage.setItem('dailyReflectionEntries', JSON.stringify(entries));
        
        if (!isAutoSave) {
            this.showNotification('Entry saved successfully! 💫');
        }
        
        // Update history if visible
        if (!this.historyContainer.classList.contains('hidden')) {
            this.loadHistory();
        }
    }

    getStoredEntries() {
        const stored = localStorage.getItem('dailyReflectionEntries');
        return stored ? JSON.parse(stored) : {};
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    toggleHistory() {
        const isHidden = this.historyContainer.classList.contains('hidden');
        
        if (isHidden) {
            this.historyContainer.classList.remove('hidden');
            this.toggleHistoryBtn.textContent = 'Hide Past Entries';
            this.loadHistory();
        } else {
            this.historyContainer.classList.add('hidden');
            this.toggleHistoryBtn.textContent = 'View Past Entries';
        }
    }

    loadHistory() {
        const entries = this.getStoredEntries();
        const sortedEntries = Object.entries(entries)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .slice(0, 10); // Show last 10 entries
        
        if (sortedEntries.length === 0) {
            this.entriesList.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No entries yet. Start your reflection journey today! ✨</p>';
            return;
        }
        
        this.entriesList.innerHTML = sortedEntries.map(([dateKey, entry]) => {
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            const moodEmoji = this.getMoodEmoji(entry.mood);
            const truncatedReflection = entry.reflection.length > 150 
                ? entry.reflection.substring(0, 150) + '...' 
                : entry.reflection;
            
            return `
                <div class="entry-item">
                    <div class="entry-header">
                        <span class="entry-date">${formattedDate}</span>
                        <span class="entry-mood">${moodEmoji}</span>
                    </div>
                    ${entry.reflection ? `<div class="entry-reflection">${truncatedReflection}</div>` : ''}
                    ${entry.gratitude.length > 0 ? `
                        <div class="entry-gratitude">
                            <strong>Grateful for:</strong>
                            <ul>
                                ${entry.gratitude.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    showNotification(message) {
        this.notificationText.textContent = message;
        this.notification.classList.remove('hidden');
        
        setTimeout(() => {
            this.notification.classList.add('hidden');
        }, 3000);
    }

    checkInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.installBtn.classList.remove('hidden');
        });
        
        this.installPrompt = deferredPrompt;
    }

    async installApp() {
        if (this.installPrompt) {
            this.installPrompt.prompt();
            const { outcome } = await this.installPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showNotification('App installed successfully! 🎉');
            }
            
            this.installPrompt = null;
            this.installBtn.classList.add('hidden');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DailyReflectionApp();
});

// Handle app installation
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
});