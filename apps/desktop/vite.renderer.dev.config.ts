import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'src/renderer',
  server: {
    host: '127.0.0.1',
    port: 5175,
  },
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
    },
  },
  plugins: [react(), tailwindcss()],
})
