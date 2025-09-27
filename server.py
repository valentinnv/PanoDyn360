from flask import Flask, jsonify, send_from_directory, request
from pathlib import Path
import os
from PIL import Image
import io

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
    # Check if mobile device based on user agent
    user_agent = request.headers.get('User-Agent', '').lower()
    is_mobile = any(mobile in user_agent for mobile in ['mobile', 'android', 'iphone', 'ipad', 'ipod'])
    
    # Check if client explicitly requests resized image
    resize = request.args.get('resize', 'false').lower() == 'true'
    max_width = int(request.args.get('max_width', '2048'))
    
    if is_mobile or resize:
        try:
            # Resize image for mobile devices
            return serve_resized_panorama(filename, max_width)
        except Exception as e:
            print(f"Error resizing image {filename}: {e}")
            # Fallback to original if resize fails
            return send_from_directory('assets/panoramas', filename)
    
    return send_from_directory('assets/panoramas', filename)

def serve_resized_panorama(filename, max_width=2048):
    """Serve a resized version of the panorama image"""
    file_path = Path('assets/panoramas') / filename
    
    if not file_path.exists():
        return "File not found", 404
    
    try:
        # Open and resize image
        with Image.open(file_path) as img:
            # Calculate new dimensions maintaining aspect ratio
            original_width, original_height = img.size
            
            if original_width <= max_width:
                # Image is already small enough
                return send_from_directory('assets/panoramas', filename)
            
            ratio = max_width / original_width
            new_height = int(original_height * ratio)
            
            # Resize image
            resized_img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Convert to bytes
            img_io = io.BytesIO()
            
            # Determine format based on file extension
            format = 'JPEG'
            if filename.lower().endswith('.png'):
                format = 'PNG'
            elif filename.lower().endswith('.webp'):
                format = 'WEBP'
            
            # Save with optimization
            if format == 'JPEG':
                resized_img.save(img_io, format=format, quality=85, optimize=True)
            else:
                resized_img.save(img_io, format=format, optimize=True)
            
            img_io.seek(0)
            
            # Return the resized image
            from flask import Response
            return Response(
                img_io.getvalue(),
                mimetype=f'image/{format.lower()}',
                headers={
                    'Content-Disposition': f'inline; filename="{filename}"',
                    'Cache-Control': 'public, max-age=3600'
                }
            )
            
    except Exception as e:
        print(f"Error processing image {filename}: {e}")
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