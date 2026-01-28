import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Mengintegrasikan manifest yang sudah kita buat di folder public
      manifest: {
        short_name: "LABA APP",
        name: "LABA APP: Level Up Your Scout Adventure!",
        description: "Digital Scout Management System for Laskar Bahari SMPN 1 Biau",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/logo/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/logo/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/logo/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        // Caching aset agar aplikasi bisa dibuka lebih cepat
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 tahun
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})