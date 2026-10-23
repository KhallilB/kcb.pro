import { validatePublicProgress, type PublicProgress } from '../domain/progress'
import type { IsoDay } from '../domain/types'

export const slugOf = (path: string) =>
  path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')

// Keys are file paths; the file name is the project slug.
export function loadProgress(
  files: Record<string, unknown>,
  buildDay: IsoDay
): Record<string, PublicProgress> {
  const loaded: Record<string, PublicProgress> = {}
  for (const [path, data] of Object.entries(files)) {
    const slug = slugOf(path)
    const errors = validatePublicProgress(data, { slug, buildDay })
    if (errors.length > 0) {
      throw new Error(`${path} failed validation:\n${errors.join('\n')}`)
    }
    loaded[slug] = data as PublicProgress
  }
  return loaded
}
