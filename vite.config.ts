import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'push-sw.js'],
      manifest: {
        id: '/',
        name: 'YU FESTA',
        short_name: 'YU FESTA',
        description: 'YU FESTA 모바일 웹앱',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        importScripts: ['push-sw.js'],
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    open: true,
  },
})
