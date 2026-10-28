import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5176,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://api.ajoti.com',
        changeOrigin: true,
        // The hosted cookie-auth service validates Origin independently of Host.
        // These headers apply only to requests through this local dev proxy.
        headers: {
          Origin: 'https://app.ajoti.com',
          Referer: 'https://app.ajoti.com/',
        },
        cookieDomainRewrite: '',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', '@mantine/core', '@mantine/hooks', '@mantine/notifications', '@mantine/dates'],
  },
})

