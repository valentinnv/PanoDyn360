// Gallery functionality for displaying panorama thumbnails

class PanoramaGallery {
    constructor(containerSelector = '#gallery-grid') {
        this.container = document.querySelector(containerSelector);
        this.panoramas = [];
        this.currentIndex = -1;
        
        this.init();
    }

    async init() {
        // Show loading state
        this.showLoadingState();
        
        try {
            // Load panoramas dynamically
            await this.loadPanoramas();
            this.renderGallery();
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showErrorState(error.message);
        }
        
        this.bindEvents();
    }

    async loadPanoramas() {
        try {
            // If dynamic discovery is enabled, try to initialize it
            if (PANORAMA_CONFIG.discovery?.enabled && typeof initializePanoramaConfig === 'function') {
                console.log('🔄 Loading panoramas dynamically...');
                this.panoramas = await initializePanoramaConfig();
            } else {
                // Use static configuration
                console.log('📋 Using static panorama configuration');
                this.panoramas = PANORAMA_CONFIG.panoramas.length > 0
                    ? PANORAMA_CONFIG.panoramas
                    : (typeof SAMPLE_PANORAMAS !== 'undefined' ? SAMPLE_PANORAMAS : []);
            }
            
            console.log(`✓ Loaded ${this.panoramas.length} panoramas`);
            
        } catch (error) {
            console.error('❌ Failed to load panoramas:', error);
            
            // Fallback to static configuration
            this.panoramas = PANORAMA_CONFIG.fallbackPanoramas || [];
            
            if (this.panoramas.length === 0) {
                throw new Error('No panoramas available');
            }
        }
    }

    showLoadingState() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="gallery-loading">
                <div class="loading-spinner"></div>
                <p>Discovering panoramas...</p>
            </div>
        `;
    }

    showErrorState(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="gallery-error">
                <h3>Error Loading Panoramas</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="window.gallery.init()">
                    Retry
                </button>
            </div>
        `;
    }

    renderGallery() {
        if (!this.container) {
            console.error('Gallery container not found');
            return;
        }

        // Clear existing content
        this.container.innerHTML = '';

        if (this.panoramas.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Render each panorama item
        this.panoramas.forEach((panorama, index) => {
            const item = this.createGalleryItem(panorama, index);
            this.container.appendChild(item);
        });
    }

    createGalleryItem(panorama, index) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.index = index;
        item.dataset.panoramaId = panorama.id;

        item.innerHTML = `
            <div class="gallery-thumbnail-container">
                <img class="gallery-thumbnail" 
                     src="${panorama.thumbnail}" 
                     alt="${panorama.title}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=Image+Not+Found'">
            </div>
            <div class="gallery-info">
                <h3 class="gallery-title">${panorama.title}</h3>
                <p class="gallery-description">${panorama.description}</p>
                <button class="gallery-view-btn" data-index="${index}">
                    View 360°
                </button>
            </div>
        `;

        return item;
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="gallery-empty">
                <h3>No Panoramas Available</h3>
                <p>Add your 360° panorama images to the configuration to get started.</p>
                <p>Place your equirectangular images in the assets/panoramas/ folder and update the config.js file.</p>
            </div>
        `;
    }

    bindEvents() {
        // Handle clicks on gallery items and view buttons
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                const galleryItem = e.target.closest('.gallery-item');
                const viewButton = e.target.closest('.gallery-view-btn');
                
                if (viewButton || galleryItem) {
                    e.preventDefault();
                    const index = parseInt(
                        viewButton?.dataset.index || 
                        galleryItem?.dataset.index
                    );
                    
                    if (!isNaN(index)) {
                        this.openViewer(index);
                    }
                }
            });
        }

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const focusedItem = document.activeElement.closest('.gallery-item');
                if (focusedItem) {
                    e.preventDefault();
                    const index = parseInt(focusedItem.dataset.index);
                    if (!isNaN(index)) {
                        this.openViewer(index);
                    }
                }
            }
        });
    }

    openViewer(index) {
        if (index < 0 || index >= this.panoramas.length) {
            console.error('Invalid panorama index:', index);
            return;
        }

        this.currentIndex = index;
        const panorama = this.panoramas[index];

        // Dispatch custom event to open viewer
        const event = new CustomEvent('openPanoramaViewer', {
            detail: {
                panorama,
                index,
                totalCount: this.panoramas.length,
                allPanoramas: this.panoramas
            }
        });

        document.dispatchEvent(event);
    }

    // Public methods for external control
    getPanorama(index) {
        return this.panoramas[index] || null;
    }

    getTotalCount() {
        return this.panoramas.length;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    getAllPanoramas() {
        return this.panoramas;
    }

    // Method to refresh gallery (useful when panoramas are added/removed dynamically)
    refresh() {
        this.init();
    }

    // Method to refresh gallery with new panorama data
    refreshGallery(newPanoramas = null) {
        console.log('🔄 Refreshing gallery...');
        
        if (newPanoramas) {
            this.panoramas = newPanoramas;
        }
        
        this.renderGallery();
    }

    // Method to search/filter panoramas (future enhancement)
    filterPanoramas(searchTerm) {
        const filtered = this.panoramas.filter(panorama => 
            panorama.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            panorama.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Temporarily store original panoramas
        const originalPanoramas = this.panoramas;
        this.panoramas = filtered;
        this.renderGallery();
        
        // Restore original panoramas for future operations
        setTimeout(() => {
            this.panoramas = originalPanoramas;
        }, 100);
    }

    // Method to add new panorama (future enhancement)
    addPanorama(panorama) {
        this.panoramas.push(panorama);
        this.renderGallery();
    }

    // Method to remove panorama (future enhancement)
    removePanorama(id) {
        this.panoramas = this.panoramas.filter(p => p.id !== id);
        this.renderGallery();
    }
}

// Utility functions for gallery
const GalleryUtils = {
    // Check if image exists
    imageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    },

    // Generate thumbnail from panorama (future enhancement)
    generateThumbnail(panoramaUrl, width = 300, height = 200) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            canvas.width = width;
            canvas.height = height;
            
            img.onload = () => {
                // Draw center portion of panorama as thumbnail
                const sourceX = img.width * 0.25; // Start at 25% of width
                const sourceY = img.height * 0.25; // Start at 25% of height
                const sourceWidth = img.width * 0.5; // Use 50% of width
                const sourceHeight = img.height * 0.5; // Use 50% of height
                
                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 
                             0, 0, width, height);
                
                resolve(canvas.toDataURL());
            };
            
            img.onerror = () => resolve(null);
            img.crossOrigin = 'anonymous';
            img.src = panoramaUrl;
        });
    },

    // Lazy loading for images
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
};