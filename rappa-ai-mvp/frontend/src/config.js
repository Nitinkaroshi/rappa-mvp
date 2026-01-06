/**
 * Application Configuration
 * 
 * Centralized configuration using environment variables.
 * Values are loaded from .env files based on the build mode.
 */

export const config = {
    // API Configuration
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8001',

    // App Information
    appName: import.meta.env.VITE_APP_NAME || 'Rappa.AI',

    // Environment
    environment: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,

    // Feature Flags (can be added later)
    features: {
        darkMode: true,
        realTimeUpdates: false,
        advancedSearch: true,
    }
};

// Validate required configuration
if (!config.apiUrl) {
    console.error('VITE_API_URL is not defined in environment variables');
}

// Log configuration in development
if (config.isDevelopment) {
    console.log('🔧 App Configuration:', {
        apiUrl: config.apiUrl,
        environment: config.environment,
    });
}

export default config;
