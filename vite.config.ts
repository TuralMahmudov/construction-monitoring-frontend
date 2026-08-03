import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Only source/config files should trigger HMR/rebuilds — stray docs
    // dropped in the project root (e.g. open in Word) can lock their file
    // handle and crash the fs watcher with EBUSY otherwise.
    watch: {
      ignored: ['**/*.docx', '**/*.doc', '**/*.pdf', '**/*.xlsx'],
    },
  },
})
