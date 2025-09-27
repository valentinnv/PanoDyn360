// Main JavaScript file - Application initialization and coordination

class PanoramaApp {
    constructor() {
        this.gallery = null;
        this.viewer = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    async initializeApp() {
        try {
            // Check if required dependencies are loaded
            if (!this.checkDependencies()) {
                console.error('Required dependencies not loaded');
                this.showFallbackMessage();
                return;
            }

            // Initialize components
            await this.initializeComponents();

            // Set up global event listeners
            this.setupGlobalEvents();

            // Add loading class removal
            this.removeLoadingStates();

            this.isInitialized = true;
            console.log('Panorama App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Panorama App:', error);
            this.showErrorMessage(error.message);
        }
    }

    checkDependencies() {
        console.log('Checking dependencies...');

        // Check if configuration is loaded
        if (typeof PANORAMA_CONFIG === 'undefined' && typeof SAMPLE_PANORAMAS === 'undefined') {
            console.error('Panorama configuration not found');
            console.error('Make sure js/config.js is loaded properly');
            return false;
        }
        console.log('✓ Configuration loaded successfully');

        // WebGL check is not needed for Pannellum
        console.log('✓ Dependencies checked');

        return true;
    }

    async initializeComponents() {
        // Initialize gallery
        this.gallery = new PanoramaGallery('#gallery-grid');
        
        // Initialize viewer
        this.viewer = new PanoramaViewer('#pano');

        // Wait a bit for components to settle
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    setupGlobalEvents() {
        // Handle service worker registration (future enhancement)
        if ('serviceWorker' in navigator) {
            // Register service worker for offline support
            // navigator.serviceWorker.register('/sw.js');
        }

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('No internet connection', 'warning');
        });

        // Handle visibility change (pause/resume operations)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppHidden();
            } else {
                this.onAppVisible();
            }
        });

        // Handle errors globally
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleGlobalError(e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.handleGlobalError(e.reason);
        });
    }

    removeLoadingStates() {
        // Remove any loading classes
        document.body.classList.remove('loading');
        
        // Add loaded class for CSS animations
        document.body.classList.add('loaded');
    }

    onAppHidden() {
        // Pause any running animations or operations
        if (this.viewer && this.viewer.isViewerOpen()) {
            // Could pause autorotation here
        }
    }

    onAppVisible() {
        // Resume operations when app becomes visible
        if (this.viewer && this.viewer.isViewerOpen()) {
            // Could resume autorotation here
        }
    }

    handleGlobalError(error) {
        // Only show user-friendly errors for specific cases
        if (error.message.includes('panorama') || error.message.includes('image')) {
            this.showNotification('Failed to load panorama image', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            backgroundColor: this.getNotificationColor(type),
            color: 'white',
            borderRadius: '8px',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px'
        });

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Handle close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }

    hideNotification(notification) {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    showFallbackMessage() {
        const container = document.querySelector('#gallery-grid');
        if (container) {
            container.innerHTML = `
                <div class="fallback-message">
                    <h3>Unable to Load Panorama Viewer</h3>
                    <p>There was a problem loading the viewer. Please check your browser and try again.</p>
                    <button class="retry-button" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    }

    showErrorMessage(message) {
        const container = document.querySelector('#gallery-grid');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Application</h3>
                    <p>${message}</p>
                    <button class="retry-button" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    // Public methods for external control
    getGallery() {
        return this.gallery;
    }

    getViewer() {
        return this.viewer;
    }

    isReady() {
        return this.isInitialized;
    }

    // Method to add new panorama dynamically (future enhancement)
    addPanorama(panoramaData) {
        if (this.gallery) {
            this.gallery.addPanorama(panoramaData);
        }
    }

    // Method to refresh the entire app
    refresh() {
        if (this.gallery) {
            this.gallery.refresh();
        }
    }
}

// Utility functions for the app
const AppUtils = {
    // Get browser information
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        
        return {
            name: browser,
            userAgent: ua,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            hasWebGL: !!window.WebGLRenderingContext
        };
    },

    // Log system information
    logSystemInfo() {
        const info = this.getBrowserInfo();
        console.log('System Information:', {
            browser: info.name,
            mobile: info.isMobile,
            webGL: info.hasWebGL,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            pixelRatio: window.devicePixelRatio || 1
        });
    },

    // Check if URL contains panorama parameters (future enhancement)
    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const panoramaId = params.get('panorama');
        const autoplay = params.get('autoplay') === 'true';
        
        return { panoramaId, autoplay };
    }
};

// Script Loading Helper
const ScriptLoader = {
    // Utility functions for script loading
};

// Initialize the app
let panoramaApp;

// Create global instance when script loads with proper dependency waiting
(async function() {
    try {
        // Initialize the app
        panoramaApp = new PanoramaApp();

        // Log system information in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            AppUtils.logSystemInfo();
        }

        // Make app globally accessible for debugging
        window.PanoramaApp = panoramaApp;

    } catch (error) {
        console.error('Failed to initialize app:', error);
        const container = document.querySelector('#gallery-grid');
        if (container) {
            container.innerHTML = `
                <div class="fallback-message">
                    <h3>Unable to Load Panorama Viewer</h3>
                    <p>${error.message}</p>
                    <button class="retry-button" onclick="location.reload()">Reload Page</button>
                </div>
            `;
        }
    }
})();

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanoramaApp;
}