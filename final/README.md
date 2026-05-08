# Multi-Platform Video Playlist Player

A web application that allows users to create and manage playlists of videos from multiple platforms (YouTube, Vimeo, and Coub) with automatic sequential playback.

## Features

- **Multi-Platform Support**: Play videos from YouTube, Vimeo, and Coub
- **Playlist Management**: Add, remove, and clear videos from your playlist
- **Automatic Playback**: Videos play sequentially with automatic transitions
- **Loop Mode**: Enable continuous playlist looping to restart from the beginning automatically
- **Click-to-Play**: Click any video in the playlist to start playing from that position
- **Fullscreen Persistence**: Fullscreen mode is maintained across video transitions
- **YouTube Autoplay Workaround**: Automatic detection and retry mechanism for YouTube autoplay issues
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with visual feedback
- **Browser Autoplay Handling**: Intelligent handling of browser autoplay policies

## Supported Platforms

### YouTube
- Standard URLs: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short URLs: `https://youtu.be/VIDEO_ID`
- Embed URLs: `https://www.youtube.com/embed/VIDEO_ID`

### Vimeo
- Standard URLs: `https://vimeo.com/VIDEO_ID`
- Player URLs: `https://player.vimeo.com/video/VIDEO_ID`

### Coub
- Standard URLs: `https://coub.com/view/VIDEO_ID`
- Embed URLs: `https://coub.com/embed/VIDEO_ID`

## Usage Instructions

### Adding Videos to Playlist

1. Copy a video URL from YouTube, Vimeo, or Coub
2. Paste the URL into the input field at the top of the page
3. Click "Add to Playlist" button or press Enter
4. The video will appear in your playlist below

### Playing Videos

1. Click the "Play" button to start playing videos from your playlist
2. Videos will play automatically in sequence
3. Use the "Skip" button to move to the next video
4. The current video is highlighted in the playlist
5. **Click any video** in the playlist to start playing from that position

### Loop Mode

1. Check the "Loop Playlist" checkbox to enable continuous loop mode
2. When enabled, the playlist will automatically restart from the first video after the last video finishes
3. Uncheck the box to disable loop mode and stop after the last video
4. Loop mode setting persists during your session

### Fullscreen Mode

1. Use your browser's fullscreen controls or the video player's fullscreen button
2. When transitioning to the next video, fullscreen mode is automatically maintained
3. This works across all supported platforms (YouTube, Vimeo, Coub)
4. Exit fullscreen anytime using the ESC key or browser controls

### Managing Playlist

- **Remove Individual Videos**: Click the X button on any playlist item
- **Clear Entire Playlist**: Click the "Clear Playlist" button (requires confirmation)
- **View Playlist**: All queued videos are displayed with their platform and URL
- **Reorder Playback**: Click any video to start playing from that position

## Browser Compatibility

### Supported Browsers
- Chrome/Edge (version 90+)
- Firefox (version 88+)
- Safari (version 14+)
- Opera (version 76+)

### Autoplay Policy Notes

Modern browsers have strict autoplay policies to improve user experience. This application handles these policies by:

1. **Initial Muting**: Videos start muted to comply with autoplay policies
2. **Automatic Unmuting**: The app attempts to unmute after playback starts
3. **User Interaction**: Some browsers may require user interaction before unmuting works

If videos don't autoplay:
- Click the Play button to start playback
- Interact with the page (click anywhere) before starting playback
- Check your browser's autoplay settings

## Technical Details

### Architecture

The application is built with vanilla JavaScript using a modular architecture:

- **playlist.js**: Manages playlist state and operations
  - Loop mode management
  - Click-to-play index control
  - Automatic playlist restart logic
  
- **video-player.js**: Handles video playback and platform integration
  - Fullscreen state detection and management
  - Cross-browser fullscreen API support
  - YouTube autoplay detection and retry mechanism
  - Fullscreen persistence across video transitions
  
- **app.js**: Main application controller and UI management
  - Loop mode toggle UI control
  - Click-to-play event handling
  - Fullscreen state coordination

### APIs Used

- **YouTube IFrame API**: For YouTube video playback and event handling
  - Player state monitoring for autoplay detection
  - Programmatic play() method for autoplay workaround
  - Maximum 3 retry attempts for failed autoplay
  
- **Vimeo Player API**: For Vimeo video playback and event handling

- **Coub Embed**: For Coub video playback (basic iframe embedding)

- **Fullscreen API**: Cross-browser fullscreen support
  - Standard `requestFullscreen()` method
  - Legacy prefixed methods (webkit, moz, ms)
  - Fullscreen state detection across browsers

### File Structure

```
final/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Application styles
├── js/
│   ├── playlist.js         # Playlist management
│   ├── video-player.js     # Video player logic
│   └── app.js              # Main application controller
└── README.md               # This file
```

## Installation

No installation required! Simply open `index.html` in a modern web browser.

For local development:

1. Clone or download the project files
2. Open `index.html` in your browser
3. Start adding videos to your playlist

**Note**: Due to CORS policies, some features may require running from a local web server. You can use:

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## Limitations

- **Coub Videos**: Coub doesn't provide a reliable end event API, so the app uses a timeout-based approach (30 seconds default)
- **Autoplay Restrictions**: Browser autoplay policies may prevent automatic playback without user interaction
- **Network Dependency**: Requires internet connection to load videos and external APIs
- **Platform Availability**: Videos must be publicly accessible on their respective platforms

## Privacy & Data

- No data is collected or stored on any server
- All playlist data is stored locally in browser memory
- No cookies or tracking mechanisms are used
- Video playback is handled directly by platform APIs

## Troubleshooting

### Videos Won't Play
- Check your internet connection
- Verify the video URL is correct and publicly accessible
- Try clicking the Play button again
- Refresh the page and try again

### Autoplay Not Working
- Click anywhere on the page before starting playback
- Check browser autoplay settings
- Try manually clicking the Play button
- The app automatically retries YouTube autoplay up to 3 times

### Video Not Loading
- Ensure the video is not private or restricted
- Check if the video is available in your region
- Verify the URL format is correct

### Fullscreen Not Persisting
- Ensure your browser supports the Fullscreen API
- Some browsers may require user interaction before allowing fullscreen
- Check browser permissions for fullscreen access

### Loop Mode Not Working
- Verify the "Loop Playlist" checkbox is checked
- Ensure there are multiple videos in the playlist
- Check the browser console for any error messages

## Future Enhancements

Potential features for future versions:
- Playlist saving/loading (localStorage)
- Drag-and-drop playlist reordering
- Volume controls
- Playback speed controls
- Shuffle mode
- Video thumbnails in playlist
- Support for additional platforms
- Picture-in-picture mode
- Keyboard shortcuts

## License

This project is provided as-is for educational and personal use.

## Credits

- YouTube IFrame API: Google
- Vimeo Player API: Vimeo
- Coub Embed: Coub

---

**Last Updated**: October 2025
