/**
 * Main Application Controller
 * Integrates playlist and video player modules with UI
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
            videoInfo: document.getElementById('videoInfo'),
            platformBadge: document.getElementById('platformBadge'),
            videoTitle: document.getElementById('videoTitle'),
            videoUrlInput: document.getElementById('videoUrlInput'),
            addButton: document.getElementById('addButton'),
            playButton: document.getElementById('playButton'),
            skipButton: document.getElementById('skipButton'),
            clearButton: document.getElementById('clearButton'),
            playlistElement: document.getElementById('playlist'),
            playlistCount: document.getElementById('playlistCount')
        };

        // Initialize video player
        this.videoPlayer = new VideoPlayer(this.elements.videoContainer);

        // Set up video end callback
        this.videoPlayer.onVideoEnd(() => {
            this.playNext();
        });

        // Bind event listeners
        this.bindEvents();

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

        // Play button
        this.elements.playButton.addEventListener('click', () => {
            this.handlePlay();
        });

        // Skip button
        this.elements.skipButton.addEventListener('click', () => {
            this.handleSkip();
        });

        // Clear button
        this.elements.clearButton.addEventListener('click', () => {
            this.handleClear();
        });
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

        // Parse the URL
        const videoInfo = this.videoPlayer.parseUrl(url);

        if (!videoInfo) {
            this.showMessage('Invalid video URL. Please enter a valid YouTube, Vimeo, or Coub URL.', 'error');
            return;
        }

        // Add to playlist
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
     * Handle play button click
     */
    async handlePlay() {
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

        // Load and play video
        this.isPlaying = true;
        const success = await this.videoPlayer.loadVideo(video);

        if (success) {
            this.updateVideoInfo(video);
            this.updateUI();
        } else {
            this.showMessage('Failed to load video', 'error');
            this.isPlaying = false;
            this.playNext(); // Try next video
        }
    }

    /**
     * Handle skip button click
     */
    handleSkip() {
        this.playNext();
    }

    /**
     * Handle clear button click
     */
    handleClear() {
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
            this.showMessage('Playlist finished', 'info');
            return;
        }

        // Load and play next video
        const success = await this.videoPlayer.loadVideo(video);

        if (success) {
            this.updateVideoInfo(video);
            this.updateUI();
        } else {
            this.showMessage('Failed to load video, skipping...', 'error');
            this.playNext(); // Try next video
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
        this.updateButtons();
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
     * Update button states
     */
    updateButtons() {
        const hasVideos = !this.playlist.isEmpty();

        this.elements.playButton.disabled = !hasVideos || this.isPlaying;
        this.elements.skipButton.disabled = !this.isPlaying;
        this.elements.clearButton.disabled = !hasVideos;
    }

    /**
     * Update playlist count display
     */
    updatePlaylistCount() {
        const count = this.playlist.getCount();
        this.elements.playlistCount.textContent = `(${count})`;
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
            z-index: 1000;
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
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });
} else {
    new App();
}
