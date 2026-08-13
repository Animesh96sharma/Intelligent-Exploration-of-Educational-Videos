import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'


const projectRoot = fs.realpathSync.native(__dirname)
const externalDataPath = fs.realpathSync.native(path.resolve(__dirname, 'public/data'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      allow: [projectRoot, externalDataPath],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
})