import { addDays } from './dates'
import { COMMIT_TYPES, type Commit, type CommitType } from './progress'
import type { IsoDay } from './types'

const PREFIX = /^(\w+)(?:\([^)]*\))?!?:/

export function classifyCommit(subject: string): CommitType {
  // Conventional Commits: types are case-insensitive.
  const type = PREFIX.exec(subject)?.[1]?.toLowerCase()
  return COMMIT_TYPES.includes(type as CommitType)
    ? (type as CommitType)
    : 'other'
}

export interface DayCount {
  day: IsoDay
  count: number
}

// Columns of seven days, oldest first; the last day is the build day.
export function activityWeeks(
  commits: Commit[],
  day: IsoDay,
  weeks = 12
): DayCount[][] {
  const counts = new Map<IsoDay, number>()
  for (const c of commits) counts.set(c.date, (counts.get(c.date) ?? 0) + 1)
  const start = addDays(day, 1 - weeks * 7)
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, offset) => {
      const at = addDays(start, week * 7 + offset)
      return { day: at, count: counts.get(at) ?? 0 }
    })
  )
}

export interface CommitGroup {
  type: CommitType
  commits: Commit[]
}

export function commitGroups(commits: Commit[]): CommitGroup[] {
  const newest = [...commits].sort((a, b) => b.date.localeCompare(a.date))
  return COMMIT_TYPES.map((type) => ({
    type,
    commits: newest.filter((c) => c.type === type),
  })).filter((group) => group.commits.length > 0)
}
