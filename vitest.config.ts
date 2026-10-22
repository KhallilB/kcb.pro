import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __BUILD_DAY__: JSON.stringify('2026-10-21'),
  },
  resolve: {
    alias: {
      '@app': '/app',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
    globals: true,
    include: ['app/**/*.test.ts', 'app/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
