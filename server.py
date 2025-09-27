from flask import Flask, jsonify, send_from_directory, request
from pathlib import Path
import os

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/api/panoramas')
def panorama_list():
    panorama_dir = Path('./assets/panoramas')
    if not panorama_dir.exists():
        return jsonify({'success': False, 'error': 'Panoramas directory not found'}), 404

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
    panoramas.sort(key=lambda x: x['filename'])
    return jsonify({
        'success': True,
        'panoramas': panoramas,
        'count': len(panoramas)
    })

@app.route('/assets/panoramas/<path:filename>')
def serve_panorama(filename):
    return send_from_directory('assets/panoramas', filename)

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)