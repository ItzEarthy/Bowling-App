import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['PinStats.png'],
      injectRegister: 'auto',  // Let vite-plugin-pwa handle registration automatically
      filename: 'sw.js',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webmanifest}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https?:.*\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 300
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 86400
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Pin Stats - Bowling Score Tracker',
        short_name: 'Pin Stats',
        description: 'Track your bowling scores and analyze your game performance',
        theme_color: '#14B8A6',
        background_color: '#FDFBF5',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        id: '/',
        categories: ['sports', 'lifestyle', 'games'],
        lang: 'en',
        dir: 'ltr',
        prefer_related_applications: false,
        icons: [
          {
            src: '/PinStats.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/PinStats.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 8031,
    // Proxy API requests during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize build for production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
})