/**
 * Main Application Controller
 * Integrates playlist and video player modules with UI.
 * Features: Lightbox playback, shuffle, loop, theme toggle,
 * file import, and modern UI interactions.
 */

import Playlist from './playlist.js';
import VideoPlayer from './video-player.js';

class App {
    constructor() {
        // Initialize modules
        this.playlist = new Playlist();
        this.videoPlayer = null;
        this.isPlaying = false;

        // DOM elements
        this.elements = {
            videoContainer: document.getElementById('videoContainer'),
            playButtonWrapper: document.getElementById('playButtonWrapper'),
            playButtonCircle: document.getElementById('playButtonCircle'),
            playButtonText: document.getElementById('playButtonText'),
            videoInfo: document.getElementById('videoInfo'),
            platformBadge: document.getElementById('platformBadge'),
            videoTitle: document.getElementById('videoTitle'),
            videoUrlInput: document.getElementById('videoUrlInput'),
            addButton: document.getElementById('addButton'),
            clearButton: document.getElementById('clearButton'),
            playlistElement: document.getElementById('playlist'),
            playlistCount: document.getElementById('playlistCount'),
            loopToggle: document.getElementById('loopToggle'),
            shuffleToggle: document.getElementById('shuffleToggle'),
            themeToggle: document.getElementById('themeToggle'),
            settingsButton: document.getElementById('settingsButton'),
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettings: document.getElementById('closeSettings'),
            coubTimerInput: document.getElementById('coubTimer'),
            currentTimerValue: document.getElementById('currentTimerValue'),
            saveSettings: document.getElementById('saveSettings'),
            resetSettings: document.getElementById('resetSettings'),
            fileInput: document.getElementById('fileInput'),
            importDialog: document.getElementById('importDialog'),
            closeImport: document.getElementById('closeImport'),
            totalUrls: document.getElementById('totalUrls'),
            validUrls: document.getElementById('validUrls'),
            invalidUrls: document.getElementById('invalidUrls'),
            duplicateUrls: document.getElementById('duplicateUrls'),
            invalidUrlsItem: document.getElementById('invalidUrlsItem'),
            duplicateUrlsItem: document.getElementById('duplicateUrlsItem'),
            importMessage: document.getElementById('importMessage'),
            cancelImport: document.getElementById('cancelImport'),
            addToQueue: document.getElementById('addToQueue'),
            replaceQueue: document.getElementById('replaceQueue'),
            lightboxOverlay: document.getElementById('lightboxOverlay')
        };

        // Store parsed import data
        this.importData = null;

        // Initialize video player
        this.videoPlayer = new VideoPlayer(this.elements.videoContainer);

        // Set up video end callback
        this.videoPlayer.onVideoEnd(() => {
            this.playNext();
        });

        // Bind event listeners
        this.bindEvents();

        // Initialize settings
        this.initSettings();

        // Initialize theme
        this.initTheme();

        // Initial UI update
        this.updateUI();
    }

    /**
     * Bind event listeners to UI elements
     */
    bindEvents() {
        // Add button
        this.elements.addButton.addEventListener('click', () => {
            this.handleAddVideo();
        });

        // Enter key in input field
        this.elements.videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddVideo();
            }
        });

        // Video container click - opens lightbox and starts/resumes playback
        this.elements.videoContainer.addEventListener('click', () => {
            this.handleVideoContainerClick();
        });

        // Clear button
        this.elements.clearButton.addEventListener('click', () => {
            this.handleClear();
        });

        // Loop toggle
        if (this.elements.loopToggle) {
            this.elements.loopToggle.addEventListener('change', (e) => {
                this.handleLoopToggle(e.target.checked);
            });
        }

        // Shuffle toggle
        if (this.elements.shuffleToggle) {
            this.elements.shuffleToggle.addEventListener('change', (e) => {
                this.handleShuffleToggle(e.target.checked);
            });
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Settings button
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Close settings button
        if (this.elements.closeSettings) {
            this.elements.closeSettings.addEventListener('click', () => {
                this.hideSettings();
            });
        }

        // Close settings when clicking outside
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.addEventListener('click', (e) => {
                if (e.target === this.elements.settingsPanel) {
                    this.hideSettings();
                }
            });
        }

        // Save settings button
        if (this.elements.saveSettings) {
            this.elements.saveSettings.addEventListener('click', () => {
                this.handleSaveSettings();
            });
        }

        // Reset settings button
        if (this.elements.resetSettings) {
            this.elements.resetSettings.addEventListener('click', () => {
                this.handleResetSettings();
            });
        }

        // Coub timer input validation
        if (this.elements.coubTimerInput) {
            this.elements.coubTimerInput.addEventListener('input', (e) => {
                this.validateCoubTimer(e.target.value);
            });
        }

        // File input change
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        }

        // Close import dialog
        if (this.elements.closeImport) {
            this.elements.closeImport.addEventListener('click', () => {
                this.hideImportDialog();
            });
        }

        // Close import dialog when clicking outside
        if (this.elements.importDialog) {
            this.elements.importDialog.addEventListener('click', (e) => {
                if (e.target === this.elements.importDialog) {
                    this.hideImportDialog();
                }
            });
        }

        // Cancel import button
        if (this.elements.cancelImport) {
            this.elements.cancelImport.addEventListener('click', () => {
                this.handleCancelImport();
            });
        }

        // Add to queue button
        if (this.elements.addToQueue) {
            this.elements.addToQueue.addEventListener('click', () => {
                this.handleAddToQueue();
            });
        }

        // Replace queue button
        if (this.elements.replaceQueue) {
            this.elements.replaceQueue.addEventListener('click', () => {
                this.handleReplaceQueue();
            });
        }
    }

    /**
     * Handle video container click
     * Opens lightbox and starts/resumes playback
     */
    handleVideoContainerClick() {
        if (this.playlist.isEmpty()) {
            this.showMessage('Add videos to your playlist first', 'info');
            return;
        }

        // If we have a video loaded and lightbox was closed, resume
        if (this.isPlaying && this.videoPlayer.hasVideo()) {
            this.videoPlayer.resumeInLightbox();
            return;
        }

        // Start playing from current position or beginning
        this.handlePlay();
    }

    /**
     * Handle adding a video to the playlist
     */
    handleAddVideo() {
        const url = this.elements.videoUrlInput.value.trim();

        if (!url) {
            this.showMessage('Please enter a video URL', 'error');
            return;
        }

        const videoInfo = this.videoPlayer.parseUrl(url);

        if (!videoInfo) {
            this.showMessage('Invalid URL. Enter a valid YouTube, Vimeo, or Coub URL.', 'error');
            return;
        }

        const success = this.playlist.add(videoInfo);

        if (!success) {
            this.showMessage('Video already exists in playlist', 'warning');
            return;
        }

        // Clear input
        this.elements.videoUrlInput.value = '';

        // Update UI
        this.updateUI();
        this.showMessage(`Added ${videoInfo.platform} video to playlist`, 'success');
    }

    /**
     * Handle play - starts playback from current position
     */
    async handlePlay() {
        if (this.playlist.isEmpty()) {
            this.showMessage('Playlist is empty. Add some videos first!', 'warning');
            return;
        }

        // Get next video
        const video = this.playlist.getNext();

        if (!video) {
            this.showMessage('No more videos in playlist', 'info');
            return;
        }

        // Load and play video in lightbox
        this.isPlaying = true;
        const success = await this.videoPlayer.loadVideo(video);

        if (success) {
            this.updateVideoInfo(video);
            this.updateUI();
        } else {
            this.showMessage('Failed to load video', 'error');
            this.isPlaying = false;
            this.playNext();
        }
    }

    /**
     * Handle clear button click
     */
    handleClear() {
        if (this.playlist.isEmpty()) return;

        if (confirm('Are you sure you want to clear the entire playlist?')) {
            this.playlist.clear();
            this.videoPlayer.showPlaceholder();
            this.isPlaying = false;
            this.updateVideoInfo(null);
            this.updateUI();
            this.showMessage('Playlist cleared', 'info');
        }
    }

    /**
     * Handle loop toggle change
     * @param {boolean} enabled - Loop mode enabled status
     */
    handleLoopToggle(enabled) {
        this.playlist.setLoopMode(enabled);
    }

    /**
     * Handle shuffle toggle change
     * @param {boolean} enabled - Shuffle mode enabled status
     */
    handleShuffleToggle(enabled) {
        this.playlist.setShuffleMode(enabled);
    }

    /**
     * Handle click on playlist item to start playing from that video
     * @param {number} index - Index of clicked video
     */
    async handlePlaylistItemClick(index) {
        if (index < 0 || index >= this.playlist.getCount()) {
            return;
        }

        // Set the current index to one before the clicked item
        // so getNext() will return the clicked item
        this.playlist.setCurrentIndex(index - 1);

        // Start playing from the clicked video
        this.isPlaying = true;
        const video = this.playlist.getNext();

        if (video) {
            const success = await this.videoPlayer.loadVideo(video);
            if (success) {
                this.updateVideoInfo(video);
                this.updateUI();
            } else {
                this.showMessage('Failed to load video', 'error');
                this.isPlaying = false;
                this.playNext();
            }
        }
    }

    /**
     * Play the next video in the playlist
     */
    async playNext() {
        const video = this.playlist.getNext();

        if (!video) {
            // Playlist finished
            this.isPlaying = false;
            this.videoPlayer.showPlaceholder();
            this.updateVideoInfo(null);
            this.updateUI();
            return;
        }

        // Load and play next video
        const success = await this.videoPlayer.loadVideo(video);

        if (success) {
            this.updateVideoInfo(video);
            this.updateUI();
        } else {
            this.showMessage('Failed to load video, skipping...', 'error');
            this.playNext();
        }
    }

    /**
     * Update video info display
     * @param {Object|null} video - Current video object
     */
    updateVideoInfo(video) {
        if (!video) {
            this.elements.platformBadge.textContent = '';
            this.elements.platformBadge.className = 'platform-badge';
            this.elements.videoTitle.textContent = 'No video playing';
            return;
        }

        this.elements.platformBadge.textContent = video.platform;
        this.elements.platformBadge.className = `platform-badge ${video.platform}`;
        this.elements.videoTitle.textContent = `Playing ${video.platform} video`;
    }

    /**
     * Update the entire UI
     */
    updateUI() {
        this.updatePlaylistDisplay();
        this.updatePlaylistCount();
        this.updateVideoContainerState();
        this.updateClearButton();
    }

    /**
     * Update the video container play button state
     */
    updateVideoContainerState() {
        const hasVideos = !this.playlist.isEmpty();
        const container = this.elements.videoContainer;

        // Remove all state classes
        container.classList.remove('has-videos', 'now-playing');

        if (this.isPlaying) {
            container.classList.add('has-videos', 'now-playing');
            this.elements.playButtonText.textContent = '▶ Now Playing — Click to reopen';
        } else if (hasVideos) {
            container.classList.add('has-videos');
            this.elements.playButtonText.textContent = 'Click to play';
        } else {
            this.elements.playButtonText.textContent = 'Add videos to start playing';
        }
    }

    /**
     * Update clear button state
     */
    updateClearButton() {
        const hasVideos = !this.playlist.isEmpty();
        this.elements.clearButton.disabled = !hasVideos;
    }

    /**
     * Update playlist display
     */
    updatePlaylistDisplay() {
        const videos = this.playlist.getAll();
        const currentIndex = this.playlist.getCurrentIndex();

        if (videos.length === 0) {
            this.elements.playlistElement.innerHTML = `
                <div class="empty-playlist">
                    <p>Your playlist is empty. Add some videos to get started!</p>
                </div>
            `;
            return;
        }

        this.elements.playlistElement.innerHTML = videos.map((video, index) => {
            const isPlaying = index === currentIndex && this.isPlaying;
            return `
                <div class="playlist-item ${isPlaying ? 'playing' : ''}" data-index="${index}">
                    <div class="playlist-item-number">${index + 1}</div>
                    <div class="playlist-item-info">
                        <span class="playlist-item-platform ${video.platform}">${video.platform}</span>
                        <div class="playlist-item-url" title="${video.url}">${video.url}</div>
                    </div>
                    <button class="playlist-item-remove" data-index="${index}" aria-label="Remove video">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        // Add event listeners to playlist items for click-to-play
        const playlistItems = this.elements.playlistElement.querySelectorAll('.playlist-item');
        playlistItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.playlist-item-remove')) {
                    return;
                }
                const index = parseInt(item.getAttribute('data-index'));
                this.handlePlaylistItemClick(index);
            });
        });

        // Add event listeners to remove buttons
        const removeButtons = this.elements.playlistElement.querySelectorAll('.playlist-item-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(button.getAttribute('data-index'));
                this.handleRemoveVideo(index);
            });
        });
    }

    /**
     * Handle removing a video from the playlist
     * @param {number} index - Index of video to remove
     */
    handleRemoveVideo(index) {
        const currentIndex = this.playlist.getCurrentIndex();
        const wasPlaying = index === currentIndex;

        this.playlist.remove(index);

        // If we removed the currently playing video, play next
        if (wasPlaying && this.isPlaying) {
            this.playNext();
        }

        this.updateUI();
        this.showMessage('Video removed from playlist', 'info');
    }

    /**
     * Update playlist count display
     */
    updatePlaylistCount() {
        const count = this.playlist.getCount();
        this.elements.playlistCount.textContent = `(${count})`;
    }

    /* ============================================
       Theme System
       ============================================ */

    /**
     * Initialize theme from localStorage or system preference
     */
    initTheme() {
        let theme = 'light';

        try {
            const stored = localStorage.getItem('theme');
            if (stored === 'dark' || stored === 'light') {
                theme = stored;
            } else {
                // Check system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    theme = 'dark';
                }
            }
        } catch (error) {
            console.warn('Could not access localStorage for theme:', error);
        }

        this.setTheme(theme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Set the theme
     * @param {string} theme - 'light' or 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('Could not save theme to localStorage:', error);
        }
    }

    /* ============================================
       Settings
       ============================================ */

    /**
     * Initialize settings from localStorage
     */
    initSettings() {
        const currentTimer = this.videoPlayer.getCoubTimer();
        if (this.elements.coubTimerInput) {
            this.elements.coubTimerInput.value = currentTimer;
        }
        if (this.elements.currentTimerValue) {
            this.elements.currentTimerValue.textContent = currentTimer;
        }
    }

    /**
     * Show settings panel
     */
    showSettings() {
        if (this.elements.settingsPanel) {
            const currentTimer = this.videoPlayer.getCoubTimer();
            if (this.elements.coubTimerInput) {
                this.elements.coubTimerInput.value = currentTimer;
            }
            if (this.elements.currentTimerValue) {
                this.elements.currentTimerValue.textContent = currentTimer;
            }

            this.elements.settingsPanel.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide settings panel
     */
    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Validate Coub timer input
     * @param {string} value - Input value
     */
    validateCoubTimer(value) {
        const numValue = parseInt(value, 10);
        const input = this.elements.coubTimerInput;

        if (isNaN(numValue) || numValue < 1 || numValue > 99999) {
            if (input) {
                input.setCustomValidity('Please enter a value between 1 and 99999');
            }
        } else {
            if (input) {
                input.setCustomValidity('');
            }
        }
    }

    /**
     * Handle save settings button click
     */
    handleSaveSettings() {
        const timerValue = this.elements.coubTimerInput.value;
        const numValue = parseInt(timerValue, 10);

        if (isNaN(numValue) || numValue < 1 || numValue > 99999) {
            this.showMessage('Please enter a valid timer value between 1 and 99999 seconds', 'error');
            return;
        }

        const success = this.videoPlayer.setCoubTimer(numValue);

        if (success) {
            if (this.elements.currentTimerValue) {
                this.elements.currentTimerValue.textContent = numValue;
            }
            this.showMessage(`Coub timer updated to ${numValue} seconds`, 'success');
            this.hideSettings();
        } else {
            this.showMessage('Failed to save settings', 'error');
        }
    }

    /**
     * Handle reset settings button click
     */
    handleResetSettings() {
        const defaultTimer = 30;
        const success = this.videoPlayer.setCoubTimer(defaultTimer);

        if (success) {
            if (this.elements.coubTimerInput) {
                this.elements.coubTimerInput.value = defaultTimer;
            }
            if (this.elements.currentTimerValue) {
                this.elements.currentTimerValue.textContent = defaultTimer;
            }
            this.showMessage('Settings reset to default (30 seconds)', 'info');
        } else {
            this.showMessage('Failed to reset settings', 'error');
        }
    }

    /* ============================================
       Messages
       ============================================ */

    /**
     * Show a temporary message to the user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 14px 22px;
            background: ${this.getMessageColor(type)};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            animation: msgSlideIn 0.3s ease-out;
            max-width: 360px;
            font-weight: 500;
            font-size: 0.9rem;
        `;

        // Add animation styles if not already present
        if (!document.querySelector('style[data-message-style]')) {
            const style = document.createElement('style');
            style.setAttribute('data-message-style', 'true');
            style.textContent = `
                @keyframes msgSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes msgSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'msgSlideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Get color for message type
     * @param {string} type - Message type
     * @returns {string} - Color value
     */
    getMessageColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#6366f1'
        };
        return colors[type] || colors.info;
    }

    /* ============================================
       File Import
       ============================================ */

    /**
     * Handle file upload
     * @param {Event} event - File input change event
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
            this.showMessage('Please select a CSV or TXT file', 'error');
            this.elements.fileInput.value = '';
            return;
        }

        this.showMessage('Processing file...', 'info');

        try {
            const content = await this.readFileContent(file);
            const extractedData = await this.extractURLsFromFile(content, fileName);
            const validationResult = this.validateImportedURLs(extractedData.urls);

            if (validationResult.valid.length === 0) {
                this.showMessage('No valid video URLs found in file', 'warning');
                this.elements.fileInput.value = '';
                return;
            }

            this.importData = {
                totalUrls: extractedData.urls.length,
                validUrls: validationResult.valid,
                invalidUrls: validationResult.invalid,
                duplicateUrls: validationResult.duplicates
            };

            this.showImportDialog();
        } catch (error) {
            console.error('Error processing file:', error);
            this.showMessage('Failed to read file. Please try again.', 'error');
        } finally {
            this.elements.fileInput.value = '';
        }
    }

    /**
     * Read file content as text
     * @param {File} file - File object
     * @returns {Promise<string>} - File content
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Extract URLs from file content
     * @param {string} content - File content
     * @param {string} fileName - File name
     * @returns {Promise<Object>} - Extracted URLs and metadata
     */
    async extractURLsFromFile(content, fileName) {
        const isCSV = fileName.endsWith('.csv');
        const urls = [];

        if (isCSV) {
            urls.push(...this.parseCSVFile(content));
        } else {
            urls.push(...this.parseTXTFile(content));
        }

        return { urls: urls, fileType: isCSV ? 'CSV' : 'TXT' };
    }

    /**
     * Parse CSV file content
     * @param {string} content - CSV file content
     * @returns {Array<string>} - Array of URLs
     */
    parseCSVFile(content) {
        const urls = [];
        const lines = content.split(/\r?\n/);

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            const delimiters = [',', ';'];
            let foundUrl = false;

            for (const delimiter of delimiters) {
                if (line.includes(delimiter)) {
                    const fields = line.split(delimiter);

                    for (const field of fields) {
                        const trimmedField = field.trim();
                        if (trimmedField && (
                            trimmedField.includes('youtube.com') ||
                            trimmedField.includes('youtu.be') ||
                            trimmedField.includes('vimeo.com') ||
                            trimmedField.includes('coub.com')
                        )) {
                            urls.push(trimmedField);
                            foundUrl = true;
                            break;
                        }
                    }

                    if (foundUrl) break;
                }
            }

            if (!foundUrl && (
                trimmedLine.includes('youtube.com') ||
                trimmedLine.includes('youtu.be') ||
                trimmedLine.includes('vimeo.com') ||
                trimmedLine.includes('coub.com')
            )) {
                urls.push(trimmedLine);
            }
        }

        return urls;
    }

    /**
     * Parse TXT file content
     * @param {string} content - TXT file content
     * @returns {Array<string>} - Array of URLs
     */
    parseTXTFile(content) {
        const urls = [];
        const lines = content.split(/\r?\n/);

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            if (trimmedLine.includes('youtube.com') ||
                trimmedLine.includes('youtu.be') ||
                trimmedLine.includes('vimeo.com') ||
                trimmedLine.includes('coub.com')) {
                urls.push(trimmedLine);
            }
        }

        return urls;
    }

    /**
     * Validate imported URLs
     * @param {Array<string>} urls - Array of URLs to validate
     * @returns {Object} - Validation result
     */
    validateImportedURLs(urls) {
        const valid = [];
        const invalid = [];
        const duplicates = [];
        const seenUrls = new Set();
        const existingUrls = new Set(this.playlist.getAll().map(v => v.url));

        for (const url of urls) {
            const trimmedUrl = url.trim();

            if (seenUrls.has(trimmedUrl)) {
                continue;
            }
            seenUrls.add(trimmedUrl);

            const videoInfo = this.videoPlayer.parseUrl(trimmedUrl);

            if (videoInfo) {
                if (existingUrls.has(trimmedUrl)) {
                    duplicates.push(trimmedUrl);
                } else {
                    valid.push(videoInfo);
                }
            } else {
                invalid.push(trimmedUrl);
            }
        }

        return { valid, invalid, duplicates };
    }

    /**
     * Show import dialog with summary
     */
    showImportDialog() {
        if (!this.importData) return;

        const { totalUrls, validUrls, invalidUrls, duplicateUrls } = this.importData;

        this.elements.totalUrls.textContent = totalUrls;
        this.elements.validUrls.textContent = validUrls.length;
        this.elements.invalidUrls.textContent = invalidUrls.length;
        this.elements.duplicateUrls.textContent = duplicateUrls.length;

        if (invalidUrls.length > 0) {
            this.elements.invalidUrlsItem.style.display = 'flex';
        } else {
            this.elements.invalidUrlsItem.style.display = 'none';
        }

        if (duplicateUrls.length > 0) {
            this.elements.duplicateUrlsItem.style.display = 'flex';
        } else {
            this.elements.duplicateUrlsItem.style.display = 'none';
        }

        let message = `Ready to import ${validUrls.length} valid video${validUrls.length !== 1 ? 's' : ''}.`;
        if (invalidUrls.length > 0) {
            message += ` ${invalidUrls.length} invalid URL${invalidUrls.length !== 1 ? 's' : ''} will be skipped.`;
        }
        if (duplicateUrls.length > 0) {
            message += ` ${duplicateUrls.length} duplicate${duplicateUrls.length !== 1 ? 's' : ''} already in playlist.`;
        }
        this.elements.importMessage.textContent = message;

        this.elements.importDialog.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide import dialog
     */
    hideImportDialog() {
        if (this.elements.importDialog) {
            this.elements.importDialog.style.display = 'none';
            document.body.style.overflow = '';
        }
        this.importData = null;
    }

    /**
     * Handle cancel import action
     */
    handleCancelImport() {
        this.hideImportDialog();
        this.showMessage('Import cancelled', 'info');
    }

    /**
     * Handle add to queue action
     */
    handleAddToQueue() {
        if (!this.importData || !this.importData.validUrls) return;

        const validUrls = this.importData.validUrls;
        let addedCount = 0;

        for (const videoInfo of validUrls) {
            const success = this.playlist.add(videoInfo);
            if (success) addedCount++;
        }

        this.updateUI();
        this.hideImportDialog();

        if (addedCount > 0) {
            this.showMessage(`Added ${addedCount} video${addedCount !== 1 ? 's' : ''} to playlist`, 'success');
        } else {
            this.showMessage('No new videos were added', 'warning');
        }
    }

    /**
     * Handle replace queue action
     */
    handleReplaceQueue() {
        if (!this.importData || !this.importData.validUrls) return;

        const validUrls = this.importData.validUrls;

        this.playlist.clear();
        this.videoPlayer.showPlaceholder();
        this.isPlaying = false;
        this.updateVideoInfo(null);

        let addedCount = 0;
        for (const videoInfo of validUrls) {
            const success = this.playlist.add(videoInfo);
            if (success) addedCount++;
        }

        this.updateUI();
        this.hideImportDialog();
        this.showMessage(`Playlist replaced with ${addedCount} video${addedCount !== 1 ? 's' : ''}`, 'success');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });
} else {
    new App();
}
