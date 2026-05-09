/**
 * Main Application Controller
 * Integrates playlist and video player modules with UI
 * 
 * Changes implemented:
 * - #1: File Import - Allow Duplicates and Show Count
 * - #2: Replace Queue - Clear and Add All Valid Links
 * - #3: Loop Mode Active by Default
 * - #8: YouTube Playlist Import via RSS/XML
 * - #9: Fix Auto-Play Issue (fix_5-5_AP)
 */

import Playlist from './playlist.js';
import VideoPlayer from './video-player.js';

class App {
    constructor() {
        // Initialize modules
        this.playlist = new Playlist();
        this.videoPlayer = null;
        this.isPlaying = false; // fix_5-5_AP

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
            playButtonWrapper: document.getElementById('playButtonWrapper'),
            playButtonCircle: document.getElementById('playButtonCircle'),
            playButtonText: document.getElementById('playButtonText'),
            lightboxOverlay: document.getElementById('lightboxOverlay'),
            lightboxClose: document.getElementById('lightboxClose'),
            lightboxContent: document.getElementById('lightboxContent')
        };

        // Store parsed import data
        this.importData = null;

        // Initialize video player with lightbox content container
        this.videoPlayer = new VideoPlayer(this.elements.lightboxContent || this.elements.videoContainer);

        // Set up video end callback
        this.videoPlayer.onVideoEnd(() => {
            // fix_5-5_AP - Check isPlaying before advancing
            if (this.videoPlayer.isPlaying) { // fix_5-5_AP
                this.playNext();
            }
        });

        // Bind event listeners
        this.bindEvents();

        // Initialize settings
        this.initSettings();

        // Initialize theme
        this.initTheme();

        // Change #3: Initialize loop mode (default ON, respect localStorage)
        this.initLoopMode();

        // Initial UI update
        this.updateUI();
    }

    /**
     * Initialize loop mode - default to ON unless localStorage says otherwise
     * Change #3: Loop Mode Active by Default
     */
    initLoopMode() {
        let loopEnabled = true; // Default to ON

        try {
            const stored = localStorage.getItem('loopMode');
            if (stored !== null) {
                loopEnabled = stored === 'true';
            }
        } catch (e) {
            console.warn('Could not read loopMode from localStorage');
        }

        // Set playlist loop mode
        this.playlist.setLoopMode(loopEnabled);

        // Update toggle UI
        if (this.elements.loopToggle) {
            this.elements.loopToggle.checked = loopEnabled;
        }
    }

    /**
     * Initialize theme from localStorage or default
     */
    initTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
        } catch (e) {
            console.warn('Could not read theme from localStorage');
        }
    }

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {
            console.warn('Could not save theme to localStorage');
        }
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

        // Play button (click-to-play in video container)
        if (this.elements.playButtonWrapper) {
            this.elements.playButtonWrapper.addEventListener('click', () => {
                this.handlePlayButtonClick();
            });
        }

        // Lightbox close button
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

        // Escape key to close lightbox
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.lightboxOverlay && 
                this.elements.lightboxOverlay.classList.contains('active')) {
                this.closeLightbox();
            }
        });

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
     * Handle play button click - opens lightbox and starts playing
     */
    handlePlayButtonClick() {
        if (this.playlist.isEmpty()) {
            this.showMessage('Playlist is empty. Add some videos first!', 'warning');
            return;
        }

        // Open lightbox
        this.openLightbox();

        // If not already playing, start from current or beginning
        if (!this.isPlaying) {
            this.handlePlay();
        }
    }

    /**
     * Open lightbox overlay
     * Change #6: Unmute video when lightbox opens
     */
    openLightbox() {
        if (this.elements.lightboxOverlay) {
            this.elements.lightboxOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.videoPlayer.openLightbox(); // Change #6: Unmute video
            this.isPlaying = true; // fix_5-5_AP
        }
    }

    /**
     * Close lightbox overlay
     * Change #6: Mute video when lightbox closes
     */
    closeLightbox() {
        if (this.elements.lightboxOverlay) {
            this.elements.lightboxOverlay.classList.remove('active');
            document.body.style.overflow = '';
            this.videoPlayer.closeLightbox(); // Change #6: Mute video
            this.isPlaying = false; // fix_5-5_AP
        }
    }

    /**
     * Handle adding a video to the playlist
     * Change #8: Detect YouTube playlist URLs
     */
    handleAddVideo() {
        const url = this.elements.videoUrlInput.value.trim();

        if (!url) {
            this.showMessage('Please enter a video URL', 'error');
            return;
        }

        // Change #8: Check if it's a YouTube playlist URL
        const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        if (playlistMatch && url.includes('youtube.com/playlist')) {
            this.handlePlaylistURL(playlistMatch[1]);
            return;
        }

        // Parse the URL (includes YouTube Shorts support - Change #7)
        const videoInfo = this.videoPlayer.parseUrl(url);

        if (!videoInfo) {
            this.showMessage('Invalid video URL. Please enter a valid YouTube, Vimeo, or Coub URL.', 'error');
            return;
        }

        // Add to playlist (Change #1: duplicates allowed)
        const success = this.playlist.add(videoInfo);

        if (!success) {
            this.showMessage('Failed to add video', 'error');
            return;
        }

        // Clear input
        this.elements.videoUrlInput.value = '';

        // Update UI
        this.updateUI();
        this.showMessage(`Added ${videoInfo.platform} video to playlist`, 'success');
    }

    /**
     * Handle YouTube Playlist URL import
     * Change #8: YouTube Playlist Import via RSS/XML
     * @param {string} playlistId - YouTube playlist ID
     */
    async handlePlaylistURL(playlistId) {
        this.showMessage('Fetching playlist videos...', 'info');

        try {
            let videos = [];

            // Try direct fetch first (may fail due to CORS)
            try {
                const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
                const response = await fetch(rssUrl);
                if (response.ok) {
                    const xmlText = await response.text();
                    videos = this.parsePlaylistXML(xmlText);
                }
            } catch (corsError) {
                console.log('Direct fetch failed (CORS), trying proxy...');
            }

            // If direct fetch failed, try local proxy
            if (videos.length === 0) {
                try {
                    const proxyUrl = `http://localhost:8080/fetch-playlist?id=${playlistId}`;
                    const proxyResponse = await fetch(proxyUrl);
                    if (proxyResponse.ok) {
                        const data = await proxyResponse.json();
                        if (data.videos && data.videos.length > 0) {
                            videos = data.videos;
                        }
                    }
                } catch (proxyError) {
                    console.log('Proxy fetch also failed:', proxyError.message);
                }
            }

            if (videos.length === 0) {
                this.showMessage('Could not fetch playlist. Try running the proxy server (python3 playlist_proxy.py) or check the playlist ID.', 'error');
                return;
            }

            // Parse video URLs and show import dialog
            const validUrls = [];
            const invalidUrls = [];
            const existingUrls = new Set(this.playlist.getAll().map(v => v.url));
            let duplicateCount = 0;

            for (const videoUrl of videos) {
                const videoInfo = this.videoPlayer.parseUrl(videoUrl);
                if (videoInfo) {
                    // Change #1: Count duplicates but don't filter them
                    if (existingUrls.has(videoUrl)) {
                        duplicateCount++;
                    }
                    validUrls.push(videoInfo);
                } else {
                    invalidUrls.push(videoUrl);
                }
            }

            if (validUrls.length === 0) {
                this.showMessage('No valid video URLs found in playlist', 'warning');
                return;
            }

            // Store import data and show dialog
            this.importData = {
                totalUrls: videos.length,
                validUrls: validUrls,
                invalidUrls: invalidUrls,
                duplicateUrls: Array(duplicateCount).fill('') // placeholder for count
            };

            this.showImportDialog();
            this.elements.videoUrlInput.value = '';

        } catch (error) {
            console.error('Error fetching playlist:', error);
            this.showMessage('Failed to fetch playlist. Please try again.', 'error');
        }
    }

    /**
     * Parse YouTube RSS/XML to extract video URLs
     * Change #8: YouTube Playlist Import
     * @param {string} xmlText - XML content from YouTube RSS feed
     * @returns {Array<string>} - Array of video URLs
     */
    parsePlaylistXML(xmlText) {
        const videos = [];
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Try to find video IDs from <yt:videoId> elements
            const videoIdElements = xmlDoc.querySelectorAll('videoId');
            if (videoIdElements.length > 0) {
                videoIdElements.forEach(el => {
                    const videoId = el.textContent.trim();
                    if (videoId) {
                        videos.push(`https://www.youtube.com/watch?v=${videoId}`);
                    }
                });
            }

            // Fallback: try to find from <link> elements
            if (videos.length === 0) {
                const entries = xmlDoc.querySelectorAll('entry');
                entries.forEach(entry => {
                    const link = entry.querySelector('link[href]');
                    if (link) {
                        const href = link.getAttribute('href');
                        if (href && href.includes('youtube.com/watch')) {
                            videos.push(href);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error parsing playlist XML:', error);
        }
        return videos;
    }

    /**
     * Handle play button click
     */
    async handlePlay() {
        if (this.playlist.isEmpty()) {
            this.showMessage('Playlist is empty. Add some videos first!', 'warning');
            return;
        }

        // Get next video (will start from beginning if not playing)
        const video = this.playlist.getNext();

        if (!video) {
            this.showMessage('No more videos in playlist', 'info');
            return;
        }

        // Load and play video
        this.isPlaying = true; // fix_5-5_AP
        this.videoPlayer.isPlaying = true; // fix_5-5_AP
        const success = await this.videoPlayer.loadVideo(video);

        if (success) {
            this.updateVideoInfo(video);
            this.updateUI();
            this.updatePlayButtonText(video);
        } else {
            this.showMessage('Failed to load video', 'error');
            this.isPlaying = false; // fix_5-5_AP
            this.playNext(); // Try next video
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
        if (confirm('Are you sure you want to clear the entire playlist?')) {
            this.playlist.clear();
            this.isPlaying = false; // fix_5-5_AP
            this.videoPlayer.isPlaying = false; // fix_5-5_AP
            this.updateVideoInfo(null);
            this.updateUI();
            this.updatePlayButtonText(null);
            this.showMessage('Playlist cleared', 'info');
        }
    }

    /**
     * Handle loop toggle change
     * @param {boolean} enabled - Loop mode enabled status
     */
    handleLoopToggle(enabled) {
        this.playlist.setLoopMode(enabled);
        // Save preference to localStorage
        try {
            localStorage.setItem('loopMode', enabled.toString());
        } catch (e) {
            console.warn('Could not save loopMode to localStorage');
        }
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

        // Open lightbox and start playing
        this.openLightbox();

        // Start playing from the clicked video
        this.isPlaying = true; // fix_5-5_AP
        this.videoPlayer.isPlaying = true; // fix_5-5_AP
        const video = this.playlist.getNext();

        if (video) {
            const success = await this.videoPlayer.loadVideo(video);
            if (success) {
                this.updateVideoInfo(video);
                this.updateUI();
                this.updatePlayButtonText(video);
                this.showMessage('Playing from selected video', 'success');
            } else {
                this.showMessage('Failed to load video', 'error');
                this.isPlaying = false; // fix_5-5_AP
                this.playNext(); // Try next video
            }
        }
    }

    /**
     * Play the next video in the playlist
     * fix_5-5_AP - Added isPlaying check
     */
    async playNext() {
        // fix_5-5_AP - Don't advance if user has paused
        if (!this.isPlaying && !this.videoPlayer.isPlaying) { // fix_5-5_AP
            console.log('playNext skipped - user paused'); // fix_5-5_AP
            return; // fix_5-5_AP
        } // fix_5-5_AP

        const previousIndex = this.playlist.getCurrentIndex();
        const video = this.playlist.getNext();

        if (!video) {
            // Playlist finished (loop mode is disabled)
            this.isPlaying = false; // fix_5-5_AP
            this.videoPlayer.isPlaying = false; // fix_5-5_AP
            this.updateVideoInfo(null);
            this.updateUI();
            this.updatePlayButtonText(null);
            this.showMessage('Playlist finished', 'info');
            this.closeLightbox();
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
            this.updatePlayButtonText(video);
        } else {
            this.showMessage('Failed to load video, skipping...', 'error');
            this.playNext(); // Try next video
        }
    }

    /**
     * Update play button text based on current state
     * @param {Object|null} video - Current video or null
     */
    updatePlayButtonText(video) {
        if (this.elements.playButtonText) {
            if (video) {
                this.elements.playButtonText.textContent = `Now playing: ${video.platform} video`;
            } else if (this.playlist.isEmpty()) {
                this.elements.playButtonText.textContent = 'Add videos to start playing';
            } else {
                this.elements.playButtonText.textContent = 'Click to play';
            }
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
                    <p>Your playlist is empty. Add some videos to get started!</p>
                </div>
            `;
            return;
        }

        this.elements.playlistElement.innerHTML = videos.map((video, index) => {
            const isPlaying = index === currentIndex;
            return `
                <div class="playlist-item ${isPlaying ? 'playing' : ''}" data-index="${index}">
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
                // Don't trigger if clicking the remove button
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
            // Update current values before showing
            const currentTimer = this.videoPlayer.getCoubTimer();
            if (this.elements.coubTimerInput) {
                this.elements.coubTimerInput.value = currentTimer;
            }
            if (this.elements.currentTimerValue) {
                this.elements.currentTimerValue.textContent = currentTimer;
            }
            
            this.elements.settingsPanel.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    /**
     * Hide settings panel
     */
    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
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

        // Validate input
        if (isNaN(numValue) || numValue < 1 || numValue > 99999) {
            this.showMessage('Please enter a valid timer value between 1 and 99999 seconds', 'error');
            return;
        }

        // Save to localStorage via videoPlayer
        const success = this.videoPlayer.setCoubTimer(numValue);

        if (success) {
            // Update display
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
        
        // Reset to default
        const success = this.videoPlayer.setCoubTimer(defaultTimer);

        if (success) {
            // Update inputs
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
     * Show a temporary message to the user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${this.getMessageColor(type)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            font-weight: 500;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        if (!document.querySelector('style[data-message-style]')) {
            style.setAttribute('data-message-style', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-out';
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
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
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
            this.elements.fileInput.value = ''; // Reset input
            return;
        }

        // Show loading message
        this.showMessage('Processing file...', 'info');

        try {
            // Read file content
            const content = await this.readFileContent(file);
            
            // Extract URLs from file
            const extractedData = await this.extractURLsFromFile(content, fileName);
            
            // Validate imported URLs
            // Change #1: Allow duplicates, just count them for display
            const validationResult = this.validateImportedURLs(extractedData.urls);
            
            // Check if there are any valid URLs
            if (validationResult.valid.length === 0) {
                this.showMessage('No valid video URLs found in file', 'warning');
                this.elements.fileInput.value = ''; // Reset input
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
            // Reset file input to allow re-uploading the same file
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
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
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
            // Parse CSV file
            urls.push(...this.parseCSVFile(content));
        } else {
            // Parse TXT file
            urls.push(...this.parseTXTFile(content));
        }

        return {
            urls: urls,
            fileType: isCSV ? 'CSV' : 'TXT'
        };
    }

    /**
     * Parse CSV file content
     * Change #7: Added youtube.com/shorts detection
     * @param {string} content - CSV file content
     * @returns {Array<string>} - Array of URLs
     */
    parseCSVFile(content) {
        const urls = [];
        const lines = content.split(/\r?\n/);

        for (const line of lines) {
            // Skip empty lines and comment lines
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            // Try both comma and semicolon as delimiters
            const delimiters = [',', ';'];
            let foundUrl = false;

            for (const delimiter of delimiters) {
                if (line.includes(delimiter)) {
                    const fields = line.split(delimiter);
                    
                    // Check each field for a valid URL
                    for (const field of fields) {
                        const trimmedField = field.trim();
                        // Check if field looks like a URL (Change #7: added shorts)
                        if (trimmedField && (
                            trimmedField.includes('youtube.com') ||
                            trimmedField.includes('youtu.be') ||
                            trimmedField.includes('vimeo.com') ||
                            trimmedField.includes('coub.com')
                        )) {
                            urls.push(trimmedField);
                            foundUrl = true;
                            break; // Take first URL found in the line
                        }
                    }
                    
                    if (foundUrl) {
                        break;
                    }
                }
            }

            // If no delimiter found, treat entire line as potential URL
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
            // Skip empty lines and comment lines
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            // Check if line looks like a URL
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
     * Change #1: Allow duplicates - count them but don't filter them out
     * @param {Array<string>} urls - Array of URLs to validate
     * @returns {Object} - Validation result with valid, invalid, and duplicate counts
     */
    validateImportedURLs(urls) {
        const valid = [];
        const invalid = [];
        const duplicates = [];
        const existingUrls = new Set(this.playlist.getAll().map(v => v.url));

        for (const url of urls) {
            const trimmedUrl = url.trim();

            // Parse URL using video player
            const videoInfo = this.videoPlayer.parseUrl(trimmedUrl);

            if (videoInfo) {
                // Change #1: Add ALL valid URLs regardless of duplicate status
                valid.push(videoInfo);
                
                // Change #1: Track duplicates for informational display only
                if (existingUrls.has(trimmedUrl)) {
                    duplicates.push(trimmedUrl);
                }
            } else {
                invalid.push(trimmedUrl);
            }
        }

        return {
            valid: valid,
            invalid: invalid,
            duplicates: duplicates
        };
    }

    /**
     * Show import dialog with summary
     * Change #1: Updated to show duplicate count as informational
     */
    showImportDialog() {
        if (!this.importData) {
            return;
        }

        const { totalUrls, validUrls, invalidUrls, duplicateUrls } = this.importData;

        // Update summary values
        if (this.elements.totalUrls) {
            this.elements.totalUrls.textContent = totalUrls;
        }
        if (this.elements.validUrls) {
            // Change #1: Display format "Valid URLs: X | Duplicates in current playlist: Y"
            this.elements.validUrls.textContent = validUrls.length;
        }
        if (this.elements.invalidUrls) {
            this.elements.invalidUrls.textContent = invalidUrls.length;
        }
        if (this.elements.duplicateUrls) {
            this.elements.duplicateUrls.textContent = duplicateUrls.length;
        }

        // Show/hide invalid URLs item
        if (this.elements.invalidUrlsItem) {
            if (invalidUrls.length > 0) {
                this.elements.invalidUrlsItem.style.display = 'flex';
            } else {
                this.elements.invalidUrlsItem.style.display = 'none';
            }
        }

        // Show/hide duplicate URLs item (informational only - Change #1)
        if (this.elements.duplicateUrlsItem) {
            if (duplicateUrls.length > 0) {
                this.elements.duplicateUrlsItem.style.display = 'flex';
            } else {
                this.elements.duplicateUrlsItem.style.display = 'none';
            }
        }

        // Update message - Change #1: Clarify duplicates are informational
        let message = `Ready to import ${validUrls.length} valid video${validUrls.length !== 1 ? 's' : ''}.`;
        if (invalidUrls.length > 0) {
            message += ` ${invalidUrls.length} invalid URL${invalidUrls.length !== 1 ? 's' : ''} will be skipped.`;
        }
        if (duplicateUrls.length > 0) {
            message += ` ${duplicateUrls.length} duplicate${duplicateUrls.length !== 1 ? 's' : ''} already in playlist (will still be imported).`;
        }
        if (this.elements.importMessage) {
            this.elements.importMessage.textContent = message;
        }

        // Show dialog
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
     * Change #1: Add ALL valid URLs (including duplicates)
     */
    handleAddToQueue() {
        if (!this.importData || !this.importData.validUrls) {
            return;
        }

        const validUrls = this.importData.validUrls;
        let addedCount = 0;

        // Change #1: Add each valid URL to playlist (duplicates allowed)
        for (const videoInfo of validUrls) {
            const success = this.playlist.add(videoInfo);
            if (success) {
                addedCount++;
            }
        }

        // Update UI
        this.updateUI();
        
        // Hide dialog
        this.hideImportDialog();

        // Show success message
        if (addedCount > 0) {
            this.showMessage(`Added ${addedCount} video${addedCount !== 1 ? 's' : ''} to playlist`, 'success');
        } else {
            this.showMessage('No new videos were added', 'warning');
        }
    }

    /**
     * Handle replace queue action
     * Change #2: Clear and add ALL valid links without any filtering
     */
    handleReplaceQueue() {
        if (!this.importData || !this.importData.validUrls) {
            return;
        }

        const validUrls = this.importData.validUrls;

        // Change #2: Clear current playlist completely
        this.playlist.clear();
        this.isPlaying = false; // fix_5-5_AP
        this.videoPlayer.isPlaying = false; // fix_5-5_AP
        this.updateVideoInfo(null);
        this.updatePlayButtonText(null);

        // Change #2: Add ALL valid URLs (no duplicate filtering since playlist is empty)
        let addedCount = 0;
        for (const videoInfo of validUrls) {
            const success = this.playlist.add(videoInfo);
            if (success) {
                addedCount++;
            }
        }

        // Change #2: Re-generate shuffled indices after replace
        if (this.playlist.getShuffleMode()) {
            this.playlist.generateShuffledIndices();
        }

        // Update UI
        this.updateUI();
        
        // Hide dialog
        this.hideImportDialog();

        // Show success message
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
