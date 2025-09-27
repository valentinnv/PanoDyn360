// Dynamic panorama discovery and thumbnail generation
class PanoramaDiscovery {
    constructor() {
        this.panoramas = [];
        this.thumbnailCache = new Map();
    }

    /**
     * Discover panorama files from the server
     */
    async discoverPanoramas() {
        try {
            console.log('🔍 Discovering panorama files...');
            const response = await fetch('/api/panoramas');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.panoramas) {
                console.log(`✓ Found ${data.panoramas.length} panorama files`);
                this.panoramas = await this.processPanoramas(data.panoramas);
                return this.panoramas;
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Error discovering panoramas:', error);
            // Fallback to static configuration
            return this.getFallbackPanoramas();
        }
    }

    /**
     * Process discovered panoramas and generate metadata
     */
    async processPanoramas(panoramaFiles) {
        const processed = [];
        
        for (let i = 0; i < panoramaFiles.length; i++) {
            const file = panoramaFiles[i];
            
            try {
                // Generate thumbnail
                const thumbnailDataUrl = await this.generateThumbnail(file.path);
                
                // Create panorama object
                const panorama = {
                    id: `pano_${i + 1}`,
                    title: this.generateTitle(file.filename),
                    description: `360° panoramic view - ${file.filename}`,
                    thumbnail: thumbnailDataUrl,
                    panorama: file.path,
                    filename: file.filename,
                    size: file.size,
                    modified: new Date(file.modified * 1000)
                };
                
                processed.push(panorama);
                console.log(`✓ Processed: ${file.filename}`);
                
            } catch (error) {
                console.warn(`⚠️ Failed to process ${file.filename}:`, error);
                // Add without thumbnail
                processed.push({
                    id: `pano_${i + 1}`,
                    title: this.generateTitle(file.filename),
                    description: `360° panoramic view - ${file.filename}`,
                    thumbnail: this.generatePlaceholderThumbnail(),
                    panorama: file.path,
                    filename: file.filename,
                    size: file.size,
                    modified: new Date(file.modified * 1000)
                });
            }
        }
        
        return processed;
    }

    /**
     * Generate thumbnail from panorama image
     */
    async generateThumbnail(imagePath, maxWidth = 300, maxHeight = 200) {
        return new Promise((resolve, reject) => {
            // Check cache first
            const cacheKey = `${imagePath}_${maxWidth}x${maxHeight}`;
            if (this.thumbnailCache.has(cacheKey)) {
                resolve(this.thumbnailCache.get(cacheKey));
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    // Create canvas for thumbnail
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate thumbnail dimensions
                    const aspectRatio = img.width / img.height;
                    let thumbWidth, thumbHeight;
                    
                    if (aspectRatio > maxWidth / maxHeight) {
                        thumbWidth = maxWidth;
                        thumbHeight = maxWidth / aspectRatio;
                    } else {
                        thumbHeight = maxHeight;
                        thumbWidth = maxHeight * aspectRatio;
                    }
                    
                    canvas.width = thumbWidth;
                    canvas.height = thumbHeight;
                    
                    // Draw and compress image
                    ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
                    
                    // Convert to data URL with compression
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    // Cache the result
                    this.thumbnailCache.set(cacheKey, dataUrl);
                    
                    resolve(dataUrl);
                    
                } catch (error) {
                    console.error('Canvas processing error:', error);
                    resolve(this.generatePlaceholderThumbnail());
                }
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image for thumbnail: ${imagePath}`);
                resolve(this.generatePlaceholderThumbnail());
            };
            
            // Set timeout for loading
            setTimeout(() => {
                if (!img.complete) {
                    console.warn(`Thumbnail generation timeout: ${imagePath}`);
                    resolve(this.generatePlaceholderThumbnail());
                }
            }, 10000);
            
            img.src = imagePath;
        });
    }

    /**
     * Generate placeholder thumbnail
     */
    generatePlaceholderThumbnail() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 300;
        canvas.height = 200;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 300, 200);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 200);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('360° Panorama', 150, 100);
        
        ctx.font = '12px Arial';
        ctx.fillText('Loading...', 150, 120);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Generate human-readable title from filename
     */
    generateTitle(filename) {
        // Remove extension
        let title = filename.replace(/\.[^/.]+$/, '');
        
        // Replace underscores and hyphens with spaces
        title = title.replace(/[_-]/g, ' ');
        
        // Capitalize words
        title = title.replace(/\b\w/g, l => l.toUpperCase());
        
        // Clean up extra spaces
        title = title.replace(/\s+/g, ' ').trim();
        
        return title || 'Panorama View';
    }

    /**
     * Fallback panoramas when discovery fails
     */
    getFallbackPanoramas() {
        console.log('🔄 Using fallback panorama configuration');
        return [
            {
                id: 'fallback_pano',
                title: 'Panorama Experience',
                description: 'Immersive 360° panoramic view - drag to explore',
                thumbnail: this.generatePlaceholderThumbnail(),
                panorama: 'assets/panoramas/Panorama1.jpg'
            }
        ];
    }

    /**
     * Clear thumbnail cache
     */
    clearThumbnailCache() {
        this.thumbnailCache.clear();
        console.log('✓ Thumbnail cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.thumbnailCache.size,
            keys: Array.from(this.thumbnailCache.keys())
        };
    }
}

// Export for use in other modules
window.PanoramaDiscovery = PanoramaDiscovery;