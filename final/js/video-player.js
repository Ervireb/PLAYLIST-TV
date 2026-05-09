/**
 * Video Player Module
 * Handles video playback, platform detection, API integration,
 * and lightbox-based video display (replaces fullscreen).
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
        this.youtubeAutoplayRetries = 0;
        this.coubAutoplayRetries = 0;
        this.maxAutoplayRetries = 3;
        this.defaultCoubTimer = 30;

        // Lightbox state
        this.lightboxOpen = false;
        this.lightboxOverlay = document.getElementById('lightboxOverlay');
        this.lightboxContent = document.getElementById('lightboxContent');
        this.lightboxClose = document.getElementById('lightboxClose');

        // Initialize YouTube API
        this.initYouTubeAPI();

        // Initialize lightbox event listeners
        this.initLightboxListeners();
    }

    /**
     * Initialize YouTube IFrame API
     */
    initYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            this.youtubeReady = true;
            return;
        }

        window.onYouTubeIframeAPIReady = () => {
            this.youtubeReady = true;
            console.log('YouTube IFrame API ready');
        };
    }

    /**
     * Initialize lightbox event listeners
     */
    initLightboxListeners() {
        // Close button
        if (this.lightboxClose) {
            this.lightboxClose.addEventListener('click', () => {
                this.closeLightbox();
            });
        }

        // ESC key closes lightbox
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.lightboxOpen) {
                this.closeLightbox();
            }
        });

        // Click on overlay background closes lightbox
        if (this.lightboxOverlay) {
            this.lightboxOverlay.addEventListener('click', (e) => {
                if (e.target === this.lightboxOverlay) {
                    this.closeLightbox();
                }
            });
        }
    }

    /**
     * Open the lightbox overlay
     */
    openLightbox() {
        if (this.lightboxOverlay) {
            this.lightboxOverlay.classList.add('active');
            this.lightboxOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close the lightbox overlay
     * Pauses playback and remembers position
     */
    closeLightbox() {
        if (this.lightboxOverlay) {
            this.lightboxOverlay.classList.remove('active');
            this.lightboxOpen = false;
            document.body.style.overflow = '';

            // Pause current video if playing
            this.pauseCurrentVideo();
        }
    }

    /**
     * Pause the currently playing video
     */
    pauseCurrentVideo() {
        try {
            if (this.currentPlatform === 'youtube' && this.currentPlayer && this.currentPlayer.pauseVideo) {
                this.currentPlayer.pauseVideo();
            } else if (this.currentPlatform === 'vimeo' && this.currentPlayer && this.currentPlayer.pause) {
                this.currentPlayer.pause();
            } else if (this.currentPlatform === 'coub' && this.currentPlayer && this.currentPlayer.timeout) {
                // Pause the coub timer
                clearTimeout(this.currentPlayer.timeout);
                this.currentPlayer.timeout = null;
            }
        } catch (error) {
            console.warn('Could not pause video:', error);
        }
    }

    /**
     * Resume the currently paused video in lightbox
     */
    resumeInLightbox() {
        this.openLightbox();

        try {
            if (this.currentPlatform === 'youtube' && this.currentPlayer && this.currentPlayer.playVideo) {
                this.currentPlayer.playVideo();
            } else if (this.currentPlatform === 'vimeo' && this.currentPlayer && this.currentPlayer.play) {
                this.currentPlayer.play();
            } else if (this.currentPlatform === 'coub' && this.currentPlayer) {
                // Restart coub timer with remaining time or default
                const timerDuration = this.getCoubTimer();
                this.currentPlayer.timeout = setTimeout(() => {
                    if (this.onVideoEndCallback) {
                        this.onVideoEndCallback();
                    }
                }, timerDuration * 1000);
            }
        } catch (error) {
            console.warn('Could not resume video:', error);
        }
    }

    /**
     * Check if lightbox is currently open
     * @returns {boolean}
     */
    isLightboxOpen() {
        return this.lightboxOpen;
    }

    /**
     * Get Coub timer setting from localStorage
     * @returns {number} - Timer duration in seconds
     */
    getCoubTimer() {
        try {
            const stored = localStorage.getItem('coubTimer');
            if (stored) {
                const value = parseInt(stored, 10);
                if (!isNaN(value) && value >= 1 && value <= 99999) {
                    return value;
                }
            }
        } catch (error) {
            console.warn('Could not access localStorage:', error);
        }
        return this.defaultCoubTimer;
    }

    /**
     * Set Coub timer setting in localStorage
     * @param {number} seconds - Timer duration in seconds
     * @returns {boolean} - Success status
     */
    setCoubTimer(seconds) {
        try {
            const value = parseInt(seconds, 10);
            if (isNaN(value) || value < 1 || value > 99999) {
                console.error('Invalid Coub timer value:', seconds);
                return false;
            }
            localStorage.setItem('coubTimer', value.toString());
            return true;
        } catch (error) {
            console.error('Could not save to localStorage:', error);
            return false;
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
     * Load and play a video in the lightbox
     * @param {Object} video - Video object with platform and videoId
     * @returns {Promise<boolean>} - Success status
     */
    async loadVideo(video) {
        if (!video || !video.platform || !video.videoId) {
            console.error('Invalid video object');
            return false;
        }

        // Clear current player
        this.clearPlayer();

        this.currentPlatform = video.platform;

        // Open lightbox
        this.openLightbox();

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

            return true;
        } catch (error) {
            console.error('Error loading video:', error);
            return false;
        }
    }

    /**
     * Load YouTube video into lightbox
     * @param {string} videoId - YouTube video ID
     */
    async loadYouTube(videoId) {
        if (!this.youtubeReady) {
            await this.waitForYouTubeAPI();
        }

        this.youtubeAutoplayRetries = 0;

        return new Promise((resolve, reject) => {
            try {
                const playerDiv = document.createElement('div');
                playerDiv.id = 'youtube-player-' + Date.now();
                this.lightboxContent.innerHTML = '';
                this.lightboxContent.appendChild(playerDiv);

                this.currentPlayer = new YT.Player(playerDiv.id, {
                    videoId: videoId,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: 1,
                        mute: 1,
                        rel: 0,
                        modestbranding: 1
                    },
                    events: {
                        onReady: (event) => {
                            // Unmute after short delay
                            setTimeout(() => {
                                try {
                                    event.target.unMute();
                                } catch (error) {
                                    console.log('Could not unmute (autoplay policy)');
                                }
                            }, 1000);

                            this.checkYouTubeAutoplay(event.target);
                            resolve();
                        },
                        onStateChange: (event) => {
                            if (event.data === YT.PlayerState.ENDED) {
                                this.handleVideoEnd();
                            }
                            if (event.data === YT.PlayerState.PLAYING) {
                                this.youtubeAutoplayRetries = 0;
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
        setTimeout(() => {
            try {
                const state = player.getPlayerState();
                if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
                    if (this.youtubeAutoplayRetries < this.maxAutoplayRetries) {
                        this.youtubeAutoplayRetries++;
                        player.playVideo();
                        if (this.youtubeAutoplayRetries < this.maxAutoplayRetries) {
                            this.checkYouTubeAutoplay(player);
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking YouTube autoplay:', error);
            }
        }, 2500);
    }

    /**
     * Load Vimeo video into lightbox
     * @param {string} videoId - Vimeo video ID
     */
    async loadVimeo(videoId) {
        return new Promise((resolve, reject) => {
            try {
                const iframe = document.createElement('iframe');
                iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'autoplay; fullscreen; picture-in-picture';
                iframe.allowFullscreen = true;

                this.lightboxContent.innerHTML = '';
                this.lightboxContent.appendChild(iframe);

                if (window.Vimeo && window.Vimeo.Player) {
                    this.currentPlayer = new Vimeo.Player(iframe);

                    this.currentPlayer.on('loaded', () => {
                        setTimeout(() => {
                            this.currentPlayer.setMuted(false).catch(() => {
                                console.log('Could not unmute Vimeo (autoplay policy)');
                            });
                        }, 1000);
                        resolve();
                    });

                    this.currentPlayer.on('ended', () => {
                        this.handleVideoEnd();
                    });

                    this.currentPlayer.on('error', (error) => {
                        console.error('Vimeo player error:', error);
                        reject(error);
                    });
                } else {
                    console.warn('Vimeo Player API not available, using basic iframe');
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Load Coub video into lightbox
     * @param {string} videoId - Coub video ID
     */
    async loadCoub(videoId) {
        return new Promise((resolve) => {
            try {
                this.coubAutoplayRetries = 0;

                const iframe = document.createElement('iframe');
                iframe.src = `https://coub.com/embed/${videoId}?muted=false&autoplay=true&originalSize=false&startWithHD=true`;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'autoplay; fullscreen';
                iframe.allowFullscreen = true;

                this.lightboxContent.innerHTML = '';
                this.lightboxContent.appendChild(iframe);

                const timerDuration = this.getCoubTimer();

                // Coub autoplay workaround
                this.checkCoubAutoplay(iframe);

                // Set timer for Coub (no reliable end event)
                this.currentPlayer = {
                    type: 'coub',
                    iframe: iframe,
                    timeout: setTimeout(() => {
                        this.handleVideoEnd();
                    }, timerDuration * 1000)
                };

                resolve();
            } catch (error) {
                console.error('Error loading Coub:', error);
                resolve();
            }
        });
    }

    /**
     * Check if Coub video is autoplaying and retry if needed
     * @param {HTMLIFrameElement} iframe - Coub iframe element
     */
    checkCoubAutoplay(iframe) {
        const clickAttempts = [500, 1500, 2500];

        clickAttempts.forEach((delay, index) => {
            setTimeout(() => {
                if (this.coubAutoplayRetries < this.maxAutoplayRetries) {
                    try {
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        iframe.dispatchEvent(clickEvent);

                        try {
                            iframe.contentWindow.postMessage('play', '*');
                        } catch (crossOriginError) {
                            // Expected for cross-origin iframes
                        }

                        this.coubAutoplayRetries++;
                    } catch (error) {
                        console.warn('Coub autoplay trigger failed:', error.message);
                    }
                }
            }, delay);
        });
    }

    /**
     * Handle video end with a small delay for smooth transition
     */
    handleVideoEnd() {
        if (this.onVideoEndCallback && this.lightboxOpen) {
            // 500ms delay for smooth transition between videos
            setTimeout(() => {
                this.onVideoEndCallback();
            }, 500);
        }
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

        // Clear lightbox content
        if (this.lightboxContent) {
            this.lightboxContent.innerHTML = '';
        }
    }

    /**
     * Set callback for when video ends
     * @param {Function} callback - Callback function
     */
    onVideoEnd(callback) {
        this.onVideoEndCallback = callback;
    }

    /**
     * Show placeholder in the video container (not lightbox)
     * This is handled by the app.js via play button states
     */
    showPlaceholder() {
        this.clearPlayer();
        if (this.lightboxOpen) {
            this.closeLightbox();
        }
    }

    /**
     * Get current platform
     * @returns {string|null} - Current platform name
     */
    getCurrentPlatform() {
        return this.currentPlatform;
    }

    /**
     * Check if a video is currently loaded
     * @returns {boolean}
     */
    hasVideo() {
        return this.currentPlayer !== null;
    }
}

export default VideoPlayer;
