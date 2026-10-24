import { toPublic } from '../domain/progress'
import { checkProgress } from './fetch'
import { loadProgress, slugOf } from './load'

const DAY = '2026-10-21'
const files: Record<string, unknown> = import.meta.glob('./fixtures/*.json', {
  eager: true,
  import: 'default',
})

// Checked and trimmed as the build does, so tests see the shape that ships.
export const fixtureProgress = loadProgress(
  Object.fromEntries(
    Object.entries(files).map(([path, data]) => {
      const { file, commits } = (data ?? {}) as {
        file?: unknown
        commits?: unknown
      }
      return [
        path,
        toPublic(checkProgress(slugOf(path), file, commits, DAY), DAY),
      ]
    })
  ),
  DAY
)
