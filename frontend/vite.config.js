import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // Exposes Vite to your remote machine's network
    port: 5181,      // Assigns your personal unique port
    strictPort: true // Stops Vite from changing ports automatically
  }
})
