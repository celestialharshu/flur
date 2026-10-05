import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // keep Rust compiler errors visible in the terminal
  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,

    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  build: {
    reportCompressedSize: false, // faster builds
  },
})
