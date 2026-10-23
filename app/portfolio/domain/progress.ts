import { isIsoDay } from './dates'
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
