import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@app': '/app',
      '@server': '/server',
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
