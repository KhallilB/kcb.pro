import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@home': path.resolve(__dirname, '../../apps/home/src/entry.tsx'),
      '@styles': path.resolve(__dirname, '../../libs/styles/src')
    }
  },
  build: {
    outDir: '../../dist/apps/router',
    emptyOutDir: true
  }
})
