// Marzipano viewer functionality for 360° panorama display

class PanoramaViewer {
    constructor(containerSelector = '#pano') {
        this.container = document.querySelector(containerSelector);
        this.modal = document.querySelector('#viewer-modal');
        this.viewerTitle = document.querySelector('#viewer-title');
        this.currentIndexSpan = document.querySelector('#current-index');
        this.totalCountSpan = document.querySelector('#total-count');
        this.prevBtn = document.querySelector('#prev-btn');
        this.nextBtn = document.querySelector('#next-btn');
        this.closeBtn = document.querySelector('#viewer-close');
        this.overlay = document.querySelector('#viewer-overlay');
        this.loading = document.querySelector('#viewer-loading');
        
        this.viewer = null;
        this.scene = null;
        this.panoramas = [];
        this.currentIndex = 0;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupMarzipano();
    }

    setupMarzipano() {
        if (!this.container || typeof Marzipano === 'undefined') {
            console.error('Marzipano container not found or Marzipano not loaded');
            return;
        }

        // Ensure container has proper size
        console.log('Container dimensions:', {
            width: this.container.offsetWidth,
            height: this.container.offsetHeight,
            clientWidth: this.container.clientWidth,
            clientHeight: this.container.clientHeight
        });

        // Create Marzipano viewer
        this.viewer = new Marzipano.Viewer(this.container, {
            controls: {
                mouseViewMode: PANORAMA_CONFIG.viewerSettings?.controls?.mouseViewMode || 'drag'
            }
        });

        console.log('✓ Marzipano viewer created successfully');

        // Add viewer instructions
        this.addViewerInstructions();
    }

    bindEvents() {
        // Listen for open viewer events from gallery
        document.addEventListener('openPanoramaViewer', (e) => {
            this.openViewer(e.detail);
        });

        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeViewer());
        }

        // Overlay click to close
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeViewer());
        }

        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousPanorama());
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextPanorama());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.closeViewer();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousPanorama();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextPanorama();
                    break;
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.isOpen && this.viewer) {
                this.viewer.updateSize();
            }
        });

        // Prevent scrolling when viewer is open
        this.modal?.addEventListener('wheel', (e) => {
            if (this.isOpen) {
                e.preventDefault();
            }
        });
    }

    openViewer(data) {
        if (!this.viewer || !data) {
            console.error('Viewer not initialized or invalid data');
            return;
        }

        this.panoramas = data.allPanoramas;
        this.currentIndex = data.index;
        this.isOpen = true;

        // Show modal
        this.modal?.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Load panorama
        this.loadPanorama(data.panorama);

        // Update UI
        this.updateUI();

        // Focus on viewer for keyboard navigation
        setTimeout(() => {
            this.container?.focus();
        }, 300);
    }

    closeViewer() {
        this.isOpen = false;
        
        // Hide modal
        this.modal?.classList.remove('active');
        document.body.style.overflow = '';

        // Destroy current scene
        if (this.scene) {
            this.viewer.destroyScene(this.scene);
            this.scene = null;
        }

        // Hide loading
        this.hideLoading();
    }

    async loadPanorama(panorama) {
        if (!panorama || !this.viewer) {
            console.error('Invalid panorama data or viewer not initialized');
            return;
        }

        this.showLoading();

        // Preload and validate image before rendering
        try {
            await this.validateAndPreloadImage(panorama.panorama);
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to load panorama image: ' + error.message);
            return;
        }

        // Ensure the viewer has been properly sized after modal opens
        setTimeout(() => {
            console.log('Container size before load:', {
                width: this.container.offsetWidth,
                height: this.container.offsetHeight
            });

            // Force viewer to update its size
            if (this.viewer) {
                this.viewer.updateSize();
                console.log('✓ Viewer size updated');
            }

            try {
                console.log('Loading panorama:', panorama.panorama);
                
                const source = Marzipano.ImageUrlSource.fromString(panorama.panorama);
                const optimalWidth = ViewerUtils.getOptimalResolution();
                const geometry = new Marzipano.EquirectGeometry([{ width: optimalWidth }]);
                const view = new Marzipano.RectilinearView();
                
                // Destroy existing scene
                if (this.scene) {
                    this.viewer.destroyScene(this.scene);
                }
                
                // Create scene
                this.scene = this.viewer.createScene({
                    source: source,
                    geometry: geometry,
                    view: view
                });
                
                // Switch to scene
                this.scene.switchTo();
                
                // Update title
                if (this.viewerTitle) {
                    this.viewerTitle.textContent = panorama.title;
                }
                
                // Hide loading
                setTimeout(() => {
                    this.hideLoading();
                    console.log('✓ Panorama loaded after image validation');
                }, 1000);
                
            } catch (error) {
                console.error('Error loading panorama:', error);
                this.hideLoading();
                this.showError('Failed to load panorama: ' + error.message);
            }
        }, 100); // Small delay to ensure modal is fully rendered
    }

    validateAndPreloadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            console.log('Preloading image:', imageUrl);
            
            const img = new Image();
            
            img.onload = () => {
                console.log('✓ Image preloaded successfully:', imageUrl);
                console.log('Image dimensions:', img.width, 'x', img.height);
                resolve(img);
            };
            
            img.onerror = () => {
                console.error('✗ Failed to preload image:', imageUrl);
                reject(new Error('Image failed to load: ' + imageUrl));
            };
            
            // Set timeout for loading
            setTimeout(() => {
                if (!img.complete) {
                    reject(new Error('Image loading timeout: ' + imageUrl));
                }
            }, 10000); // 10 second timeout
            
            // Since we're using HTTP server, use the URL directly
            img.src = imageUrl;
        });
    }

    createMarzipanoScene(panorama) {
        try {
            // Verify Marzipano is available
            if (typeof Marzipano === 'undefined') {
                throw new Error('Marzipano library not available');
            }

            // Create geometry for equirectangular panorama with error handling
            let geometry;
            try {
                geometry = new Marzipano.EquirectGeometry([
                    { width: 4096 },
                    { width: 2048 },
                    { width: 1024 },
                    { width: 512 }
                ]);
            } catch (geomError) {
                console.warn('Failed to create EquirectGeometry, trying fallback:', geomError);
                // Fallback geometry
                geometry = new Marzipano.EquirectGeometry([{ width: 1024 }]);
            }

            // Create image source with error handling
            let source;
            try {
                console.log('Creating Marzipano source with URL:', panorama.panorama);
                source = Marzipano.ImageUrlSource.fromString(panorama.panorama);
                console.log('✓ Marzipano source created successfully');
            } catch (sourceError) {
                console.error('Failed to create image source:', sourceError);
                throw new Error('Invalid panorama image URL');
            }

            // Create view with natural parameters
            const view = new Marzipano.RectilinearView({
                yaw: 0,
                pitch: 0,
                roll: 0
            }, {
                yaw: [-Math.PI, Math.PI],
                pitch: [-Math.PI/2, Math.PI/2],
                roll: [-Math.PI, Math.PI]
            });

            // Destroy existing scene if any
            if (this.scene) {
                this.viewer.destroyScene(this.scene);
            }

            // Create and display new scene
            console.log('Creating Marzipano scene...');
            this.scene = this.viewer.createScene({
                source: source,
                geometry: geometry,
                view: view,
                pinFirstLevel: true
            });
            console.log('✓ Marzipano scene created successfully');

            // Switch to the scene
            console.log('Switching to scene...');
            this.scene.switchTo({
                transitionDuration: 1000,
                transitionUpdate: Marzipano.util.compose(
                    Marzipano.util.tween(1000),
                    Marzipano.util.ease.inOutQuad
                )
            });
            console.log('✓ Scene switch initiated');

            // Set up autorotation if enabled
            if (PANORAMA_CONFIG.viewerSettings?.autorotateEnabled) {
                this.setupAutorotation();
            }

            // Update viewer title
            if (this.viewerTitle) {
                this.viewerTitle.textContent = panorama.title;
            }

            // Hide loading once image is loaded
            setTimeout(() => {
                this.hideLoading();
            }, 1500);

            // Update viewer title
            if (this.viewerTitle) {
                this.viewerTitle.textContent = panorama.title;
            }

        } catch (error) {
            console.error('Error creating Marzipano scene:', error);
            throw error; // Re-throw to be caught by loadPanorama
        }
    }

    setupAutorotation() {
        if (!this.scene || !PANORAMA_CONFIG.viewerSettings?.autorotateEnabled) {
            return;
        }

        const autorotate = Marzipano.autorotate({
            yawSpeed: PANORAMA_CONFIG.viewerSettings.autorotateSpeed || 0.1,
            targetPitch: 0,
            targetFov: Math.PI/4
        });

        this.scene.layer().mergeEffects({ autorotate });
    }

    previousPanorama() {
        if (this.panoramas.length <= 1) return;

        this.currentIndex = this.currentIndex === 0 
            ? this.panoramas.length - 1 
            : this.currentIndex - 1;

        this.loadPanorama(this.panoramas[this.currentIndex]);
        this.updateUI();
    }

    nextPanorama() {
        if (this.panoramas.length <= 1) return;

        this.currentIndex = this.currentIndex === this.panoramas.length - 1 
            ? 0 
            : this.currentIndex + 1;

        this.loadPanorama(this.panoramas[this.currentIndex]);
        this.updateUI();
    }

    updateUI() {
        // Update counter
        if (this.currentIndexSpan && this.totalCountSpan) {
            this.currentIndexSpan.textContent = this.currentIndex + 1;
            this.totalCountSpan.textContent = this.panoramas.length;
        }

        // Update navigation buttons
        if (this.prevBtn && this.nextBtn) {
            const hasPrevious = this.panoramas.length > 1;
            const hasNext = this.panoramas.length > 1;
            
            this.prevBtn.disabled = !hasPrevious;
            this.nextBtn.disabled = !hasNext;
        }
    }

    showLoading() {
        this.loading?.classList.remove('hidden');
    }

    hideLoading() {
        this.loading?.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'viewer-error';
        errorDiv.innerHTML = `
            <h3>Error</h3>
            <p>${message}</p>
            <button class="retry-btn">Try Again</button>
        `;

        // Clear container and show error
        this.container.innerHTML = '';
        this.container.appendChild(errorDiv);

        // Bind retry button
        const retryBtn = errorDiv.querySelector('.retry-btn');
        retryBtn?.addEventListener('click', () => {
            this.container.innerHTML = '';
            if (this.panoramas[this.currentIndex]) {
                this.loadPanorama(this.panoramas[this.currentIndex]);
            }
        });
    }

    addViewerInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'viewer-instructions';
        instructions.innerHTML = `
            <h4>Controls</h4>
            <ul>
                <li>Drag to look around</li>
                <li>Scroll to zoom</li>
                <li>← → Navigate</li>
                <li>ESC to close</li>
            </ul>
        `;

        // Only add if not exists
        if (!document.querySelector('.viewer-instructions')) {
            this.modal?.querySelector('.viewer-content')?.appendChild(instructions);
        }
    }

    // Public methods for external control
    getCurrentPanorama() {
        return this.panoramas[this.currentIndex] || null;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    getTotalCount() {
        return this.panoramas.length;
    }

    isViewerOpen() {
        return this.isOpen;
    }

    // Method to enable/disable autorotation
    toggleAutorotation() {
        if (!this.scene) return;

        const currentSettings = PANORAMA_CONFIG.viewerSettings;
        currentSettings.autorotateEnabled = !currentSettings.autorotateEnabled;
        
        if (currentSettings.autorotateEnabled) {
            this.setupAutorotation();
        } else {
            this.scene.layer().mergeEffects({ autorotate: null });
        }
    }

    // Method to set view parameters
    setView(yaw, pitch, fov) {
        if (!this.scene) return;

        const view = this.scene.view();
        view.setParameters({ yaw, pitch, fov });
    }

    // Method to get current view parameters
    getView() {
        if (!this.scene) return null;

        const view = this.scene.view();
        return {
            yaw: view.yaw(),
            pitch: view.pitch(),
            fov: view.fov()
        };
    }
}

// Utility functions for viewer
const ViewerUtils = {
    // Check if device supports WebGL
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     canvas.getContext('webgl'));
        } catch (e) {
            return false;
        }
    },

    // Get optimal image resolution based on device
    getOptimalResolution() {
        const pixelRatio = window.devicePixelRatio || 1;
        const screenWidth = window.screen.width * pixelRatio;
        
        if (screenWidth >= 3840) return 4096;
        if (screenWidth >= 1920) return 2048;
        if (screenWidth >= 1280) return 1024;
        return 512;
    },

    // Check if device is mobile
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
               .test(navigator.userAgent);
    }
};