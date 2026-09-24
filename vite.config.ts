import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { apiOrigin } from './src/utils/apiConfig.ts'
import { createApiProxy } from './dev/apiProxy.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: [
        'favicon-yufesta-v2-16x16.png',
        'favicon-yufesta-v2-32x32.png',
        'apple-touch-icon-yufesta-v2.png',
        'push-sw.js',
      ],
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
            src: 'pwa-yufesta-v2-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-yufesta-v2-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-yufesta-v2-512x512.png',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,ttf}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/assets(?:\/|$)/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    open: true,
    proxy: env.VITE_DEV_API_PROXY === 'false' ? undefined : {
      '/api/v1': createApiProxy(apiOrigin(env)),
    },
  },
  }
})
