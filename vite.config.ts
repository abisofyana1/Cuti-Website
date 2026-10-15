import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Mengizinkan akses via IP Address (Network)
    port: 9999, // Mengubah port menjadi 3000
  }
})