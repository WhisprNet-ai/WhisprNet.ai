import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom middleware to handle long token URLs
    {
      name: 'handle-invitation-tokens',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Get path from URL
          const url = new URL(req.url, 'http://localhost')
          const pathname = url.pathname
          
          // Check if this is an invitation URL with token
          if (pathname.startsWith('/invitations/accept/') && pathname.length > 20) {
            console.log('Intercepting long invitation URL:', pathname)
            
            // Send index.html for client-side routing
            const indexHtml = fs.readFileSync(
              path.resolve(__dirname, 'index.html'),
              'utf-8'
            )
            
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(indexHtml)
            return
          }
          
          next()
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    historyApiFallback: true,
  }
}) 