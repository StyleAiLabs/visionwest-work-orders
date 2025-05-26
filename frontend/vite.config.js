import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*'],
      manifest: {
        name: 'VisionWest Work Orders',
        short_name: 'Work Orders',
        description: 'VisionWest Work Orders Management System',
        theme_color: '#99ca3f',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'], // Android preference
        orientation: 'portrait-primary',
        start_url: '/?utm_source=pwa',
        scope: '/',
        categories: ['productivity', 'business'],
        // Critical: Android viewport settings
        prefer_related_applications: false,
        edge_side_panel: {},
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Workbox options
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/visionwest-api\.onrender\.com\/api/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true, // Important for testing on Android devices
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Better for PWA caching
      },
    },
  },
})