import type { PublicProgress } from '@app/portfolio/domain/progress'
import type { IsoDay } from '@app/portfolio/domain/types'
import { loadProgress } from '@app/portfolio/progress/load'

// Written by scripts/progress-fetch.ts; absent on a fresh clone, which loads as no progress.
const files = import.meta.glob('/build-data/progress/*.json', {
  eager: true,
  import: 'default',
})

// Checked on call, not import: tests import the server entry with a pinned day.
export function builtProgress(
  buildDay: IsoDay
): Record<string, PublicProgress> {
  return loadProgress(files, buildDay)
}
