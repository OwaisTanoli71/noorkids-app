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
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/quran\/audio\?url=.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio',
              expiration: { maxEntries: 5000, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio',
              expiration: { maxEntries: 5000, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\/api\/quran\/surah\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'quran-data',
              expiration: { maxEntries: 200, maxAgeSeconds: 2592000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
})