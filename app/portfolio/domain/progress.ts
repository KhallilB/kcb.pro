import { addDays, daysBetween, isIsoDay } from './dates'
import { isShortLine } from './text'
import type { IsoDay } from './types'

// Contract version written against; the version before it is still read.
export const PROGRESS_SCHEMA = 1
const READABLE = [PROGRESS_SCHEMA - 1, PROGRESS_SCHEMA].filter((v) => v >= 1)

export const PROGRESS_RESULTS = ['pass', 'partial', 'fail', 'not-run'] as const
export type ProgressResult = (typeof PROGRESS_RESULTS)[number]

export const PROGRESS_KINDS = [
  'experiment',
  'tests',
  'release',
  'milestone',
] as const
export type ProgressKind = (typeof PROGRESS_KINDS)[number]

export const COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'test',
  'refactor',
  'chore',
  'other',
] as const
export type CommitType = (typeof COMMIT_TYPES)[number]

export type Evidence =
  | { label: string; path: string }
  | { label: string; url: string }

export interface Measure {
  label: string
  value: string
}

export interface ProgressEntry {
  // Unique in the file; the entry's HTML anchor.
  id: string
  // Entries about the same thing over time share a subject.
  subject: string
  date: IsoDay
  kind: ProgressKind
  title: string
  // What counted as success, decided before the result.
  passMark?: string
  result: ProgressResult
  // One line on what works and what is left; required when partial.
  summary?: string
  measured: Measure[]
  evidence: Evidence[]
  commit?: string
}

export interface ProgressFile {
  schema: number
  project: string
  // Append-only, oldest first.
  entries: ProgressEntry[]
}

export type Commit = {
  sha: string
  date: IsoDay
  type: CommitType
  subject: string
  url: string
}

export type ProjectProgress = { file: ProgressFile; commits: Commit[] }

// Commit days a page shows: 12 weeks ending on the build day.
export const ACTIVITY_DAYS = 84

export interface PublicEntry {
  id: string
  subject: string
  date: IsoDay
  title: string
  result: ProgressResult
  summary?: string
}

export interface DayCount {
  day: IsoDay
  count: number
}

// All a page may ship: outcomes and daily commit counts.
export interface PublicProgress {
  entries: PublicEntry[]
  days: DayCount[]
}

// Fields are picked by name, so a new contract field stays private until listed here.
export function toPublic(
  full: ProjectProgress,
  buildDay: IsoDay
): PublicProgress {
  const counts = new Map<IsoDay, number>()
  for (const c of full.commits)
    counts.set(c.date, (counts.get(c.date) ?? 0) + 1)
  return {
    entries: full.file.entries.map(
      ({ id, subject, date, title, result, summary }) => ({
        id,
        subject,
        date,
        title,
        result,
        ...(summary === undefined ? {} : { summary: summary.trim() }),
      })
    ),
    days: Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
      const day = addDays(buildDay, i + 1 - ACTIVITY_DAYS)
      return { day, count: counts.get(day) ?? 0 }
    }),
  }
}

const NEEDS_PASS_MARK: readonly string[] = ['experiment', 'tests']
const HASH = /^[0-9a-f]{7,40}$/

type Fields = Record<string, unknown>

const isRecord = (v: unknown): v is Fields =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isText = (v: unknown): v is string =>
  typeof v === 'string' && v.trim() !== ''

const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  list.includes(v as T)

export function validateProgress(
  file: unknown,
  ctx: { slug: string; buildDay: IsoDay }
): string[] {
  const at = `"${ctx.slug}" progress.json`
  if (!isRecord(file)) return [`${at} is not a JSON object`]
  const errors: string[] = []
  const readable = READABLE.includes(file.schema as number)
  if (!readable) {
    errors.push(
      `${at} uses schema ${JSON.stringify(file.schema)}; kcb.pro reads schema ${READABLE.join(' or ')}`
    )
  }
  if (file.project !== ctx.slug) {
    errors.push(
      `${at} names project ${JSON.stringify(file.project)}; it must be "${ctx.slug}"`
    )
  }
  // The entry rules below are v1's; another schema's entries are not judged.
  if (!readable) return errors
  if (!Array.isArray(file.entries))
    return [...errors, `${at} needs an entries list`]

  const ids = new Set<string>()
  let latest = ''
  file.entries.forEach((entry: unknown, index) => {
    if (!isRecord(entry)) {
      errors.push(`${at} entry ${index + 1} is not an object`)
      return
    }
    const where = `${at} entry ${isText(entry.id) ? `"${entry.id}"` : index + 1}`
    errors.push(...entryErrors(entry, where, ctx.buildDay))
    if (isText(entry.id)) {
      if (ids.has(entry.id)) errors.push(`${where} repeats an earlier id`)
      ids.add(entry.id)
    }
    // A future-dated entry is already an error; it must not move the baseline.
    const { date } = entry
    if (typeof date === 'string' && isIsoDay(date) && date <= ctx.buildDay) {
      if (date < latest) {
        errors.push(`${where} is out of order; entries go oldest first`)
      } else {
        latest = date
      }
    }
  })
  return errors
}

function entryErrors(e: Fields, where: string, buildDay: IsoDay): string[] {
  const errors: string[] = []
  if (!isText(e.id) || /\s/.test(e.id)) {
    errors.push(`${where} needs an id with no spaces`)
  }
  if (!isText(e.subject)) errors.push(`${where} needs a subject`)
  if (typeof e.date !== 'string' || !isIsoDay(e.date)) {
    errors.push(`${where} needs a date as YYYY-MM-DD`)
  } else if (e.date > buildDay) {
    errors.push(`${where} is dated ${e.date}, after the build day ${buildDay}`)
  }
  if (!isOneOf(PROGRESS_KINDS, e.kind)) {
    errors.push(`${where} has an unknown kind ${JSON.stringify(e.kind)}`)
  }
  if (!isText(e.title)) errors.push(`${where} needs a title`)
  const needsMark = NEEDS_PASS_MARK.includes(e.kind as string)
  if (needsMark && !isText(e.passMark)) {
    errors.push(`${where} needs a passMark, set before the result`)
  } else if (!needsMark && e.passMark !== undefined && !isText(e.passMark)) {
    errors.push(`${where} passMark is blank; omit it or fill it in`)
  }
  if (!isOneOf(PROGRESS_RESULTS, e.result)) {
    errors.push(`${where} has an unknown result ${JSON.stringify(e.result)}`)
  }
  if (e.summary !== undefined && !isShortLine(e.summary)) {
    errors.push(`${where} needs a summary of one line, 1 to 140 characters`)
  } else if (e.summary === undefined && e.result === 'partial') {
    errors.push(
      `${where} is partial, so it needs a summary of what works and what is left`
    )
  }
  const measured =
    Array.isArray(e.measured) &&
    e.measured.every((m) => isRecord(m) && isText(m.label) && isText(m.value))
  if (!measured) {
    errors.push(`${where} needs measured as a list of { label, value }`)
  }
  if (!Array.isArray(e.evidence)) {
    errors.push(`${where} needs an evidence list`)
  } else {
    for (const item of e.evidence) {
      const problem = evidenceProblem(item)
      if (problem) errors.push(`${where} evidence ${problem}`)
    }
    if (e.evidence.length === 0 && e.result !== 'not-run') {
      errors.push(`${where} needs evidence unless its result is not-run`)
    }
    const linksPath = e.evidence.some(
      (item) => isRecord(item) && 'path' in item
    )
    if (linksPath && !isText(e.commit)) {
      errors.push(`${where} links a repository path, so it needs a commit`)
    }
  }
  if (
    e.commit !== undefined &&
    !(typeof e.commit === 'string' && HASH.test(e.commit))
  ) {
    errors.push(
      `${where} has a commit that is not a hash: ${JSON.stringify(e.commit)}`
    )
  }
  return errors
}

function evidenceProblem(item: unknown): string | null {
  if (!isRecord(item) || !isText(item.label)) return 'needs a label'
  const name = `"${item.label}"`
  if ('path' in item === 'url' in item) {
    return `${name} needs exactly one of path or url`
  }
  if ('url' in item) {
    const https =
      typeof item.url === 'string' && /^https:\/\/\S+$/.test(item.url)
    return https ? null : `${name} needs an https url`
  }
  const path = item.path
  const inside =
    isText(path) && !path.startsWith('/') && !path.split('/').includes('..')
  return inside ? null : `${name} needs a path inside the repository`
}

const isCommit = (c: unknown) =>
  isRecord(c) &&
  typeof c.sha === 'string' &&
  HASH.test(c.sha) &&
  typeof c.date === 'string' &&
  isIsoDay(c.date) &&
  isOneOf(COMMIT_TYPES, c.type) &&
  isText(c.subject) &&
  typeof c.url === 'string' &&
  c.url.startsWith('https://')

export function validateCommits(commits: unknown, slug: string): string[] {
  if (!Array.isArray(commits)) return [`"${slug}" commits are not a list`]
  return commits.flatMap((c: unknown, i) =>
    isCommit(c)
      ? []
      : [
          `"${slug}" commit ${i + 1} is not a { sha, date, type, subject, url } record`,
        ]
  )
}

// Latest entry per subject on or before day, newest first; a later same-day entry wins.
export function current<E extends PublicEntry>(entries: E[], day: IsoDay): E[] {
  const latest = new Map<string, number>()
  entries.forEach((entry, index) => {
    if (entry.date > day) return
    const seen = latest.get(entry.subject)
    if (seen === undefined || entry.date >= entries[seen].date) {
      latest.set(entry.subject, index)
    }
  })
  return [...latest.values()]
    .sort((a, b) => entries[b].date.localeCompare(entries[a].date) || b - a)
    .map((index) => entries[index])
}

export interface ProgressCounts {
  proven: number
  partial: number
  failed: number
  open: number
}

const COUNTED_AS: Record<ProgressResult, keyof ProgressCounts> = {
  pass: 'proven',
  partial: 'partial',
  fail: 'failed',
  'not-run': 'open',
}

export function progressCounts(
  entries: PublicEntry[],
  day: IsoDay
): ProgressCounts {
  const counts = { proven: 0, partial: 0, failed: 0, open: 0 }
  for (const entry of current(entries, day)) counts[COUNTED_AS[entry.result]]++
  return counts
}

// Any failure fails the project; anything short of all passing is partial.
export function overallSeal(
  entries: PublicEntry[],
  day: IsoDay
): ProgressResult | null {
  const results = current(entries, day).map((e) => e.result)
  if (results.length === 0) return null
  if (results.includes('fail')) return 'fail'
  return results.every((r) => r === 'pass') ? 'pass' : 'partial'
}

const QUIET_AFTER_DAYS = 30

export function quietSince(entries: PublicEntry[], day: IsoDay): IsoDay | null {
  const newest = entries
    .map((e) => e.date)
    .filter((d) => d <= day)
    .sort()
    .at(-1)
  return newest !== undefined && daysBetween(newest, day) > QUIET_AFTER_DAYS
    ? newest
    : null
}

export const STATUS_WORD: Record<ProgressResult, string> = {
  pass: 'Done',
  partial: 'In progress',
  'not-run': 'Up next',
  fail: 'Rethinking',
}

// Group order on every progress view.
export const STATUS_ORDER: readonly ProgressResult[] = [
  'pass',
  'partial',
  'not-run',
  'fail',
]

// Current step per subject: by status group, then oldest first, then file order.
export function journeySteps<E extends PublicEntry>(
  entries: E[],
  day: IsoDay
): E[] {
  const group = (e: E) => STATUS_ORDER.indexOf(e.result)
  return current(entries, day)
    .map((entry) => ({ entry, index: entries.indexOf(entry) }))
    .sort(
      (a, b) =>
        group(a.entry) - group(b.entry) ||
        a.entry.date.localeCompare(b.entry.date) ||
        a.index - b.index
    )
    .map(({ entry }) => entry)
}

// First Up next step, else the first In progress one.
export function nextStep<E extends PublicEntry>(steps: E[]): E | undefined {
  return (
    steps.find((s) => s.result === 'not-run') ??
    steps.find((s) => s.result === 'partial')
  )
}

// A step's superseded entries, newest first; a later same-day entry comes first.
export function earlierEntries<E extends PublicEntry>(
  entries: E[],
  step: E,
  day: IsoDay
): E[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(
      ({ entry }) =>
        entry.subject === step.subject &&
        entry.id !== step.id &&
        entry.date <= day
    )
    .sort(
      (a, b) => b.entry.date.localeCompare(a.entry.date) || b.index - a.index
    )
    .map(({ entry }) => entry)
}

const RESULT_LABELS: Record<ProgressResult, string> = {
  pass: 'Pass',
  partial: 'Partial',
  fail: 'Fail',
  'not-run': 'Not run',
}

export const resultLabel = (result: ProgressResult) => RESULT_LABELS[result]

const KIND_LABELS: Record<ProgressKind, string> = {
  experiment: 'Experiment',
  tests: 'Tests',
  release: 'Release',
  milestone: 'Milestone',
}

export const kindLabel = (kind: ProgressKind) => KIND_LABELS[kind]

// A path is linked at the commit that recorded it, so the link never drifts.
export function evidenceHref(
  item: Evidence,
  repo: string,
  commit?: string
): string {
  if ('url' in item) return item.url
  if (!commit) throw new Error(`Evidence "${item.path}" needs a commit`)
  const path = item.path.split('/').map(encodeURIComponent).join('/')
  return `https://github.com/${repo}/blob/${commit}/${path}`
}
