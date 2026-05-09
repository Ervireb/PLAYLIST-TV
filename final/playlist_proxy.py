#!/usr/bin/env python3
"""
YouTube Playlist Proxy Server
Change #8: YouTube Playlist Import via RSS/XML

This script provides a local proxy server that fetches YouTube playlist
RSS feeds and returns video URLs as JSON. This is needed because YouTube's
RSS feeds have CORS restrictions that prevent direct browser access.

Usage:
    python3 playlist_proxy.py [--port PORT]

Default port: 8080
Endpoint: GET /fetch-playlist?id=PLAYLIST_ID

Example:
    curl http://localhost:8080/fetch-playlist?id=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
"""

import http.server
import urllib.request
import urllib.error
import json
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, parse_qs
import sys
import argparse


class PlaylistProxyHandler(http.server.BaseHTTPRequestHandler):
    """HTTP request handler for YouTube playlist proxy"""

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/fetch-playlist':
            self.handle_fetch_playlist(parsed_path)
        elif parsed_path.path == '/health':
            self.send_json_response({'status': 'ok'})
        else:
            self.send_error_response(404, 'Not found')

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def handle_fetch_playlist(self, parsed_path):
        """
        Fetch YouTube playlist RSS feed and extract video URLs
        
        Query parameters:
            id: YouTube playlist ID (required)
        """
        query_params = parse_qs(parsed_path.query)
        playlist_id = query_params.get('id', [None])[0]

        if not playlist_id:
            self.send_error_response(400, 'Missing required parameter: id')
            return

        # Validate playlist ID format (alphanumeric, hyphens, underscores)
        if not all(c.isalnum() or c in '-_' for c in playlist_id):
            self.send_error_response(400, 'Invalid playlist ID format')
            return

        try:
            # Fetch RSS feed from YouTube
            rss_url = f'https://www.youtube.com/feeds/videos.xml?playlist_id={playlist_id}'
            print(f'Fetching: {rss_url}')

            req = urllib.request.Request(
                rss_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; PlaylistProxy/1.0)',
                    'Accept': 'application/xml, text/xml, */*'
                }
            )

            with urllib.request.urlopen(req, timeout=15) as response:
                xml_content = response.read().decode('utf-8')

            # Parse XML to extract video IDs
            videos = self.parse_playlist_xml(xml_content)

            if not videos:
                self.send_error_response(404, 'No videos found in playlist or invalid playlist ID')
                return

            # Return JSON response
            result = {
                'videos': videos,
                'count': len(videos),
                'playlist_id': playlist_id
            }

            print(f'Found {len(videos)} videos in playlist {playlist_id}')
            self.send_json_response(result)

        except urllib.error.HTTPError as e:
            error_msg = f'YouTube returned HTTP {e.code}'
            if e.code == 404:
                error_msg = 'Playlist not found or is private'
            print(f'HTTP Error: {error_msg}')
            self.send_error_response(e.code, error_msg)

        except urllib.error.URLError as e:
            error_msg = f'Network error: {str(e.reason)}'
            print(f'URL Error: {error_msg}')
            self.send_error_response(502, error_msg)

        except ET.ParseError as e:
            error_msg = f'Failed to parse XML response: {str(e)}'
            print(f'Parse Error: {error_msg}')
            self.send_error_response(500, error_msg)

        except Exception as e:
            error_msg = f'Unexpected error: {str(e)}'
            print(f'Error: {error_msg}')
            self.send_error_response(500, error_msg)

    def parse_playlist_xml(self, xml_content):
        """
        Parse YouTube RSS XML and extract video URLs
        
        YouTube RSS feed structure:
        <feed>
            <entry>
                <yt:videoId>VIDEO_ID</yt:videoId>
                <link rel="alternate" href="https://www.youtube.com/watch?v=VIDEO_ID"/>
            </entry>
            ...
        </feed>
        
        Args:
            xml_content: Raw XML string from YouTube RSS feed
            
        Returns:
            List of YouTube video URLs
        """
        videos = []

        try:
            root = ET.fromstring(xml_content)

            # Define namespaces used in YouTube RSS feeds
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom',
                'yt': 'http://www.youtube.com/xml/schemas/2015',
                'media': 'http://search.yahoo.com/mrss/'
            }

            # Find all entry elements
            entries = root.findall('atom:entry', namespaces)

            if not entries:
                # Try without namespace prefix (some feeds may differ)
                entries = root.findall('{http://www.w3.org/2005/Atom}entry')

            for entry in entries:
                video_id = None

                # Try to get videoId from yt:videoId element
                video_id_elem = entry.find('yt:videoId', namespaces)
                if video_id_elem is None:
                    video_id_elem = entry.find('{http://www.youtube.com/xml/schemas/2015}videoId')

                if video_id_elem is not None and video_id_elem.text:
                    video_id = video_id_elem.text.strip()
                else:
                    # Fallback: try to extract from link element
                    link_elem = entry.find('atom:link[@rel="alternate"]', namespaces)
                    if link_elem is None:
                        link_elem = entry.find('{http://www.w3.org/2005/Atom}link[@rel="alternate"]')

                    if link_elem is not None:
                        href = link_elem.get('href', '')
                        # Extract video ID from URL
                        if 'watch?v=' in href:
                            video_id = href.split('watch?v=')[1].split('&')[0]

                if video_id:
                    video_url = f'https://www.youtube.com/watch?v={video_id}'
                    videos.append(video_url)

        except ET.ParseError as e:
            print(f'XML Parse Error: {e}')
            raise

        return videos

    def send_json_response(self, data, status_code=200):
        """Send a JSON response with CORS headers"""
        response_body = json.dumps(data, indent=2).encode('utf-8')

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_body)))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(response_body)

    def send_error_response(self, status_code, message):
        """Send an error JSON response with CORS headers"""
        data = {
            'error': message,
            'status': status_code
        }
        self.send_json_response(data, status_code)

    def send_cors_headers(self):
        """Add CORS headers for local development"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        self.send_header('Access-Control-Max-Age', '86400')

    def log_message(self, format, *args):
        """Custom log format"""
        print(f'[Proxy] {self.address_string()} - {format % args}')


def main():
    """Start the proxy server"""
    parser = argparse.ArgumentParser(description='YouTube Playlist Proxy Server')
    parser.add_argument('--port', type=int, default=8080,
                        help='Port to listen on (default: 8080)')
    parser.add_argument('--host', type=str, default='localhost',
                        help='Host to bind to (default: localhost)')
    args = parser.parse_args()

    server_address = (args.host, args.port)
    httpd = http.server.HTTPServer(server_address, PlaylistProxyHandler)

    print(f'=' * 60)
    print(f'  YouTube Playlist Proxy Server')
    print(f'  Listening on http://{args.host}:{args.port}')
    print(f'  ')
    print(f'  Endpoints:')
    print(f'    GET /fetch-playlist?id=PLAYLIST_ID')
    print(f'    GET /health')
    print(f'  ')
    print(f'  Press Ctrl+C to stop')
    print(f'=' * 60)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
        httpd.server_close()


if __name__ == '__main__':
    main()
