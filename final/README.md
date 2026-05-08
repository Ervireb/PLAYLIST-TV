# Multi-Platform Video Playlist Player

A web application that allows users to create and manage playlists of videos from multiple platforms (YouTube, Vimeo, and Coub) with automatic sequential playback.

## Features

- **Multi-Platform Support**: Play videos from YouTube, Vimeo, and Coub
- **Playlist Management**: Add, remove, and clear videos from your playlist
- **File Import**: Import multiple video URLs from CSV or TXT files
- **Automatic Playback**: Videos play sequentially with automatic transitions
- **Loop Mode**: Enable continuous playlist looping to restart from the beginning automatically
- **Click-to-Play**: Click any video in the playlist to start playing from that position
- **Fullscreen Persistence**: Enhanced fullscreen mode maintained across video transitions for all platforms
- **Configurable Coub Timer**: Customize how long Coub videos play before advancing (1-99999 seconds)
- **Settings Panel**: Easy-to-use settings interface with persistent storage
- **YouTube Autoplay Workaround**: Automatic detection and retry mechanism for YouTube autoplay issues
- **Coub Autoplay Enhancement**: Improved autoplay reliability for Coub videos in fullscreen mode
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

#### Manual Entry

1. Copy a video URL from YouTube, Vimeo, or Coub
2. Paste the URL into the input field at the top of the page
3. Click "Add to Playlist" button or press Enter
4. The video will appear in your playlist below

#### Importing from Files

You can import multiple video URLs at once from CSV or TXT files:

1. Click the **"Import File"** button next to the "Add to Playlist" button
2. Select a CSV or TXT file containing video URLs
3. The app will process the file and show an import summary dialog with:
   - Total URLs found in the file
   - Number of valid URLs that can be imported
   - Number of invalid URLs (will be skipped)
   - Number of duplicate URLs already in your playlist
4. Choose one of three options:
   - **Add to Queue**: Append the valid videos to your existing playlist
   - **Replace Queue**: Clear your current playlist and add the new videos
   - **Cancel**: Close the dialog without making changes
5. A confirmation message will show how many videos were imported

**Supported File Formats:**

**CSV Files:**
- Comma-separated or semicolon-separated values
- Can include headers (will be automatically detected)
- URLs can be in any column (first valid URL per row is used)
- Example formats:
  ```csv
  https://www.youtube.com/watch?v=VIDEO1
  https://vimeo.com/VIDEO2
  https://coub.com/view/VIDEO3
  ```
  
  ```csv
  Title,URL,Description
  Video 1,https://www.youtube.com/watch?v=VIDEO1,My video
  Video 2,https://vimeo.com/VIDEO2,Another video
  ```
  
  ```csv
  https://www.youtube.com/watch?v=VIDEO1;Title;Other data
  https://vimeo.com/VIDEO2;Title;Other data
  ```

**TXT Files:**
- One URL per line
- Empty lines are ignored
- Lines starting with # are treated as comments and ignored
- Example format:
  ```txt
  https://www.youtube.com/watch?v=VIDEO1
  https://vimeo.com/VIDEO2
  
  # This is a comment
  https://coub.com/view/VIDEO3
  https://youtu.be/VIDEO4
  ```

**Import Validation:**
- Only valid YouTube, Vimeo, and Coub URLs are imported
- Invalid URLs are automatically filtered out and reported
- Duplicate URLs within the file are removed
- URLs already in your playlist are detected and reported
- Whitespace is automatically trimmed from URLs

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
4. Enhanced fullscreen persistence with improved reliability across video transitions
5. Exit fullscreen anytime using the ESC key or browser controls

### Coub Timer Settings

Coub videos loop continuously and don't have a standard "end" event. You can configure how long each Coub video plays before advancing to the next video:

1. Click the **gear icon** (⚙️) button in the top-right corner of the video player section
2. The settings panel will open
3. Enter your desired duration in the "Coub Video Duration" field (1-99999 seconds)
4. Click **"Save Settings"** to apply the changes
5. Click **"Reset to Default"** to restore the default 30-second duration
6. Your setting is saved automatically and persists across browser sessions

**Default Duration**: 30 seconds  
**Valid Range**: 1 to 99,999 seconds  
**Storage**: Settings are stored in your browser's localStorage

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
  - Enhanced fullscreen persistence with improved timing and error handling
  - YouTube autoplay detection and retry mechanism (up to 3 attempts)
  - Coub autoplay enhancement with click simulation for fullscreen mode
  - Configurable Coub timer with localStorage persistence
  - Future-ready architecture with comments for platform-specific fullscreen APIs
  
- **app.js**: Main application controller and UI management
  - Loop mode toggle UI control
  - Click-to-play event handling
  - Fullscreen state coordination
  - Settings panel management and event handling
  - Coub timer configuration with validation
  - localStorage integration for persistent settings
  - File import functionality with CSV and TXT parsing
  - URL validation and duplicate detection
  - Import dialog management with action options

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

- **FileReader API**: For reading and processing uploaded files
  - Asynchronous file reading
  - Support for CSV and TXT file formats
  - Text content extraction and parsing

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

- **Coub Videos**: Coub doesn't provide a reliable end event API, so the app uses a configurable timeout-based approach (default 30 seconds, customizable from 1-99999 seconds)
- **Autoplay Restrictions**: Browser autoplay policies may prevent automatic playback without user interaction (the app includes retry mechanisms for YouTube and Coub)
- **Network Dependency**: Requires internet connection to load videos and external APIs
- **Platform Availability**: Videos must be publicly accessible on their respective platforms
- **Cross-Origin Limitations**: Some autoplay workarounds are limited by cross-origin iframe restrictions

## Privacy & Data

- No data is collected or stored on any server
- All playlist data is stored locally in browser memory (session-based)
- User settings (Coub timer) are stored in browser localStorage for persistence
- No cookies or tracking mechanisms are used
- Video playback is handled directly by platform APIs
- All data remains on your device and is never transmitted to external servers

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
- For Coub videos, the app uses click simulation to improve autoplay reliability
- Coub autoplay in fullscreen mode includes multiple retry attempts with delays

### Video Not Loading
- Ensure the video is not private or restricted
- Check if the video is available in your region
- Verify the URL format is correct

### Fullscreen Not Persisting
- Ensure your browser supports the Fullscreen API
- Some browsers may require user interaction before allowing fullscreen
- Check browser permissions for fullscreen access
- The app now uses enhanced fullscreen persistence with improved timing (800ms delay)
- Check the browser console for fullscreen-related error messages

### Coub Timer Settings Not Saving
- Ensure your browser allows localStorage access
- Check if you're in private/incognito mode (localStorage may be restricted)
- Verify the timer value is between 1 and 99999 seconds
- Try clearing browser cache and setting the timer again
- Settings are stored locally and persist across browser sessions

### Loop Mode Not Working
- Verify the "Loop Playlist" checkbox is checked
- Ensure there are multiple videos in the playlist
- Check the browser console for any error messages

### File Import Issues

**No Valid URLs Found:**
- Ensure your file contains valid YouTube, Vimeo, or Coub URLs
- Check that URLs are properly formatted (include https:// or http://)
- Verify URLs are not corrupted or incomplete
- Make sure URLs are on separate lines (TXT) or in separate fields (CSV)

**File Won't Upload:**
- Verify the file is a .csv or .txt file
- Check that the file is not corrupted
- Ensure the file size is reasonable (very large files may take time to process)
- Try saving the file with UTF-8 encoding

**Import Dialog Not Showing:**
- Check if any valid URLs were found in the file
- Look for error messages in the toast notifications
- Verify the file was read successfully
- Check the browser console for error messages

**All URLs Marked as Invalid:**
- Ensure URLs match supported platform formats:
  - YouTube: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
  - Vimeo: vimeo.com/, player.vimeo.com/video/
  - Coub: coub.com/view/, coub.com/embed/
- Remove any extra characters or spaces around URLs
- Check that video IDs are complete and valid

**All URLs Marked as Duplicates:**
- The URLs in your file already exist in your current playlist
- Use "Replace Queue" if you want to reload the same videos
- Or clear your playlist first, then import

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
