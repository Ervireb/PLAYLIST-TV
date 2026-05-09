/**
 * Video Player Module
 * Handles video playback, platform detection, and API integration
 * 
 * Changes implemented:
 * - #6: Video Sound Only When Lightbox is Active
 * - #7: YouTube Shorts Support
 * - #9: Fix Auto-Play Issue (fix_5-5_AP)
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
        this.coubAutoplayRetries = 0;
        this.maxAutoplayRetries = 3;
        this.defaultCoubTimer = 30; // Default 30 seconds for Coub videos
        this.isPlaying = false; // fix_5-5_AP - Track whether playback is user-intended
        this.lightboxActive = false; // Change #6: Track lightbox state for sound control
        
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
            console.log('Coub timer updated to:', value, 'seconds');
            return true;
        } catch (error) {
            console.error('Could not save to localStorage:', error);
            return false;
        }
    }

    /**
     * Open lightbox - unmute video
     * Change #6: Video Sound Only When Lightbox is Active
     */
    openLightbox() {
        this.lightboxActive = true;
        this.isPlaying = true; // fix_5-5_AP - User intends to play
        this.unmuteCurrentVideo();
    }

    /**
     * Close lightbox - mute video
     * Change #6: Video Sound Only When Lightbox is Active
     */
    closeLightbox() {
        this.lightboxActive = false;
        this.isPlaying = false; // fix_5-5_AP - User closed lightbox, stop playback intent
        this.muteCurrentVideo();
    }

    /**
     * Unmute the currently playing video
     * Change #6: Platform-specific unmute logic
     */
    unmuteCurrentVideo() {
        try {
            if (this.currentPlatform === 'youtube' && this.currentPlayer) {
                if (typeof this.currentPlayer.unMute === 'function') {
                    this.currentPlayer.unMute();
                    this.currentPlayer.setVolume(100);
                    console.log('YouTube video unmuted');
                }
            } else if (this.currentPlatform === 'vimeo' && this.currentPlayer) {
                if (typeof this.currentPlayer.setVolume === 'function') {
                    this.currentPlayer.setVolume(1);
                    console.log('Vimeo video unmuted');
                }
            } else if (this.currentPlatform === 'coub' && this.currentPlayer && this.currentPlayer.iframe) {
                // Coub: try postMessage to unmute
                try {
                    this.currentPlayer.iframe.contentWindow.postMessage(
                        JSON.stringify({ type: 'unmute' }), '*'
                    );
                    console.log('Coub unmute attempted');
                } catch (e) {
                    console.log('Coub unmute cross-origin blocked (expected)');
                }
            }
        } catch (error) {
            console.warn('Could not unmute video:', error.message);
        }
    }

    /**
     * Mute the currently playing video
     * Change #6: Platform-specific mute logic
     */
    muteCurrentVideo() {
        try {
            if (this.currentPlatform === 'youtube' && this.currentPlayer) {
                if (typeof this.currentPlayer.mute === 'function') {
                    this.currentPlayer.mute();
                    console.log('YouTube video muted');
                }
            } else if (this.currentPlatform === 'vimeo' && this.currentPlayer) {
                if (typeof this.currentPlayer.setVolume === 'function') {
                    this.currentPlayer.setVolume(0);
                    console.log('Vimeo video muted');
                }
            } else if (this.currentPlatform === 'coub' && this.currentPlayer && this.currentPlayer.iframe) {
                // Coub: try postMessage to mute
                try {
                    this.currentPlayer.iframe.contentWindow.postMessage(
                        JSON.stringify({ type: 'mute' }), '*'
                    );
                    console.log('Coub mute attempted');
                } catch (e) {
                    console.log('Coub mute cross-origin blocked (expected)');
                }
            }
        } catch (error) {
            console.warn('Could not mute video:', error.message);
        }
    }

    /**
     * Enter fullscreen mode
     * @param {HTMLElement} element - Element to make fullscreen
     */
    enterFullscreen(element) {
        if (!element) {
            element = this.container;
        }

        console.log('Attempting to enter fullscreen mode...');

        try {
            if (element.requestFullscreen) {
                element.requestFullscreen().catch(err => {
                    console.error('Fullscreen request failed:', err);
                });
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            } else {
                console.warn('Fullscreen API not supported by this browser');
            }
        } catch (error) {
            console.error('Error entering fullscreen:', error);
        }
    }

    /**
     * Parse video URL and detect platform
     * Change #7: Added YouTube Shorts support
     * @param {string} url - Video URL
     * @returns {Object|null} - Parsed video info or null if invalid
     */
    parseUrl(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        url = url.trim();

        // YouTube patterns - Change #7: Added Shorts pattern
        const youtubePatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/ // Change #7: YouTube Shorts support
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
        console.log('Loading video, fullscreen state:', shouldReenterFullscreen);

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
                console.log('Re-entering fullscreen mode after video load...');
                setTimeout(() => {
                    if (this.isFullscreen()) {
                        console.log('Already in fullscreen, skipping re-entry');
                    } else {
                        this.enterFullscreen();
                    }
                }, 800);
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

                // Change #6: Start muted, unmute only when lightbox is active
                const shouldMute = !this.lightboxActive;

                // Create YouTube player
                this.currentPlayer = new YT.Player(iframe.id, {
                    videoId: videoId,
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        autoplay: 1,
                        mute: shouldMute ? 1 : 0, // Change #6: Mute based on lightbox state
                        rel: 0,
                        modestbranding: 1
                    },
                    events: {
                        onReady: (event) => {
                            console.log('YouTube player ready');
                            // Change #6: Only unmute if lightbox is active
                            if (this.lightboxActive) {
                                setTimeout(() => {
                                    try {
                                        event.target.unMute();
                                        event.target.setVolume(100);
                                    } catch (error) {
                                        console.log('Could not unmute (autoplay policy):', error.message);
                                    }
                                }, 500);
                            }

                            // fix_5-5_AP - Set isPlaying to true on ready
                            this.isPlaying = true; // fix_5-5_AP

                            // Implement autoplay detection and retry mechanism
                            this.checkYouTubeAutoplay(event.target);

                            resolve();
                        },
                        onStateChange: (event) => {
                            // YT.PlayerState.ENDED = 0
                            if (event.data === YT.PlayerState.ENDED) {
                                console.log('YouTube video ended');
                                // fix_5-5_AP - Check isPlaying before triggering end callback
                                if (this.isPlaying && this.onVideoEndCallback) { // fix_5-5_AP
                                    this.onVideoEndCallback();
                                }
                            }
                            // YT.PlayerState.PLAYING = 1
                            if (event.data === YT.PlayerState.PLAYING) {
                                console.log('YouTube video is playing');
                                this.isPlaying = true; // fix_5-5_AP
                                this.youtubeAutoplayRetries = 0; // Reset retries on successful play
                            }
                            // YT.PlayerState.PAUSED = 2
                            if (event.data === YT.PlayerState.PAUSED) {
                                console.log('YouTube video paused by user');
                                this.isPlaying = false; // fix_5-5_AP - User paused, stop auto-play intent
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
     * fix_5-5_AP - Added isPlaying check before retry
     * @param {Object} player - YouTube player instance
     */
    checkYouTubeAutoplay(player) {
        // Wait 2.5 seconds then check if video is playing
        setTimeout(() => {
            try {
                // fix_5-5_AP - Don't retry if user has paused
                if (!this.isPlaying) { // fix_5-5_AP
                    console.log('Skipping autoplay retry - user paused'); // fix_5-5_AP
                    return; // fix_5-5_AP
                } // fix_5-5_AP

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
                // Change #6: Start muted based on lightbox state
                const shouldMute = !this.lightboxActive;
                
                // Create iframe element
                const iframe = document.createElement('iframe');
                iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=${shouldMute ? 1 : 0}`;
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
                        this.isPlaying = true; // fix_5-5_AP
                        // Change #6: Only unmute if lightbox is active
                        if (this.lightboxActive) {
                            setTimeout(() => {
                                this.currentPlayer.setVolume(1).catch(() => {
                                    console.log('Could not unmute Vimeo (autoplay policy)');
                                });
                            }, 500);
                        }
                        resolve();
                    });

                    this.currentPlayer.on('ended', () => {
                        console.log('Vimeo video ended');
                        // fix_5-5_AP - Check isPlaying before triggering end callback
                        if (this.isPlaying && this.onVideoEndCallback) { // fix_5-5_AP
                            this.onVideoEndCallback();
                        }
                    });

                    // fix_5-5_AP - Track pause events from Vimeo
                    this.currentPlayer.on('pause', () => { // fix_5-5_AP
                        console.log('Vimeo video paused by user'); // fix_5-5_AP
                        this.isPlaying = false; // fix_5-5_AP
                    }); // fix_5-5_AP

                    // fix_5-5_AP - Track play events from Vimeo
                    this.currentPlayer.on('play', () => { // fix_5-5_AP
                        console.log('Vimeo video playing'); // fix_5-5_AP
                        this.isPlaying = true; // fix_5-5_AP
                    }); // fix_5-5_AP

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
                // Reset autoplay retry counter
                this.coubAutoplayRetries = 0;

                // Change #6: Start muted based on lightbox state
                const shouldMute = !this.lightboxActive;

                // Create iframe element for Coub
                const iframe = document.createElement('iframe');
                iframe.src = `https://coub.com/embed/${videoId}?muted=${shouldMute}&autoplay=true&originalSize=false&startWithHD=true`;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'autoplay; fullscreen';
                iframe.allowFullscreen = true;

                this.container.innerHTML = '';
                this.container.appendChild(iframe);

                console.log('Coub video loaded');
                this.isPlaying = true; // fix_5-5_AP
                
                // Get configurable timer value from localStorage
                const timerDuration = this.getCoubTimer();
                console.log(`Coub timer set to ${timerDuration} seconds`);
                
                // Implement autoplay workaround with click simulation
                this.checkCoubAutoplay(iframe);
                
                // Coub doesn't have a reliable end event API
                // Use configurable timer value
                this.currentPlayer = {
                    type: 'coub',
                    iframe: iframe,
                    timeout: setTimeout(() => {
                        console.log(`Coub video timeout after ${timerDuration} seconds (assumed ended)`);
                        // fix_5-5_AP - Check isPlaying before advancing
                        if (this.isPlaying && this.onVideoEndCallback) { // fix_5-5_AP
                            this.onVideoEndCallback();
                        }
                    }, timerDuration * 1000)
                };

                resolve();
            } catch (error) {
                console.error('Error loading Coub:', error);
                resolve(); // Resolve anyway to not block playlist
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
                // fix_5-5_AP - Don't retry if user has paused
                if (!this.isPlaying) return; // fix_5-5_AP

                if (this.coubAutoplayRetries < this.maxAutoplayRetries) {
                    try {
                        console.log(`Coub autoplay attempt ${index + 1} at ${delay}ms`);
                        
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        iframe.dispatchEvent(clickEvent);
                        
                        try {
                            iframe.contentWindow.postMessage('play', '*');
                        } catch (crossOriginError) {
                            console.log('Cross-origin postMessage blocked (expected)');
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
