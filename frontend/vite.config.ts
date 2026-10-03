import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// Vite config — https://vitejs.dev/config/
//
// In development the browser talks to the Vite server only; requests to
// /api/* and /health are proxied to the FastAPI backend (default
// http://127.0.0.1:8000). Override with BACKEND_URL in frontend/.env.local
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.BACKEND_URL || 'http://127.0.0.1:8000'
  const proxy = {
    '/api': { target: backend, changeOrigin: true },
    '/health': { target: backend, changeOrigin: true },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
