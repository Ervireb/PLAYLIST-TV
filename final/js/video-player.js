/**
 * Video Player Module
 * Handles video playback, platform detection, and API integration
 */

/* global YT, Vimeo */

class VideoPlayer {
    constructor(containerElement) {
        this.container = containerElement;
        this.currentPlayer = null;
        this.currentPlatform = null;
        this.onVideoEndCallback = null;
        this.youtubeReady = false;
        this.vimeoReady = true; // Vimeo API loads synchronously
        this.wasFullscreen = false; // Track fullscreen state
        this.youtubeAutoplayRetries = 0;
        this.maxAutoplayRetries = 3;
        
        // Initialize YouTube API
        this.initYouTubeAPI();
        
        // Listen for fullscreen changes
        this.initFullscreenListeners();
    }

    /**
     * Initialize YouTube IFrame API
     */
    initYouTubeAPI() {
        // Check if API is already loaded
        if (window.YT && window.YT.Player) {
            this.youtubeReady = true;
            return;
        }

        // Wait for API to load
        window.onYouTubeIframeAPIReady = () => {
            this.youtubeReady = true;
            console.log('YouTube IFrame API ready');
        };
    }

    /**
     * Initialize fullscreen event listeners
     */
    initFullscreenListeners() {
        const fullscreenEvents = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

        fullscreenEvents.forEach(event => {
            document.addEventListener(event, () => {
                this.wasFullscreen = this.isFullscreen();
            });
        });
    }

    /**
     * Check if currently in fullscreen mode
     * @returns {boolean} - True if in fullscreen
     */
    isFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }

    /**
     * Enter fullscreen mode
     * @param {HTMLElement} element - Element to make fullscreen
     */
    enterFullscreen(element) {
        if (!element) {
            element = this.container;
        }

        try {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } catch (error) {
            console.error('Error entering fullscreen:', error);
        }
    }

    /**
     * Parse video URL and detect platform
     * @param {string} url - Video URL
     * @returns {Object|null} - Parsed video info or null if invalid
     */
    parseUrl(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        url = url.trim();

        // YouTube patterns
        const youtubePatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of youtubePatterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: 'youtube',
                    videoId: match[1],
                    url: url
                };
            }
        }

        // Vimeo patterns
        const vimeoPatterns = [
            /vimeo\.com\/(\d+)/,
            /player\.vimeo\.com\/video\/(\d+)/
        ];

        for (const pattern of vimeoPatterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: 'vimeo',
                    videoId: match[1],
                    url: url
                };
            }
        }

        // Coub patterns
        const coubPatterns = [
            /coub\.com\/view\/([a-zA-Z0-9]+)/,
            /coub\.com\/embed\/([a-zA-Z0-9]+)/
        ];

        for (const pattern of coubPatterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: 'coub',
                    videoId: match[1],
                    url: url
                };
            }
        }

        return null;
    }

    /**
     * Load and play a video
     * @param {Object} video - Video object with platform and videoId
     * @returns {Promise<boolean>} - Success status
     */
    async loadVideo(video) {
        if (!video || !video.platform || !video.videoId) {
            console.error('Invalid video object');
            return false;
        }

        // Store fullscreen state before clearing player
        const shouldReenterFullscreen = this.wasFullscreen;

        // Clear current player
        this.clearPlayer();

        this.currentPlatform = video.platform;

        try {
            switch (video.platform) {
                case 'youtube':
                    await this.loadYouTube(video.videoId);
                    break;
                case 'vimeo':
                    await this.loadVimeo(video.videoId);
                    break;
                case 'coub':
                    await this.loadCoub(video.videoId);
                    break;
                default:
                    console.error('Unsupported platform:', video.platform);
                    return false;
            }

            // Re-enter fullscreen if it was active before
            if (shouldReenterFullscreen) {
                setTimeout(() => {
                    this.enterFullscreen();
                }, 500); // Small delay to ensure video is loaded
            }

            return true;
        } catch (error) {
            console.error('Error loading video:', error);
            return false;
        }
    }

    /**
     * Load YouTube video
     * @param {string} videoId - YouTube video ID
     */
    async loadYouTube(videoId) {
        // Wait for API to be ready
        if (!this.youtubeReady) {
            await this.waitForYouTubeAPI();
        }

        // Reset autoplay retry counter
        this.youtubeAutoplayRetries = 0;

        return new Promise((resolve, reject) => {
            try {
                // Create iframe element
                const iframe = document.createElement('div');
                iframe.id = 'youtube-player-' + Date.now();
                this.container.innerHTML = '';
                this.container.appendChild(iframe);

                // Create YouTube player
                this.currentPlayer = new YT.Player(iframe.id, {
                    videoId: videoId,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: 1,
                        mute: 1, // Mute to comply with autoplay policies
                        rel: 0,
                        modestbranding: 1
                    },
                    events: {
                        onReady: (event) => {
                            console.log('YouTube player ready');
                            // Unmute after a short delay (user interaction workaround)
                            setTimeout(() => {
                                try {
                                    event.target.unMute();
                                } catch (error) {
                                    console.log('Could not unmute (autoplay policy):', error.message);
                                }
                            }, 1000);

                            // Implement autoplay detection and retry mechanism
                            this.checkYouTubeAutoplay(event.target);

                            resolve();
                        },
                        onStateChange: (event) => {
                            // YT.PlayerState.ENDED = 0
                            if (event.data === YT.PlayerState.ENDED) {
                                console.log('YouTube video ended');
                                if (this.onVideoEndCallback) {
                                    this.onVideoEndCallback();
                                }
                            }
                            // YT.PlayerState.PLAYING = 1
                            if (event.data === YT.PlayerState.PLAYING) {
                                console.log('YouTube video is playing');
                                this.youtubeAutoplayRetries = 0; // Reset retries on successful play
                            }
                        },
                        onError: (event) => {
                            console.error('YouTube player error:', event.data);
                            reject(new Error('YouTube player error'));
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Check if YouTube video is autoplaying and retry if needed
     * @param {Object} player - YouTube player instance
     */
    checkYouTubeAutoplay(player) {
        // Wait 2.5 seconds then check if video is playing
        setTimeout(() => {
            try {
                const state = player.getPlayerState();
                // YT.PlayerState.PLAYING = 1, YT.PlayerState.BUFFERING = 3
                if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
                    console.log('YouTube autoplay failed, attempting to play manually...');
                    
                    if (this.youtubeAutoplayRetries < this.maxAutoplayRetries) {
                        this.youtubeAutoplayRetries++;
                        player.playVideo();
                        
                        // Check again after retry
                        if (this.youtubeAutoplayRetries < this.maxAutoplayRetries) {
                            this.checkYouTubeAutoplay(player);
                        }
                    } else {
                        console.error('YouTube autoplay failed after maximum retries');
                    }
                }
            } catch (error) {
                console.error('Error checking YouTube autoplay:', error);
            }
        }, 2500);
    }

    /**
     * Load Vimeo video
     * @param {string} videoId - Vimeo video ID
     */
    async loadVimeo(videoId) {
        return new Promise((resolve, reject) => {
            try {
                // Create iframe element
                const iframe = document.createElement('iframe');
                iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'autoplay; fullscreen; picture-in-picture';
                iframe.allowFullscreen = true;

                this.container.innerHTML = '';
                this.container.appendChild(iframe);

                // Initialize Vimeo Player API
                if (window.Vimeo && window.Vimeo.Player) {
                    this.currentPlayer = new Vimeo.Player(iframe);

                    this.currentPlayer.on('loaded', () => {
                        console.log('Vimeo player ready');
                        // Try to unmute after a delay
                        setTimeout(() => {
                            this.currentPlayer.setMuted(false).catch(() => {
                                console.log('Could not unmute Vimeo (autoplay policy)');
                            });
                        }, 1000);
                        resolve();
                    });

                    this.currentPlayer.on('ended', () => {
                        console.log('Vimeo video ended');
                        if (this.onVideoEndCallback) {
                            this.onVideoEndCallback();
                        }
                    });

                    this.currentPlayer.on('error', (error) => {
                        console.error('Vimeo player error:', error);
                        reject(error);
                    });
                } else {
                    // Fallback if Vimeo API not available
                    console.warn('Vimeo Player API not available, using basic iframe');
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Load Coub video
     * @param {string} videoId - Coub video ID
     */
    async loadCoub(videoId) {
        return new Promise((resolve) => {
            try {
                // Create iframe element for Coub
                const iframe = document.createElement('iframe');
                iframe.src = `https://coub.com/embed/${videoId}?muted=false&autoplay=true&originalSize=false&startWithHD=true`;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'autoplay';
                iframe.allowFullscreen = true;

                this.container.innerHTML = '';
                this.container.appendChild(iframe);

                console.log('Coub video loaded');
                
                // Coub doesn't have a reliable end event API
                // Set a timeout to trigger next video (Coub videos are typically short loops)
                // This is a workaround - in production, you might want to handle this differently
                this.currentPlayer = {
                    type: 'coub',
                    iframe: iframe,
                    timeout: setTimeout(() => {
                        console.log('Coub video timeout (assumed ended)');
                        if (this.onVideoEndCallback) {
                            this.onVideoEndCallback();
                        }
                    }, 30000) // 30 seconds default
                };

                resolve();
            } catch (error) {
                console.error('Error loading Coub:', error);
                resolve(); // Resolve anyway to not block playlist
            }
        });
    }

    /**
     * Wait for YouTube API to be ready
     */
    waitForYouTubeAPI() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.youtubeReady) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.error('YouTube API load timeout');
                resolve();
            }, 10000);
        });
    }

    /**
     * Clear the current player
     */
    clearPlayer() {
        if (this.currentPlayer) {
            try {
                if (this.currentPlatform === 'youtube' && this.currentPlayer.destroy) {
                    this.currentPlayer.destroy();
                } else if (this.currentPlatform === 'vimeo' && this.currentPlayer.destroy) {
                    this.currentPlayer.destroy();
                } else if (this.currentPlatform === 'coub' && this.currentPlayer.timeout) {
                    clearTimeout(this.currentPlayer.timeout);
                }
            } catch (error) {
                console.error('Error destroying player:', error);
            }
            this.currentPlayer = null;
        }

        this.currentPlatform = null;
    }

    /**
     * Set callback for when video ends
     * @param {Function} callback - Callback function
     */
    onVideoEnd(callback) {
        this.onVideoEndCallback = callback;
    }

    /**
     * Show placeholder
     */
    showPlaceholder() {
        this.clearPlayer();
        this.container.innerHTML = `
            <div class="placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <p>Add videos to your playlist to start playing</p>
            </div>
        `;
    }

    /**
     * Get current platform
     * @returns {string|null} - Current platform name
     */
    getCurrentPlatform() {
        return this.currentPlatform;
    }
}

// Export the VideoPlayer class
export default VideoPlayer;
