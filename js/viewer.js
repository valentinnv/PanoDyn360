// Pannellum viewer functionality for 360° panorama display

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
        this.panoramas = [];
        this.currentIndex = 0;
        this.isOpen = false;

        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('openPanoramaViewer', (e) => {
            this.openViewer(e.detail);
        });

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeViewer());
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeViewer());
        }

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousPanorama());
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextPanorama());
        }

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

        window.addEventListener('resize', () => {
            if (this.isOpen && this.viewer) {
                pannellum.viewer(this.container.id).resize();
            }
        });

        // Remove wheel event prevention to allow Pannellum zoom
        // The modal wheel prevention was blocking Pannellum's zoom functionality
    }

    openViewer(data) {
        if (!this.container || !data) {
            console.error('Viewer container not found or invalid data');
            return;
        }

        this.panoramas = data.allPanoramas;
        this.currentIndex = data.index;
        this.isOpen = true;

        this.modal?.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.loadPanorama(data.panorama);
        this.updateUI();

        setTimeout(() => {
            this.container?.focus();
        }, 300);
    }

    closeViewer() {
        this.isOpen = false;
        this.modal?.classList.remove('active');
        document.body.style.overflow = '';
        this.hideLoading();
        this.container.innerHTML = '';
    }

    async loadPanorama(panorama) {
        if (!panorama || !this.container) {
            console.error('Invalid panorama data or container not found');
            return;
        }

        this.showLoading();

        // Get the appropriate panorama URL for the device
        const panoramaUrl = this.getPanoramaUrlForDevice(panorama.panorama);

        try {
            await this.validateAndPreloadImage(panoramaUrl);
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to load panorama image: ' + error.message);
            return;
        }

        this.container.innerHTML = '';
        this.viewer = pannellum.viewer(this.container.id, {
            type: "equirectangular",
            panorama: panoramaUrl,
            autoLoad: true,
            showControls: true,
            compass: false,
            title: panorama.title || "",
            hfov: 100,
            minHfov: 50,
            maxHfov: 120,
            pitch: 0,
            yaw: 0,
            mouseZoom: true,
            doubleClickZoom: true,
            keyboardZoom: true,
            draggable: true,
            disableKeyboardCtrl: false,
            showZoomCtrl: true,
            showFullscreenCtrl: true
        });

        if (this.viewerTitle) {
            this.viewerTitle.textContent = panorama.title;
        }

        setTimeout(() => {
            this.hideLoading();
        }, 1000);
    }

    getPanoramaUrlForDevice(originalUrl) {
        // Check if device is mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Add resize parameter for mobile devices
            const separator = originalUrl.includes('?') ? '&' : '?';
            return `${originalUrl}${separator}resize=true&max_width=2048`;
        }
        
        return originalUrl;
    }

    validateAndPreloadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Image failed to load: ' + imageUrl));
            img.src = imageUrl;
        });
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
        if (this.currentIndexSpan && this.totalCountSpan) {
            this.currentIndexSpan.textContent = this.currentIndex + 1;
            this.totalCountSpan.textContent = this.panoramas.length;
        }
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
        this.container.innerHTML = '';
        this.container.appendChild(errorDiv);
        const retryBtn = errorDiv.querySelector('.retry-btn');
        retryBtn?.addEventListener('click', () => {
            this.container.innerHTML = '';
            if (this.panoramas[this.currentIndex]) {
                this.loadPanorama(this.panoramas[this.currentIndex]);
            }
        });
    }
}