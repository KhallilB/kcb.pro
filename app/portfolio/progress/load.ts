import {
  validateCommits,
  validateProgress,
  type ProjectProgress,
} from '../domain/progress'
import type { IsoDay } from '../domain/types'

// Keys are file paths; the file name is the project slug.
export function loadProgress(
  files: Record<string, unknown>,
  buildDay: IsoDay
): Record<string, ProjectProgress> {
  const loaded: Record<string, ProjectProgress> = {}
  for (const [path, data] of Object.entries(files)) {
    const slug = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')
    const { file, commits } = (data ?? {}) as {
      file?: unknown
      commits?: unknown
    }
    const errors = [
      ...validateProgress(file, { slug, buildDay }),
      ...validateCommits(commits, slug),
    ]
    if (errors.length > 0) {
      throw new Error(`${path} failed validation:\n${errors.join('\n')}`)
    }
    loaded[slug] = { file, commits } as ProjectProgress
  }
  return loaded
}
