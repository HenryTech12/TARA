import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // __dirname isn't defined in ESM (this file runs as `"type": "module"") —
    // import.meta.dirname is the native equivalent, stable since Node 20.11.
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
