import { COMMIT_TYPES, type CommitType, type DayCount } from './progress'

const PREFIX = /^(\w+)(?:\([^)]*\))?!?:/

export function classifyCommit(subject: string): CommitType {
  // Conventional Commits: types are case-insensitive.
  const type = PREFIX.exec(subject)?.[1]?.toLowerCase()
  return COMMIT_TYPES.includes(type as CommitType)
    ? (type as CommitType)
    : 'other'
}

// Columns of seven days, oldest first; the last day is the build day.
export function activityWeeks(days: DayCount[]): DayCount[][] {
  return Array.from({ length: Math.ceil(days.length / 7) }, (_, week) =>
    days.slice(week * 7, week * 7 + 7)
  )
}
