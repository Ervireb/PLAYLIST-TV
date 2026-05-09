# Multi-Platform Video Playlist Player

A modern, lightweight web application for creating and playing video playlists from YouTube, Vimeo, and Coub. Features a lightbox video player, shuffle mode, theme switching, and responsive design.

## Features

### Core Playback
- **Lightbox Video Player**: Videos play in a full-screen overlay with dark semi-transparent background
- **Auto-advance**: Automatically transitions to the next video when the current one ends (500ms delay for smooth operation)
- **Click-to-play**: Click any playlist item to jump to that video in the lightbox
- **Video Container Play Button**: Animated play button that opens the lightbox when clicked
- **Resume Playback**: Close the lightbox to pause; click the video container to resume from where you left off

### Playlist Management
- **Add Videos**: Paste YouTube, Vimeo, or Coub URLs to add to the playlist
- **File Import**: Import playlists from CSV or TXT files (supports comma and semicolon delimiters)
- **Remove Videos**: Click the X button on any playlist item to remove it
- **Clear Playlist**: Clear all videos with the Clear button next to the playlist header
- **Duplicate Detection**: Prevents adding the same URL twice

### Playback Modes
- **Loop Mode**: Toggle to restart the playlist from the beginning after the last video
- **Shuffle Mode**: Toggle to play videos in a randomized order (Fisher-Yates algorithm)
  - Shuffled order persists until toggled off or playlist is modified
  - Display order in the playlist UI remains unchanged
  - Currently playing video is highlighted regardless of shuffle state

### Theme System
- **Light Theme** (default): Clean, bright interface with soft blue/purple accents
- **Dark Theme**: Deep gray/navy interface with muted accent colors and subtle glow effects
- **Persistent**: Theme preference saved to localStorage
- **System Detection**: Automatically detects system dark mode preference on first visit
- **Toggle**: Click the moon/sun icon in the header to switch themes

### Settings
- **Coub Timer**: Configure how long Coub videos play before advancing (default: 30 seconds)
- **Persistent Settings**: All settings saved to localStorage

### Design
- **Responsive**: Mobile-first design that works on all screen sizes
- **Modern Aesthetics**: Rounded corners, smooth transitions, card-based layout
- **Animated Play Button**: Colorful rotating gradient circle when playlist has videos
- **Toggle Switches**: Modern styled toggle switches for Loop and Shuffle
- **Touch-friendly**: Minimum 44px tap targets for mobile use

## Supported Platforms

| Platform | URL Formats |
|----------|-------------|
| YouTube  | `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID` |
| Vimeo    | `vimeo.com/ID`, `player.vimeo.com/video/ID` |
| Coub     | `coub.com/view/ID`, `coub.com/embed/ID` |

## File Structure

```
final/
├── index.html          # Main HTML structure with lightbox overlay
├── css/
│   └── styles.css      # Complete styles with theme system and responsive design
├── js/
│   ├── app.js          # Main application controller
│   ├── playlist.js     # Playlist management with shuffle support
│   └── video-player.js # Video player with lightbox integration
├── README.md           # This file
├── test_videos.txt     # Sample test file
├── test_videos.csv     # Sample test file
└── ...
```

## Architecture

The application uses a modular ES6 module architecture:

- **`playlist.js`**: Manages the video queue, loop/shuffle state, and playlist operations
- **`video-player.js`**: Handles video loading, platform API integration, lightbox display, and playback control
- **`app.js`**: Orchestrates the UI, binds events, manages theme, and coordinates between modules

## Usage

1. Open `index.html` in a modern web browser
2. Paste a video URL into the input field and click "Add" (or press Enter)
3. Alternatively, import a file with video URLs using the "Import" button
4. Click the video container (play button) to start playback in the lightbox
5. Click any playlist item to jump to that video
6. Use Loop and Shuffle toggles to control playback order
7. Press ESC or click the X button to close the lightbox (pauses playback)
8. Click the video container again to resume playback

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ESC | Close lightbox (pause playback) |
| Enter | Add URL from input field |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technical Notes

- No external library dependencies (pure HTML/CSS/JS)
- YouTube IFrame API and Vimeo Player API loaded for platform integration
- CSS custom properties for theming
- Fisher-Yates shuffle algorithm for unbiased randomization
- localStorage for persistent settings and theme preference
- CSS transitions for smooth lightbox open/close (300ms)
- 500ms delay between video transitions for smooth operation
- Autoplay with mute workaround for browser autoplay policies
