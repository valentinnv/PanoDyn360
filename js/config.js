// Panorama Gallery Configuration with Dynamic Discovery

// Dynamic configuration - will be populated by panorama discovery
const PANORAMA_CONFIG = {
    panoramas: [], // Will be populated dynamically
    
    // Static fallback panoramas
    fallbackPanoramas: [
        {
            id: 'fallback_pano',
            title: 'Panorama Experience', 
            description: 'Immersive 360° panoramic view - drag to explore',
            thumbnail: 'assets/panoramas/Panorama1.jpg',
            panorama: 'assets/panoramas/Panorama1.jpg'
        }
    ],

    // Default viewer settings
    viewerSettings: {
        autorotateEnabled: false,
        autorotateDirection: 1,
        autorotateSpeed: 0.1,
        controls: {
            mouseViewMode: 'drag'
        }
    },

    // Gallery settings
    gallerySettings: {
        thumbnailSize: 300,
        columnCount: 'auto', // or specific number like 3
        lazyLoad: true
    },
    
    // Dynamic loading configuration
    discovery: {
        enabled: true,
        apiEndpoint: '/api/panoramas',
        fallbackOnError: true,
        cacheEnabled: true,
        thumbnailMaxWidth: 300,
        thumbnailMaxHeight: 200
    }
};

/**
 * Initialize dynamic panorama loading
 */
async function initializePanoramaConfig() {
    if (!PANORAMA_CONFIG.discovery.enabled) {
        console.log('📋 Using static panorama configuration');
        return PANORAMA_CONFIG.fallbackPanoramas;
    }
    
    try {
        console.log('🔄 Initializing dynamic panorama discovery...');
        
        // Check if PanoramaDiscovery is available
        if (typeof PanoramaDiscovery === 'undefined') {
            throw new Error('PanoramaDiscovery class not loaded');
        }
        
        // Create panorama discovery instance
        const discovery = new PanoramaDiscovery();
        
        // Discover and process panoramas
        const discoveredPanoramas = await discovery.discoverPanoramas();
        
        if (discoveredPanoramas && discoveredPanoramas.length > 0) {
            PANORAMA_CONFIG.panoramas = discoveredPanoramas;
            console.log(`✓ Successfully loaded ${discoveredPanoramas.length} panoramas dynamically`);
            
            // Trigger gallery refresh if gallery is available
            if (typeof window !== 'undefined' && window.gallery && typeof window.gallery.refreshGallery === 'function') {
                setTimeout(() => {
                    window.gallery.refreshGallery(discoveredPanoramas);
                }, 100);
            }
            
            return discoveredPanoramas;
        } else {
            throw new Error('No panoramas discovered');
        }
        
    } catch (error) {
        console.error('❌ Dynamic panorama loading failed:', error);
        
        if (PANORAMA_CONFIG.discovery.fallbackOnError) {
            console.log('🔄 Falling back to static configuration...');
            PANORAMA_CONFIG.panoramas = PANORAMA_CONFIG.fallbackPanoramas;
            return PANORAMA_CONFIG.fallbackPanoramas;
        } else {
            throw error;
        }
    }
}

/**
 * Get current panorama configuration
 */
function getPanoramaConfig() {
    return PANORAMA_CONFIG.panoramas.length > 0 
        ? PANORAMA_CONFIG.panoramas 
        : PANORAMA_CONFIG.fallbackPanoramas;
}

/**
 * Refresh panorama configuration
 */
async function refreshPanoramaConfig() {
    console.log('🔄 Refreshing panorama configuration...');
    PANORAMA_CONFIG.panoramas = [];
    return await initializePanoramaConfig();
}

/**
 * Add a single panorama to the configuration
 */
function addPanorama(panorama) {
    const panoramas = getPanoramaConfig();
    panoramas.push(panorama);
    
    // Trigger gallery refresh if available
    if (typeof window !== 'undefined' && window.gallery && typeof window.gallery.refreshGallery === 'function') {
        window.gallery.refreshGallery(panoramas);
    }
    
    console.log(`✓ Added panorama: ${panorama.title}`);
    return panoramas;
}

/**
 * Remove a panorama by ID
 */
function removePanorama(id) {
    const panoramas = getPanoramaConfig();
    const index = panoramas.findIndex(p => p.id === id);
    
    if (index !== -1) {
        const removed = panoramas.splice(index, 1);
        
        // Trigger gallery refresh if available
        if (typeof window !== 'undefined' && window.gallery && typeof window.gallery.refreshGallery === 'function') {
            window.gallery.refreshGallery(panoramas);
        }
        
        console.log(`✓ Removed panorama: ${removed[0].title}`);
        return panoramas;
    }
    
    console.warn(`⚠️ Panorama with ID '${id}' not found`);
    return panoramas;
}

// Sample placeholder images configuration (for reference)
const SAMPLE_PANORAMAS = [
    {
        id: 'sample1',
        title: 'Sample Panorama 1',
        description: 'Replace with your equirectangular image',
        thumbnail: 'https://via.placeholder.com/300x200/4a90e2/ffffff?text=Panorama+1',
        panorama: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/equirectangular/venice_sunset_1k.hdr'
    },
    {
        id: 'sample2',
        title: 'Sample Panorama 2', 
        description: 'Replace with your equirectangular image',
        thumbnail: 'https://via.placeholder.com/300x200/50c878/ffffff?text=Panorama+2',
        panorama: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/equirectangular/royal_esplanade_1k.hdr'
    }
];

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        PANORAMA_CONFIG, 
        SAMPLE_PANORAMAS,
        initializePanoramaConfig,
        getPanoramaConfig,
        refreshPanoramaConfig,
        addPanorama,
        removePanorama
    };
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.initializePanoramaConfig = initializePanoramaConfig;
    window.getPanoramaConfig = getPanoramaConfig;
    window.refreshPanoramaConfig = refreshPanoramaConfig;
    window.addPanorama = addPanorama;
    window.removePanorama = removePanorama;
}