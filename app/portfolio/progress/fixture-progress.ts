import { loadProgress } from './load'

// Test and offline data, checked as the build checks fetched data.
export const fixtureProgress = loadProgress(
  import.meta.glob('./fixtures/*.json', { eager: true, import: 'default' }),
  '2026-10-21'
)
