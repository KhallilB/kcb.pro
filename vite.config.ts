import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { buildDay } from './scripts/build-day'

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DAY__: JSON.stringify(buildDay()),
  },
  resolve: {
    alias: {
      '@app': '/app',
    },
  },
  build: {
    outDir: 'build',
  },
})
