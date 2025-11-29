import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApiPlugin } from './vite-plugin-mock-api'

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    port: 7000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
