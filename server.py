#!/usr/bin/env python3
"""
Enhanced HTTP Server with API endpoints for panorama discovery
"""

import http.server
import socketserver
import json
import os
from pathlib import Path
import mimetypes
from urllib.parse import urlparse, parse_qs

class PanoramaHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # API endpoint to list panorama files
        if parsed_path.path == '/api/panoramas':
            self.handle_panorama_list()
        else:
            # Default file serving
            super().do_GET()
    
    def handle_panorama_list(self):
        """Return list of panorama files in assets/panoramas/ directory"""
        try:
            panorama_dir = Path('./assets/panoramas')
            
            if not panorama_dir.exists():
                self.send_error(404, "Panoramas directory not found")
                return
            
            # Supported image formats
            image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
            
            panoramas = []
            for file_path in panorama_dir.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                    panoramas.append({
                        'filename': file_path.name,
                        'path': f'assets/panoramas/{file_path.name}',
                        'size': file_path.stat().st_size,
                        'modified': file_path.stat().st_mtime
                    })
            
            # Sort by filename
            panoramas.sort(key=lambda x: x['filename'])
            
            # Send JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'panoramas': panoramas,
                'count': len(panoramas)
            }
            
            self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Error listing panoramas: {str(e)}")
    
    def end_headers(self):
        # Add CORS headers for API requests
        if self.path.startswith('/api/'):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server(port=8000):
    """Run the enhanced HTTP server"""
    with socketserver.TCPServer(("", port), PanoramaHTTPRequestHandler) as httpd:
        print(f"Enhanced panorama server running at http://localhost:{port}/")
        print(f"API endpoint: http://localhost:{port}/api/panoramas")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped by user")
            httpd.shutdown()

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    run_server(port)