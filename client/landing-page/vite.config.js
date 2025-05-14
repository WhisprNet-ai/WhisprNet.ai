import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    },
    cors: {
      origin: ['https://subashkore.in.ngrok.io'],
      credentials: true,
    },
    strictPort: true,
    allowedHosts: ['subashkore.in.ngrok.io'],
  },
})
