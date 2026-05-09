# Multi-Platform Video Playlist Player

A modern, responsive web application for creating and playing video playlists from multiple platforms.

## Supported Platforms

- **YouTube** - Standard videos and YouTube Shorts
- **Vimeo** - Standard Vimeo videos
- **Coub** - Short looping videos
- **TikTok** - TikTok videos (standard, mobile, and short links)

## Features

### Core Playback
- Sequential video playback across all supported platforms
- Click-to-play from any position in the playlist
- Lightbox/fullscreen video player
- Auto-advance to next video when current ends
- Loop mode (enabled by default)
- Shuffle mode with Fisher-Yates algorithm

### Import & Export
- **File Import**: Import playlists from CSV or TXT files
  - Supports comma and semicolon delimiters in CSV
  - Skips comments (lines starting with #) and empty lines
  - Shows validation summary before importing
  - Options: Add to Queue or Replace Queue
- **YouTube Playlist Import**: Paste a YouTube playlist URL to import all videos
- **Export**: Export current playlist as a dated .txt file (`playlist_export_YYYY-MM-DD.txt`)

### TikTok Support
- Supports multiple TikTok URL formats:
  - `https://www.tiktok.com/@username/video/VIDEO_ID`
  - `https://tiktok.com/@user/video/VIDEO_ID`
  - `https://m.tiktok.com/v/VIDEO_ID`
  - `https://vm.tiktok.com/SHORT_CODE/`
  - `https://www.tiktok.com/t/SHORT_CODE/`
- Embedded via TikTok's embed v2 iframe
- Uses configurable Short Video Duration timer for auto-advance

### Settings
- **Short Video Duration**: Configurable timer (1-99999 seconds) for Coub and TikTok videos
  - Controls how long looping short videos play before advancing
  - Default: 30 seconds
  - Persisted in localStorage

### UI/UX
- **Dark/Light Theme**: Toggle between themes, preference saved in localStorage
- **Modern Design**: Clean card-based layout with smooth animations
- **Responsive**: Mobile-first design with proper touch targets (44px minimum)
- **Toast Notifications**: Non-intrusive feedback messages
- **Platform Badges**: Color-coded badges for each platform
  - YouTube: Red (#ff0000)
  - Vimeo: Blue (#1ab7ea)
  - Coub: Cyan (#00aced)
  - TikTok: Pink (#ff0050)

## File Structure

```
final/
├── index_fixed_fixed.html    # Main HTML file
├── css/
│   └── styles.css            # Complete stylesheet (dark/light themes)
├── js/
│   ├── app.js                # Main application controller
│   ├── playlist.js           # Playlist management module
│   └── video-player.js       # Video player & platform detection
├── playlist_proxy.py         # Python proxy for YouTube playlist fetching
├── test_tiktok_urls.txt      # Test file with TikTok URL formats
├── test_videos.txt           # Test file with video URLs
├── test_videos.csv           # Test CSV file
├── test_mixed_urls.txt       # Mixed platform test URLs
└── README.md                 # This file
```

## Architecture

- **ES6 Modules**: Clean modular architecture with import/export
- **No External Frontend Dependencies**: Pure vanilla JavaScript, HTML, CSS
- **Cross-Browser Compatible**: Chrome 90+, Firefox 88+, Safari 14+
- **Responsive Design**: Mobile-first approach

## Usage

1. Open `index_fixed_fixed.html` in a modern web browser
2. Add videos by:
   - Pasting a URL and clicking "Add"
   - Importing a .txt or .csv file with URLs
   - Pasting a YouTube playlist URL
3. Click on any video in the playlist to start playing
4. Use Loop and Shuffle toggles to control playback order
5. Export your playlist using the Export button

## Technical Notes

- YouTube IFrame API is loaded for YouTube video control
- Vimeo Player API is loaded for Vimeo video events
- Coub and TikTok use iframe embeds with configurable timers
- The `playlist_proxy.py` can be used as a backend proxy for YouTube playlist fetching
- All user preferences (theme, timer) are stored in localStorage

## Recent Enhancements

1. **Fix Replace Queue**: Complete clear before adding ensures no old entries remain
2. **Header Layout**: Settings and theme toggle buttons in column-reverse wrapper
3. **YouTube Shorts**: Full support for all Shorts URL formats (www, m.youtube.com)
4. **TikTok Support**: Full platform support with multiple URL format detection
5. **Export Button**: Export playlist as dated .txt file
6. **Modern UI/UX**: Comprehensive design polish with animations, dark theme, and responsive layout
