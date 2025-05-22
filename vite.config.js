import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'public',
  resolve: {
    alias: {
      '/src': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001
  }
})
