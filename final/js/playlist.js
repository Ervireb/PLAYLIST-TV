/**
 * Playlist Management Module
 * Handles adding, removing, and managing video playlist state
 */

class Playlist {
    constructor() {
        this.videos = [];
        this.currentIndex = -1;
        this.loopMode = true; // Change #3: Loop Mode Active by Default
        this.shuffleMode = false;
        this.shuffledIndices = [];
        this.shufflePosition = -1;
    }

    /**
     * Add a video to the playlist
     * Change #1: Allows duplicates - no longer filters out existing URLs
     * @param {Object} video - Video object with url and platform properties
     * @returns {boolean} - Success status
     */
    add(video) {
        if (!video || !video.url || !video.platform) {
            console.error('Invalid video object');
            return false;
        }

        // Change #1: Removed duplicate check - allow all valid URLs
        this.videos.push({
            url: video.url,
            platform: video.platform,
            videoId: video.videoId,
            addedAt: new Date().toISOString()
        });

        // Regenerate shuffle indices if shuffle mode is active
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

        // Regenerate shuffle indices if shuffle mode is active
        if (this.shuffleMode) {
            this.generateShuffledIndices();
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
     * @returns {Object|null} - Next video object or null if none available
     */
    getNext() {
        if (this.videos.length === 0) {
            return null;
        }

        if (this.shuffleMode) {
            return this.getNextShuffled();
        }

        // If no video is currently playing, start from the beginning
        if (this.currentIndex === -1) {
            this.currentIndex = 0;
        } else {
            // Move to next video
            this.currentIndex++;
            
            // If we've reached the end
            if (this.currentIndex >= this.videos.length) {
                // If loop mode is enabled, restart from beginning
                if (this.loopMode) {
                    this.currentIndex = 0;
                } else {
                    // Otherwise, return null (playlist finished)
                    this.currentIndex = this.videos.length - 1;
                    return null;
                }
            }
        }

        return this.videos[this.currentIndex];
    }

    /**
     * Get next video in shuffled order
     * @returns {Object|null} - Next video object or null
     */
    getNextShuffled() {
        if (this.shuffledIndices.length === 0) {
            this.generateShuffledIndices();
        }

        this.shufflePosition++;

        if (this.shufflePosition >= this.shuffledIndices.length) {
            if (this.loopMode) {
                this.generateShuffledIndices();
                this.shufflePosition = 0;
            } else {
                this.shufflePosition = this.shuffledIndices.length - 1;
                return null;
            }
        }

        this.currentIndex = this.shuffledIndices[this.shufflePosition];
        return this.videos[this.currentIndex];
    }

    /**
     * Generate shuffled indices using Fisher-Yates algorithm
     */
    generateShuffledIndices() {
        this.shuffledIndices = Array.from({ length: this.videos.length }, (_, i) => i);
        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledIndices[i], this.shuffledIndices[j]] = [this.shuffledIndices[j], this.shuffledIndices[i]];
        }
        this.shufflePosition = -1;
    }

    /**
     * Set shuffle mode
     * @param {boolean} enabled - Enable or disable shuffle mode
     */
    setShuffleMode(enabled) {
        this.shuffleMode = enabled;
        if (enabled) {
            this.generateShuffledIndices();
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
        if (this.loopMode) return this.videos.length > 0;
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
