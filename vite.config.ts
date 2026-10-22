import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// One build day for every page; CI can pin it with BUILD_DAY=YYYY-MM-DD.
const BUILD_DAY = process.env.BUILD_DAY ?? new Date().toISOString().slice(0, 10)

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DAY__: JSON.stringify(BUILD_DAY),
  },
  resolve: {
    alias: {
      '@app': '/app',
      '@server': '/server',
    },
  },
  build: {
    outDir: 'build',
  },
})
