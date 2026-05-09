/**
 * Main Application Controller
 * Integrates playlist and video player modules with UI
 * 
 * Features:
 * - Video playback with lightbox
 * - File import (CSV/TXT) with Add to Queue / Replace Queue
 * - YouTube playlist RSS import
 * - Shuffle mode with Fisher-Yates algorithm
 * - Loop mode (default on) - fix_5-5_AP
 * - Theme toggle (dark/light)
 * - Coub & TikTok timer settings
 * - Export playlist as .txt
 * - isPlaying flag management (fix_5-5_AP)
 */

import Playlist from './playlist.js';
import VideoPlayer from './video-player.js';

class App {
    constructor() {
        // Initialize modules
        this.playlist = new Playlist();
        this.videoPlayer = null;
        this.isPlaying = false; // fix_5-5_AP: isPlaying flag

        // DOM elements
        this.elements = {
            videoContainer: document.getElementById('videoContainer'),
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
            themeToggle: document.getElementById('themeToggle'),
            lightboxOverlay: document.getElementById('lightboxOverlay'),
            lightboxClose: document.getElementById('lightboxClose'),
            lightboxContent: document.getElementById('lightboxContent'),
            playButtonWrapper: document.getElementById('playButtonWrapper'),
            playButtonCircle: document.getElementById('playButtonCircle'),
            exportButton: document.getElementById('exportButton')
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

        // Initialize loop mode from toggle state
        if (this.elements.loopToggle) {
            this.playlist.setLoopMode(this.elements.loopToggle.checked);
        }

        // Initial UI update
        this.updateUI();
    }

    /**
     * Bind event listeners to UI elements
     */
    bindEvents() {
        // Add button
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => {
                this.handleAddVideo();
            });
        }

        // Enter key in input field
        if (this.elements.videoUrlInput) {
            this.elements.videoUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddVideo();
                }
            });
        }

        // Clear button
        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', () => {
                this.handleClear();
            });
        }

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

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Lightbox close
        if (this.elements.lightboxClose) {
            this.elements.lightboxClose.addEventListener('click', () => {
                this.closeLightbox();
            });
        }

        // Lightbox overlay click to close
        if (this.elements.lightboxOverlay) {
            this.elements.lightboxOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.lightboxOverlay) {
                    this.closeLightbox();
                }
            });
        }

        // Play button wrapper (big play button)
        if (this.elements.playButtonWrapper) {
            this.elements.playButtonWrapper.addEventListener('click', () => {
                this.handlePlayButtonClick();
            });
        }

        // Export button
        if (this.elements.exportButton) {
            this.elements.exportButton.addEventListener('click', () => {
                this.handleExport();
            });
        }
    }

    /**
     * Handle the big play button click - starts playing from beginning or current
     */
    async handlePlayButtonClick() {
        if (this.playlist.isEmpty()) {
            this.showMessage('Playlist is empty. Add some videos first!', 'warning');
            return;
        }

        // If already playing, do nothing
        if (this.isPlaying) {
            return;
        }

        // Get next video (will start from beginning if not playing)
        const video = this.playlist.getNext();

        if (!video) {
            this.showMessage('No more videos in playlist', 'info');
            return;
        }

        // Load and play video - fix_5-5_AP: set isPlaying before loading
        this.isPlaying = true;
        const success = await this.videoPlayer.loadVideo(video);

        if (success) {
            this.updateVideoInfo(video);
            this.updateUI();
            // Hide play button wrapper, show video
            if (this.elements.playButtonWrapper) {
                this.elements.playButtonWrapper.style.display = 'none';
            }
        } else {
            this.showMessage('Failed to load video', 'error');
            this.isPlaying = false;
            this.playNext();
        }
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

        // Check if it's a YouTube playlist URL
        const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        if (playlistMatch && url.includes('youtube.com')) {
            this.handleYouTubePlaylistImport(url, playlistMatch[1]);
            return;
        }

        // Parse the URL
        const videoInfo = this.videoPlayer.parseUrl(url);

        if (!videoInfo) {
            this.showMessage('Invalid video URL. Supported: YouTube, Vimeo, Coub, TikTok', 'error');
            return;
        }

        // Add to playlist
        const success = this.playlist.add(videoInfo);

        if (!success) {
            this.showMessage('Video already exists in playlist', 'warning');
            return;
        }

        // Regenerate shuffle indices if shuffle is active
        if (this.playlist.getShuffleMode()) {
            this.playlist.generateShuffledIndices();
        }

        // Clear input
        this.elements.videoUrlInput.value = '';

        // Update UI
        this.updateUI();
        this.showMessage(`Added ${videoInfo.platform} video to playlist`, 'success');
    }

    /**
     * Handle YouTube playlist URL import via RSS/proxy
     * @param {string} url - YouTube playlist URL
     * @param {string} playlistId - YouTube playlist ID
     */
    async handleYouTubePlaylistImport(url, playlistId) {
        this.showMessage('Fetching YouTube playlist...', 'info');

        try {
            // Try to fetch playlist via proxy
            const response = await fetch(`playlist_proxy.py?list=${playlistId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.videos && data.videos.length > 0) {
                    let addedCount = 0;
                    for (const videoId of data.videos) {
                        const videoInfo = {
                            platform: 'youtube',
                            videoId: videoId,
                            url: `https://www.youtube.com/watch?v=${videoId}`
                        };
                        if (this.playlist.add(videoInfo)) {
                            addedCount++;
                        }
                    }
                    this.updateUI();
                    this.elements.videoUrlInput.value = '';
                    this.showMessage(`Added ${addedCount} videos from YouTube playlist`, 'success');
                    return;
                }
            }
        } catch (error) {
            console.log('Proxy not available, trying RSS feed...');
        }

        // Fallback: try RSS feed directly
        try {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
            const response = await fetch(rssUrl);
            if (response.ok) {
                const text = await response.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, 'text/xml');
                const entries = xml.querySelectorAll('entry');
                
                let addedCount = 0;
                entries.forEach(entry => {
                    const videoIdEl = entry.querySelector('videoId') || entry.querySelector('yt\\:videoId');
                    if (videoIdEl) {
                        const videoId = videoIdEl.textContent;
                        const videoInfo = {
                            platform: 'youtube',
                            videoId: videoId,
                            url: `https://www.youtube.com/watch?v=${videoId}`
                        };
                        if (this.playlist.add(videoInfo)) {
                            addedCount++;
                        }
                    }
                });

                if (addedCount > 0) {
                    this.updateUI();
                    this.elements.videoUrlInput.value = '';
                    this.showMessage(`Added ${addedCount} videos from YouTube playlist`, 'success');
                } else {
                    this.showMessage('No videos found in playlist or all already added', 'warning');
                }
            } else {
                // If RSS also fails, try adding as single video
                const videoInfo = this.videoPlayer.parseUrl(url);
                if (videoInfo) {
                    const success = this.playlist.add(videoInfo);
                    if (success) {
                        this.elements.videoUrlInput.value = '';
                        this.updateUI();
                        this.showMessage(`Added ${videoInfo.platform} video to playlist`, 'success');
                    } else {
                        this.showMessage('Video already exists in playlist', 'warning');
                    }
                } else {
                    this.showMessage('Could not fetch playlist. Try adding videos individually.', 'error');
                }
            }
        } catch (error) {
            console.error('Error fetching YouTube playlist:', error);
            // Fallback to single video
            const videoInfo = this.videoPlayer.parseUrl(url);
            if (videoInfo) {
                const success = this.playlist.add(videoInfo);
                if (success) {
                    this.elements.videoUrlInput.value = '';
                    this.updateUI();
                    this.showMessage(`Added ${videoInfo.platform} video to playlist`, 'success');
                } else {
                    this.showMessage('Video already exists in playlist', 'warning');
                }
            } else {
                this.showMessage('Could not fetch playlist. Try adding videos individually.', 'error');
            }
        }
    }

    /**
     * Handle shuffle toggle change
     * @param {boolean} enabled - Shuffle mode enabled status
     */
    handleShuffleToggle(enabled) {
        this.playlist.setShuffleMode(enabled);
        const message = enabled ? 'Shuffle mode enabled' : 'Shuffle mode disabled';
        this.showMessage(message, 'info');
        console.log('Shuffle mode:', enabled);
    }

    /**
     * Handle clear button click
     */
    handleClear() {
        if (this.playlist.isEmpty()) {
            this.showMessage('Playlist is already empty', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear the entire playlist?')) {
            this.playlist.clear();
            this.videoPlayer.showPlaceholder();
            this.isPlaying = false; // fix_5-5_AP
            this.updateVideoInfo(null);
            this.updateUI();
            // Show play button wrapper again
            if (this.elements.playButtonWrapper) {
                this.elements.playButtonWrapper.style.display = '';
            }
            this.showMessage('Playlist cleared', 'info');
        }
    }

    /**
     * Handle loop toggle change
     * @param {boolean} enabled - Loop mode enabled status
     */
    handleLoopToggle(enabled) {
        this.playlist.setLoopMode(enabled);
        const message = enabled ? 'Loop mode enabled' : 'Loop mode disabled';
        this.showMessage(message, 'info');
        console.log('Loop mode:', enabled);
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

        // Start playing from the clicked video - fix_5-5_AP
        this.isPlaying = true;
        const video = this.playlist.getNext();

        if (video) {
            const success = await this.videoPlayer.loadVideo(video);
            if (success) {
                this.updateVideoInfo(video);
                this.updateUI();
                // Hide play button wrapper
                if (this.elements.playButtonWrapper) {
                    this.elements.playButtonWrapper.style.display = 'none';
                }
                this.showMessage('Playing from selected video', 'success');
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
        const previousIndex = this.playlist.getCurrentIndex();
        const video = this.playlist.getNext();

        if (!video) {
            // Playlist finished (loop mode is disabled)
            this.isPlaying = false; // fix_5-5_AP
            this.videoPlayer.showPlaceholder();
            this.updateVideoInfo(null);
            this.updateUI();
            // Show play button wrapper again
            if (this.elements.playButtonWrapper) {
                this.elements.playButtonWrapper.style.display = '';
            }
            this.showMessage('Playlist finished', 'info');
            return;
        }

        // Check if playlist restarted (loop mode)
        const currentIndex = this.playlist.getCurrentIndex();
        if (this.playlist.getLoopMode() && previousIndex > currentIndex && currentIndex === 0) {
            this.showMessage('Playlist restarting from beginning', 'info');
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
            if (this.elements.platformBadge) {
                this.elements.platformBadge.textContent = '';
                this.elements.platformBadge.className = 'platform-badge';
            }
            if (this.elements.videoTitle) {
                this.elements.videoTitle.textContent = 'No video playing';
            }
            return;
        }

        if (this.elements.platformBadge) {
            this.elements.platformBadge.textContent = video.platform;
            this.elements.platformBadge.className = `platform-badge ${video.platform}`;
        }
        if (this.elements.videoTitle) {
            this.elements.videoTitle.textContent = `Playing ${video.platform} video`;
        }
    }

    /**
     * Update the entire UI
     */
    updateUI() {
        this.updatePlaylistDisplay();
        this.updatePlaylistCount();
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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <p>Your playlist is empty. Add some videos to get started!</p>
                </div>
            `;
            return;
        }

        this.elements.playlistElement.innerHTML = videos.map((video, index) => {
            const isCurrentlyPlaying = index === currentIndex && this.isPlaying;
            return `
                <div class="playlist-item ${isCurrentlyPlaying ? 'playing' : ''}" data-index="${index}">
                    <div class="playlist-item-number">${index + 1}</div>
                    <div class="playlist-item-info">
                        <span class="playlist-item-platform ${video.platform}">${video.platform}</span>
                        <div class="playlist-item-url" title="${video.url}">${video.url}</div>
                    </div>
                    <button class="playlist-item-remove" data-index="${index}" aria-label="Remove video">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        if (this.elements.playlistCount) {
            this.elements.playlistCount.textContent = `(${count})`;
        }
    }

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
            
            this.showMessage(`Short video duration updated to ${numValue} seconds`, 'success');
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

    /**
     * Initialize theme from localStorage
     */
    initTheme() {
        try {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
        } catch (error) {
            console.warn('Could not access localStorage for theme:', error);
        }
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        try {
            localStorage.setItem('theme', newTheme);
        } catch (error) {
            console.warn('Could not save theme to localStorage:', error);
        }

        this.showMessage(`Switched to ${newTheme} theme`, 'info');
    }

    /**
     * Close lightbox overlay
     */
    closeLightbox() {
        if (this.elements.lightboxOverlay) {
            this.elements.lightboxOverlay.classList.remove('active');
        }
    }

    /**
     * Handle export button click - exports playlist as .txt file
     */
    handleExport() {
        // Check if playlist is empty
        if (this.playlist.isEmpty()) {
            this.showMessage('Playlist is empty - nothing to export', 'warning');
            return;
        }

        // Get all URLs as text
        const textContent = this.playlist.exportAsText();

        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `playlist_export_${dateStr}.txt`;

        // Create Blob and trigger download
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Create temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';

        document.body.appendChild(downloadLink);
        downloadLink.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }, 100);

        this.showMessage(`Exported ${this.playlist.getCount()} video(s) to ${filename}`, 'success');
    }

    /**
     * Show a temporary message/toast to the user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        // Remove existing messages to prevent stacking
        const existingMessages = document.querySelectorAll('.toast-message');
        existingMessages.forEach(msg => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        });

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `toast-message toast-${type}`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        // Trigger animation
        requestAnimationFrame(() => {
            messageEl.classList.add('show');
        });

        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Handle file upload
     * @param {Event} event - File input change event
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }

        // Validate file type
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

            // Store import data
            this.importData = {
                totalUrls: extractedData.urls.length,
                validUrls: validationResult.valid,
                invalidUrls: validationResult.invalid,
                duplicateUrls: validationResult.duplicates
            };

            // Show import dialog
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

        return {
            urls: urls,
            fileType: isCSV ? 'CSV' : 'TXT'
        };
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
                        if (trimmedField && this.looksLikeVideoUrl(trimmedField)) {
                            urls.push(trimmedField);
                            foundUrl = true;
                            break;
                        }
                    }
                    
                    if (foundUrl) break;
                }
            }

            if (!foundUrl && this.looksLikeVideoUrl(trimmedLine)) {
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

            if (this.looksLikeVideoUrl(trimmedLine)) {
                urls.push(trimmedLine);
            }
        }

        return urls;
    }

    /**
     * Check if a string looks like a supported video URL
     * @param {string} str - String to check
     * @returns {boolean} - True if it looks like a video URL
     */
    looksLikeVideoUrl(str) {
        return (
            str.includes('youtube.com') ||
            str.includes('youtu.be') ||
            str.includes('vimeo.com') ||
            str.includes('coub.com') ||
            str.includes('tiktok.com')
        );
    }

    /**
     * Validate imported URLs
     * @param {Array<string>} urls - Array of URLs to validate
     * @returns {Object} - Validation result with valid, invalid, and duplicate URLs
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

        if (this.elements.totalUrls) this.elements.totalUrls.textContent = totalUrls;
        if (this.elements.validUrls) this.elements.validUrls.textContent = validUrls.length;
        if (this.elements.invalidUrls) this.elements.invalidUrls.textContent = invalidUrls.length;
        if (this.elements.duplicateUrls) this.elements.duplicateUrls.textContent = duplicateUrls.length;

        if (this.elements.invalidUrlsItem) {
            this.elements.invalidUrlsItem.style.display = invalidUrls.length > 0 ? 'flex' : 'none';
        }
        if (this.elements.duplicateUrlsItem) {
            this.elements.duplicateUrlsItem.style.display = duplicateUrls.length > 0 ? 'flex' : 'none';
        }

        let message = `Ready to import ${validUrls.length} valid video${validUrls.length !== 1 ? 's' : ''}.`;
        if (invalidUrls.length > 0) {
            message += ` ${invalidUrls.length} invalid URL${invalidUrls.length !== 1 ? 's' : ''} will be skipped.`;
        }
        if (duplicateUrls.length > 0) {
            message += ` ${duplicateUrls.length} duplicate${duplicateUrls.length !== 1 ? 's' : ''} already in playlist.`;
        }
        if (this.elements.importMessage) this.elements.importMessage.textContent = message;

        if (this.elements.importDialog) {
            this.elements.importDialog.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
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
        if (!this.importData || !this.importData.validUrls) {
            return;
        }

        const validUrls = this.importData.validUrls;
        let addedCount = 0;

        for (const videoInfo of validUrls) {
            const success = this.playlist.add(videoInfo);
            if (success) {
                addedCount++;
            }
        }

        // Regenerate shuffle indices if shuffle is active
        if (this.playlist.getShuffleMode()) {
            this.playlist.generateShuffledIndices();
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
     * Enhancement #1: Full clear before adding - ensures no old entries remain
     */
    handleReplaceQueue() {
        if (!this.importData || !this.importData.validUrls) {
            return;
        }

        const validUrls = this.importData.validUrls;

        // Step 1: Completely clear the playlist (resets videos, currentIndex, shuffledIndices)
        this.playlist.clear();
        
        // Step 2: Verify playlist is empty
        if (this.playlist.getCount() !== 0) {
            console.error('Playlist clear failed - forcing reset');
            this.playlist.videos = [];
            this.playlist.currentIndex = -1;
            this.playlist.shuffledIndices = [];
            this.playlist.shufflePosition = -1;
        }

        // Step 3: Reset player state
        this.videoPlayer.showPlaceholder();
        this.isPlaying = false; // fix_5-5_AP
        this.updateVideoInfo(null);

        // Show play button wrapper again
        if (this.elements.playButtonWrapper) {
            this.elements.playButtonWrapper.style.display = '';
        }

        // Step 4: Add ALL valid URLs from the imported file
        let addedCount = 0;
        for (const videoInfo of validUrls) {
            const success = this.playlist.add(videoInfo);
            if (success) {
                addedCount++;
            }
        }

        // Step 5: Regenerate shuffle indices if shuffle is active
        if (this.playlist.getShuffleMode()) {
            this.playlist.generateShuffledIndices();
        }

        // Step 6: Update the playlist display UI
        this.updateUI();
        
        // Step 7: Hide dialog
        this.hideImportDialog();

        // Step 8: Show confirmation toast with count of added videos
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
