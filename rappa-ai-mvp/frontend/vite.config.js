import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk - React core (most stable, can be cached long-term)
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          // Router chunk
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }

          // Icons chunk (large library)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // TanStack Table (data grid)
          if (id.includes('node_modules/@tanstack/react-table')) {
            return 'table-vendor';
          }

          // Toast notifications
          if (id.includes('node_modules/react-hot-toast')) {
            return 'toast-vendor';
          }

          // Axios (API client)
          if (id.includes('node_modules/axios')) {
            return 'axios-vendor';
          }

          // Results components (loaded only when viewing results)
          if (id.includes('src/components/results')) {
            return 'results-components';
          }

          // Editor components (loaded only when editing)
          if (id.includes('src/components/editor')) {
            return 'editor-components';
          }

          // Dashboard components
          if (id.includes('src/components/dashboard')) {
            return 'dashboard-components';
          }
        }
      }
    },

    // Optimize chunk size
    chunkSizeWarningLimit: 500, // Warn if chunks > 500KB

    // Enable aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // Remove console.log in production
        drop_debugger: true,     // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2                // Run compression twice for better results
      },
      mangle: {
        safari10: true           // Fix Safari 10 compatibility
      },
      format: {
        comments: false          // Remove all comments
      }
    },

    // Source map for debugging (disable in production for smaller bundles)
    sourcemap: false,

    // CSS code splitting
    cssCodeSplit: true
  },

  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: []
  }
})
