import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Defaults to PHP built-in server:
  //   php -S localhost:8000 -t ../backend
  // then /api/* -> http://localhost:8000/api/*
  //
  // For Apache/XAMPP you can instead set:
  //   VITE_API_PROXY_TARGET=http://localhost
  //   VITE_API_PROXY_PREFIX=/anjali-restaurant/backend/api
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'
  const prefix = env.VITE_API_PROXY_PREFIX || '/api'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, prefix),
        },
      },
    },
  }
})
