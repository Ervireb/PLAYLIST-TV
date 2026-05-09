# Multi-Platform Video Playlist Player

A web-based video playlist player that supports YouTube, YouTube Shorts, Vimeo, and Coub videos with a lightbox-based player interface.

## Features

### Core Features
- **Multi-platform support**: YouTube, YouTube Shorts, Vimeo, and Coub
- **Lightbox video player**: Videos play in an overlay lightbox for focused viewing
- **Click-to-play**: Click any playlist item to start playing from that video
- **File import**: Import video URLs from CSV or TXT files
- **YouTube Playlist Import**: Import entire YouTube playlists via RSS feed
- **Theme system**: Light and dark theme with toggle
- **Loop mode**: Automatically restart playlist when finished (enabled by default)
- **Shuffle mode**: Randomize playback order
- **Coub timer**: Configurable duration for Coub video playback
- **Responsive design**: Works on desktop and mobile devices

### Recent Enhancements

#### 1. File Import - Allow Duplicates
- All valid video URLs from imported files are processed, even if duplicates exist in the playlist
- Duplicate count is shown as informational in the import dialog
- Format: "Valid URLs: X | Duplicates in current playlist: Y"
- Both "Add to Queue" and "Replace Queue" add ALL valid URLs

#### 2. Replace Queue - Clear and Add All
- "Replace Queue" clears the entire playlist and adds all valid URLs
- No duplicate filtering since playlist is cleared first
- Shuffle indices are regenerated after replacement

#### 3. Loop Mode Active by Default
- Loop mode is enabled by default when the application loads
- User preference is saved to localStorage
- If localStorage has a saved preference, that is used instead

#### 4. Resized Play Button Animation
- The play button circle pulse animation is 33% larger
- Provides a more prominent visual indicator

#### 5. Restructured Header
- Settings button and theme toggle are in the header area
- Settings button has white color with hover glow effect
- Clean, unified header layout

#### 6. Video Sound Control via Lightbox
- Videos are muted when lightbox is closed
- Videos are unmuted when lightbox is opened
- Works with YouTube (mute/unMute API), Vimeo (setVolume), and Coub

#### 7. YouTube Shorts Support
- YouTube Shorts URLs (`youtube.com/shorts/VIDEO_ID`) are recognized
- Converted to standard YouTube embed format
- Works in both manual URL input and file import

#### 8. YouTube Playlist Import via RSS/XML
- Paste a YouTube playlist URL to import all videos
- Client-side fetch attempted first
- Falls back to local proxy server if CORS blocks direct access
- See [Proxy Setup](#proxy-setup) below

#### 9. Auto-Play Fix (fix_5-5_AP)
- Tracks user play/pause intent with `isPlaying` flag
- When user pauses, autoplay/retry logic stops
- When lightbox is closed, playback intent is cleared
- Prevents unwanted video restarts after manual pause

## Getting Started

### Basic Usage

1. Open `index_fixed.html` in a modern web browser
2. Enter a video URL in the input field and click "Add"
3. Click on a playlist item or the play button to start playback
4. Videos play in a lightbox overlay with sound

### Supported URL Formats

**YouTube:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID` (Shorts)
- `https://www.youtube.com/playlist?list=PLAYLIST_ID` (Playlist import)

**Vimeo:**
- `https://vimeo.com/VIDEO_ID`
- `https://player.vimeo.com/video/VIDEO_ID`

**Coub:**
- `https://coub.com/view/VIDEO_ID`
- `https://coub.com/embed/VIDEO_ID`

### File Import

Import multiple videos at once using CSV or TXT files:

**TXT format** (one URL per line):
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://vimeo.com/123456789
https://coub.com/view/abc123
```

**CSV format** (URLs in any column):
```
title,url
My Video,https://www.youtube.com/watch?v=dQw4w9WgXcQ
Another,https://vimeo.com/123456789
```

## Proxy Setup

### YouTube Playlist Import Proxy

The playlist import feature requires a local proxy server to bypass CORS restrictions when fetching YouTube RSS feeds.

#### Requirements
- Python 3.6+ (uses only standard library modules)

#### Starting the Proxy

```bash
cd final/
python3 playlist_proxy.py
```

The server starts on `http://localhost:8080` by default.

#### Custom Port

```bash
python3 playlist_proxy.py --port 9090
```

#### API Endpoints

**GET /fetch-playlist?id=PLAYLIST_ID**

Fetches a YouTube playlist's RSS feed and returns video URLs.

Response:
```json
{
  "videos": [
    "https://www.youtube.com/watch?v=VIDEO_ID_1",
    "https://www.youtube.com/watch?v=VIDEO_ID_2"
  ],
  "count": 2,
  "playlist_id": "PLxxxxxxxx"
}
```

**GET /health**

Health check endpoint.

Response:
```json
{
  "status": "ok"
}
```

#### Error Handling
- Returns appropriate HTTP status codes (400, 404, 502, 500)
- JSON error responses with descriptive messages
- Handles network failures, invalid playlists, and parsing errors

## Architecture

```
final/
├── index_fixed.html      # Main HTML file
├── css/
│   └── styles.css        # All styles (light/dark themes)
├── js/
│   ├── app.js            # Main application controller
│   ├── playlist.js       # Playlist management module
│   └── video-player.js   # Video player & platform APIs
├── playlist_proxy.py     # Python proxy for playlist import
├── test_videos.txt       # Sample test file
├── test_videos.csv       # Sample test CSV
└── README.md             # This file
```

### Module Responsibilities

- **playlist.js**: Manages video queue, loop/shuffle modes, navigation
- **video-player.js**: Platform detection, URL parsing, video loading, mute/unmute, lightbox integration
- **app.js**: UI binding, event handling, file import, playlist URL handling, theme management

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Settings

### Coub Timer
Configure how long Coub videos play before auto-advancing:
1. Click the settings (gear) icon in the header
2. Enter duration in seconds (1-99999)
3. Click "Save Settings"

Default: 30 seconds

### Theme
Toggle between light and dark themes using the sun/moon icon in the header. Preference is saved to localStorage.

### Loop Mode
When enabled (default), the playlist restarts from the beginning after the last video ends. Toggle via the "Loop" switch in the playlist controls.

### Shuffle Mode
When enabled, videos play in random order. Toggle via the "Shuffle" switch in the playlist controls.

## Technical Notes

- Uses ES6 modules (`type="module"` scripts)
- YouTube IFrame API for YouTube video control
- Vimeo Player.js API for Vimeo video control
- Coub embedded via iframe with timer-based advancement
- No external frontend dependencies (vanilla JS/CSS)
- localStorage for persisting user preferences
- All autoplay fix code marked with `// fix_5-5_AP` comments
