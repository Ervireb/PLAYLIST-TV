/**
 * Video Player Module
 * Handles video playback, platform detection, and API integration
 * 
 * Supported platforms:
 * - YouTube (standard videos + Shorts)
 * - Vimeo
 * - Coub
 * - TikTok
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
        this.defaultShortVideoTimer = 30; // Default 30 seconds for short video platforms (Coub, TikTok)
        
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
     * Get short video timer setting from localStorage (used for Coub and TikTok)
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
        return this.defaultShortVideoTimer;
    }

    /**
     * Set short video timer setting in localStorage
     * @param {number} seconds - Timer duration in seconds
     * @returns {boolean} - Success status
     */
    setCoubTimer(seconds) {
        try {
            const value = parseInt(seconds, 10);
            if (isNaN(value) || value < 1 || value > 99999) {
                console.error('Invalid timer value:', seconds);
                return false;
            }
            localStorage.setItem('coubTimer', value.toString());
            console.log('Short video timer updated to:', value, 'seconds');
            return true;
        } catch (error) {
            console.error('Could not save to localStorage:', error);
            return false;
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
     * Supports: YouTube, YouTube Shorts, Vimeo, Coub, TikTok
     * @param {string} url - Video URL
     * @returns {Object|null} - Parsed video info or null if invalid
     */
    parseUrl(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        url = url.trim();

        // YouTube Shorts patterns (check before standard YouTube)
        const youtubeShortsPatterns = [
            /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of youtubeShortsPatterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: 'youtube',
                    videoId: match[1],
                    url: url
                };
            }
        }

        // YouTube standard patterns
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

        // TikTok patterns
        // Standard: https://www.tiktok.com/@username/video/VIDEO_ID
        const tiktokStandardPattern = /(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@[^\/]+\/video\/(\d+)/;
        const tiktokStandardMatch = url.match(tiktokStandardPattern);
        if (tiktokStandardMatch) {
            return {
                platform: 'tiktok',
                videoId: tiktokStandardMatch[1],
                url: url
            };
        }

        // TikTok mobile: https://m.tiktok.com/v/VIDEO_ID
        const tiktokMobilePattern = /(?:https?:\/\/)?m\.tiktok\.com\/v\/(\d+)/;
        const tiktokMobileMatch = url.match(tiktokMobilePattern);
        if (tiktokMobileMatch) {
            return {
                platform: 'tiktok',
                videoId: tiktokMobileMatch[1],
                url: url
            };
        }

        // TikTok short links: https://vm.tiktok.com/SHORT_CODE/ or https://www.tiktok.com/t/SHORT_CODE/
        const tiktokShortPatterns = [
            /(?:https?:\/\/)?vm\.tiktok\.com\/([A-Za-z0-9]+)\/?/,
            /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/([A-Za-z0-9]+)\/?/
        ];

        for (const pattern of tiktokShortPatterns) {
            const match = url.match(pattern);
            if (match) {
                // For short links, we use the short code as videoId
                // The embed will use the original URL via oEmbed or redirect
                return {
                    platform: 'tiktok',
                    videoId: match[1],
                    url: url,
                    isShortLink: true
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
                case 'tiktok':
                    await this.loadTikTok(video.videoId, video.isShortLink);
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
        setTimeout(() => {
            try {
                const state = player.getPlayerState();
                if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
                    console.log('YouTube autoplay failed, attempting to play manually...');
                    
                    if (this.youtubeAutoplayRetries < this.maxAutoplayRetries) {
                        this.youtubeAutoplayRetries++;
                        player.playVideo();
                        
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

                // Create iframe element for Coub
                const iframe = document.createElement('iframe');
                iframe.src = `https://coub.com/embed/${videoId}?muted=false&autoplay=true&originalSize=false&startWithHD=true`;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'autoplay; fullscreen';
                iframe.allowFullscreen = true;

                this.container.innerHTML = '';
                this.container.appendChild(iframe);

                console.log('Coub video loaded');
                
                // Get configurable timer value from localStorage
                const timerDuration = this.getCoubTimer();
                console.log(`Coub timer set to ${timerDuration} seconds`);
                
                // Implement autoplay workaround
                this.checkCoubAutoplay(iframe);
                
                // Set a timeout to trigger next video
                this.currentPlayer = {
                    type: 'coub',
                    iframe: iframe,
                    timeout: setTimeout(() => {
                        console.log(`Coub video timeout after ${timerDuration} seconds (assumed ended)`);
                        if (this.onVideoEndCallback) {
                            this.onVideoEndCallback();
                        }
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
     * Load TikTok video
     * Uses TikTok embed iframe: https://www.tiktok.com/embed/v2/VIDEO_ID
     * @param {string} videoId - TikTok video ID or short code
     * @param {boolean} isShortLink - Whether this is a short link (vm.tiktok.com or /t/)
     */
    async loadTikTok(videoId, isShortLink = false) {
        return new Promise((resolve) => {
            try {
                // Create iframe element for TikTok
                const iframe = document.createElement('iframe');
                
                // For short links, we use the short code directly in embed URL
                // TikTok embed v2 format: https://www.tiktok.com/embed/v2/VIDEO_ID
                const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
                
                iframe.src = embedUrl;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.frameBorder = '0';
                iframe.allow = 'autoplay; fullscreen; encrypted-media';
                iframe.allowFullscreen = true;
                iframe.style.borderRadius = '8px';

                this.container.innerHTML = '';
                this.container.appendChild(iframe);

                console.log('TikTok video loaded:', videoId);
                
                // Get configurable timer value (shared with Coub as "Short Video Duration")
                const timerDuration = this.getCoubTimer();
                console.log(`TikTok timer set to ${timerDuration} seconds`);
                
                // TikTok embeds auto-loop, use timer to advance to next video
                this.currentPlayer = {
                    type: 'tiktok',
                    iframe: iframe,
                    timeout: setTimeout(() => {
                        console.log(`TikTok video timeout after ${timerDuration} seconds (advancing to next)`);
                        if (this.onVideoEndCallback) {
                            this.onVideoEndCallback();
                        }
                    }, timerDuration * 1000)
                };

                resolve();
            } catch (error) {
                console.error('Error loading TikTok:', error);
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
                } else if (this.currentPlatform === 'tiktok' && this.currentPlayer.timeout) {
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
