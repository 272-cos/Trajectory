import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/t.png', 'icons/logo.jpg'],
      manifest: {
        name: 'Trajectory - USAF PFA Tracker',
        short_name: 'Trajectory',
        description: 'Track USAF PFA readiness, project performance to your target date, and generate supervisor reports. All data stays in your browser.',
        theme_color: '#1d4ed8',
        background_color: '#f3f4f6',
        display: 'standalone',
        scope: '/Trajectory/',
        start_url: '/Trajectory/',
        icons: [
          {
            src: 'icons/t.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache-first for all static assets - no API calls in this app
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Ensure navigation fallback for SPA routing
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/Trajectory\/sw\.js$/, /^\/Trajectory\/workbox-/],
      },
    }),
  ],
  base: '/Trajectory/',
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
