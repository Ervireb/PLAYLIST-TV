#!/usr/bin/env python3
"""
Playlist Proxy Server
Fetches YouTube playlist data via RSS feed and returns video IDs as JSON.

Usage:
    python3 playlist_proxy.py

This starts a simple HTTP server that serves the static files and
provides a proxy endpoint for fetching YouTube playlist data.

Endpoint:
    GET /playlist_proxy.py?list=PLAYLIST_ID
    
Response:
    {"videos": ["videoId1", "videoId2", ...]}
"""

import http.server
import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
import os
import sys

PORT = 8080

class PlaylistProxyHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with YouTube playlist proxy support."""
    
    def do_GET(self):
        """Handle GET requests."""
        parsed = urllib.parse.urlparse(self.path)
        
        # Check if this is a proxy request
        if parsed.path == '/playlist_proxy.py':
            self.handle_proxy_request(parsed)
        else:
            # Serve static files
            super().do_GET()
    
    def handle_proxy_request(self, parsed):
        """Handle YouTube playlist proxy requests."""
        params = urllib.parse.parse_qs(parsed.query)
        playlist_id = params.get('list', [None])[0]
        
        if not playlist_id:
            self.send_error_response(400, 'Missing playlist ID parameter')
            return
        
        try:
            # Fetch YouTube RSS feed for the playlist
            rss_url = f'https://www.youtube.com/feeds/videos.xml?playlist_id={playlist_id}'
            
            req = urllib.request.Request(rss_url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; PlaylistProxy/1.0)'
            })
            
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read().decode('utf-8')
            
            # Parse XML to extract video IDs
            root = ET.fromstring(content)
            
            # Define namespace
            ns = {
                'atom': 'http://www.w3.org/2005/Atom',
                'yt': 'http://www.youtube.com/xml/schemas/2015'
            }
            
            video_ids = []
            for entry in root.findall('atom:entry', ns):
                video_id_el = entry.find('yt:videoId', ns)
                if video_id_el is not None and video_id_el.text:
                    video_ids.append(video_id_el.text)
            
            # Send JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = json.dumps({'videos': video_ids})
            self.wfile.write(response_data.encode('utf-8'))
            
        except urllib.error.HTTPError as e:
            self.send_error_response(e.code, f'YouTube API error: {e.reason}')
        except urllib.error.URLError as e:
            self.send_error_response(502, f'Network error: {str(e.reason)}')
        except ET.ParseError as e:
            self.send_error_response(500, f'XML parse error: {str(e)}')
        except Exception as e:
            self.send_error_response(500, f'Internal error: {str(e)}')
    
    def send_error_response(self, code, message):
        """Send a JSON error response."""
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response_data = json.dumps({'error': message, 'videos': []})
        self.wfile.write(response_data.encode('utf-8'))
    
    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[Proxy] {self.address_string()} - {format % args}")


def main():
    """Start the proxy server."""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    handler = PlaylistProxyHandler
    
    with http.server.HTTPServer(('', PORT), handler) as httpd:
        print(f"Playlist Proxy Server running on http://localhost:{PORT}")
        print(f"Serving files from: {os.getcwd()}")
        print(f"Open http://localhost:{PORT}/index_fixed_fixed.html in your browser")
        print("Press Ctrl+C to stop")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)


if __name__ == '__main__':
    main()
