import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: false
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'proITA',
        short_name: 'proITA',
        description: 'Plataforma de serviços e profissionais locais',
        theme_color: '#0284c7',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192-b.png',
            sizes: '196x196',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512-b.png',
            sizes: '516x516',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
})
