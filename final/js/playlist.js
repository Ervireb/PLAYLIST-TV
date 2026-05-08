/**
 * Playlist Management Module
 * Handles adding, removing, and managing video playlist state
 */

class Playlist {
    constructor() {
        this.videos = [];
        this.currentIndex = -1;
        this.loopMode = false;
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
        return true;
    }

    /**
     * Clear all videos from the playlist
     */
    clear() {
        this.videos = [];
        this.currentIndex = -1;
    }

    /**
     * Get the next video in the playlist
     * @returns {Object|null} - Next video object or null if none available
     */
    getNext() {
        if (this.videos.length === 0) {
            return null;
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
        return this.currentIndex < this.videos.length - 1;
    }

    /**
     * Reset the current index to start from beginning
     */
    reset() {
        this.currentIndex = -1;
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
