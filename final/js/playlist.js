/**
 * Playlist Management Module
 * Handles adding, removing, managing video playlist state,
 * loop mode, and shuffle functionality.
 */

class Playlist {
    constructor() {
        this.videos = [];
        this.currentIndex = -1;
        this.loopMode = false;
        this.shuffleMode = false;
        this.shuffledIndices = [];
        this.shufflePosition = -1; // Position within shuffled order
    }

    /**
     * Add a video to the playlist
     * @param {Object} video - Video object with url and platform properties
     * @returns {boolean} - Success status
     */
    add(video) {
        if (!video || !video.url || !video.platform) {
            console.error('Invalid video object');
            return false;
        }

        // Check for duplicates
        const exists = this.videos.some(v => v.url === video.url);
        if (exists) {
            console.warn('Video already exists in playlist');
            return false;
        }

        this.videos.push({
            url: video.url,
            platform: video.platform,
            videoId: video.videoId,
            addedAt: new Date().toISOString()
        });

        // Re-shuffle if shuffle mode is active
        if (this.shuffleMode) {
            this.generateShuffledIndices();
        }

        return true;
    }

    /**
     * Remove a video from the playlist by index
     * @param {number} index - Index of video to remove
     * @returns {boolean} - Success status
     */
    remove(index) {
        if (index < 0 || index >= this.videos.length) {
            console.error('Invalid index');
            return false;
        }

        // If removing the currently playing video, adjust currentIndex
        if (index === this.currentIndex) {
            this.currentIndex = -1;
        } else if (index < this.currentIndex) {
            this.currentIndex--;
        }

        this.videos.splice(index, 1);

        // Re-shuffle if shuffle mode is active
        if (this.shuffleMode) {
            this.generateShuffledIndices();
            // Reset shuffle position if needed
            if (this.shufflePosition >= this.shuffledIndices.length) {
                this.shufflePosition = -1;
            }
        }

        return true;
    }

    /**
     * Clear all videos from the playlist
     */
    clear() {
        this.videos = [];
        this.currentIndex = -1;
        this.shuffledIndices = [];
        this.shufflePosition = -1;
    }

    /**
     * Get the next video in the playlist
     * Respects shuffle mode when enabled
     * @returns {Object|null} - Next video object or null if none available
     */
    getNext() {
        if (this.videos.length === 0) {
            return null;
        }

        if (this.shuffleMode) {
            return this.getNextShuffled();
        }

        // Normal (non-shuffle) mode
        if (this.currentIndex === -1) {
            this.currentIndex = 0;
        } else {
            this.currentIndex++;

            if (this.currentIndex >= this.videos.length) {
                if (this.loopMode) {
                    this.currentIndex = 0;
                } else {
                    this.currentIndex = this.videos.length - 1;
                    return null;
                }
            }
        }

        return this.videos[this.currentIndex];
    }

    /**
     * Get the next video in shuffled order
     * Uses Fisher-Yates shuffled indices array
     * @returns {Object|null} - Next video object or null if none available
     */
    getNextShuffled() {
        if (this.shuffledIndices.length === 0) {
            this.generateShuffledIndices();
        }

        this.shufflePosition++;

        if (this.shufflePosition >= this.shuffledIndices.length) {
            if (this.loopMode) {
                // Re-shuffle for next round
                this.generateShuffledIndices();
                this.shufflePosition = 0;
            } else {
                this.shufflePosition = this.shuffledIndices.length - 1;
                return null;
            }
        }

        const actualIndex = this.shuffledIndices[this.shufflePosition];
        this.currentIndex = actualIndex;
        return this.videos[actualIndex];
    }

    /**
     * Generate shuffled indices using Fisher-Yates algorithm
     */
    generateShuffledIndices() {
        this.shuffledIndices = [];
        for (let i = 0; i < this.videos.length; i++) {
            this.shuffledIndices.push(i);
        }

        // Fisher-Yates shuffle
        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.shuffledIndices[i];
            this.shuffledIndices[i] = this.shuffledIndices[j];
            this.shuffledIndices[j] = temp;
        }
    }

    /**
     * Get the current video
     * @returns {Object|null} - Current video object or null
     */
    getCurrent() {
        if (this.currentIndex === -1 || this.currentIndex >= this.videos.length) {
            return null;
        }
        return this.videos[this.currentIndex];
    }

    /**
     * Get all videos in the playlist
     * @returns {Array} - Array of video objects
     */
    getAll() {
        return [...this.videos];
    }

    /**
     * Get the total number of videos
     * @returns {number} - Number of videos in playlist
     */
    getCount() {
        return this.videos.length;
    }

    /**
     * Get the current index
     * @returns {number} - Current video index
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * Check if playlist is empty
     * @returns {boolean} - True if empty
     */
    isEmpty() {
        return this.videos.length === 0;
    }

    /**
     * Check if there are more videos to play
     * @returns {boolean} - True if more videos available
     */
    hasNext() {
        if (this.shuffleMode) {
            return this.shufflePosition < this.shuffledIndices.length - 1;
        }
        return this.currentIndex < this.videos.length - 1;
    }

    /**
     * Reset the current index to start from beginning
     */
    reset() {
        this.currentIndex = -1;
        this.shufflePosition = -1;
    }

    /**
     * Set loop mode
     * @param {boolean} enabled - Enable or disable loop mode
     */
    setLoopMode(enabled) {
        this.loopMode = enabled;
    }

    /**
     * Get loop mode status
     * @returns {boolean} - Current loop mode status
     */
    getLoopMode() {
        return this.loopMode;
    }

    /**
     * Set shuffle mode
     * @param {boolean} enabled - Enable or disable shuffle mode
     */
    setShuffleMode(enabled) {
        this.shuffleMode = enabled;
        if (enabled) {
            this.generateShuffledIndices();
            this.shufflePosition = -1;
        } else {
            this.shuffledIndices = [];
            this.shufflePosition = -1;
        }
    }

    /**
     * Get shuffle mode status
     * @returns {boolean} - Current shuffle mode status
     */
    getShuffleMode() {
        return this.shuffleMode;
    }

    /**
     * Set current index (for click-to-play functionality)
     * @param {number} index - Index to set as current
     * @returns {boolean} - Success status
     */
    setCurrentIndex(index) {
        if (index < -1 || index >= this.videos.length) {
            console.error('Invalid index');
            return false;
        }
        this.currentIndex = index;

        // Update shuffle position to match
        if (this.shuffleMode && index >= 0) {
            const pos = this.shuffledIndices.indexOf(index);
            if (pos !== -1) {
                this.shufflePosition = pos;
            }
        }

        return true;
    }

    /**
     * Get video at specific index
     * @param {number} index - Index of video to get
     * @returns {Object|null} - Video object or null
     */
    getVideoAt(index) {
        if (index < 0 || index >= this.videos.length) {
            return null;
        }
        return this.videos[index];
    }
}

// Export the Playlist class
export default Playlist;
