import { addDays } from './dates'
import {
  ACTIVITY_DAYS,
  type Commit,
  type DayCount,
  type ProgressEntry,
  type ProgressFile,
  type PublicEntry,
  type PublicProgress,
} from './progress'
import type { Catalog, IsoDay, Media, Project, Study } from './types'

export function image(overrides: Partial<Media> = {}): Media {
  return {
    kind: 'image',
    src: '/media/alpha.png',
    alt: 'The Alpha window with one task open.',
    width: 1600,
    height: 900,
    ...overrides,
  }
}

export function project(overrides: Partial<Project> = {}): Project {
  return {
    slug: 'alpha',
    kind: 'endeavor',
    title: 'Alpha',
    summary: 'Does one useful thing.',
    about: 'A small tool that does one useful thing well.',
    status: 'planned',
    startsOn: '2027-01-04',
    order: 1,
    role: 'Design and engineering',
    stack: ['TypeScript'],
    domain: 'One hard domain.',
    signature: 'One signature component.',
    links: [],
    brief: [{ heading: 'The problem', body: ['A real problem.'] }],
    ...overrides,
  }
}

export function study(overrides: Partial<Study> = {}): Study {
  return {
    slug: 'study-one',
    title: 'Study one',
    format: 'teardown',
    question: 'Why does it work?',
    about: 'A one-week look at how one interface works.',
    builtSlice: 'A slice.',
    kitPiece: 'A piece.',
    feeds: [],
    startsOn: '2026-11-02',
    status: 'planned',
    brief: [{ heading: 'What I inspect', body: ['Behaviour.'] }],
    ...overrides,
  }
}

export function catalog(projects: Project[], studies: Study[] = []): Catalog {
  return { projects, studies }
}

export function entry(overrides: Partial<ProgressEntry> = {}): ProgressEntry {
  return {
    id: '2026-10-20-alpha',
    subject: 'alpha',
    date: '2026-10-20',
    kind: 'experiment',
    title: 'Alpha holds up',
    passMark: 'Under 100 ms',
    result: 'pass',
    measured: [{ label: 'Median', value: '40 ms' }],
    evidence: [{ label: 'RESULT.md', path: 'spikes/alpha/RESULT.md' }],
    commit: '01e47db',
    ...overrides,
  }
}

export function progressFile(
  entries: ProgressEntry[],
  overrides: Partial<ProgressFile> = {}
): ProgressFile {
  return { schema: 1, project: 'alpha', entries, ...overrides }
}

export function commit(overrides: Partial<Commit> = {}): Commit {
  return {
    sha: '01e47db',
    date: '2026-10-20',
    type: 'feat',
    subject: 'feat: add alpha',
    url: 'https://github.com/KhallilB/alpha/commit/01e47db',
    ...overrides,
  }
}

// The days a page ships, ending on end; days not named count none.
export function days(
  end: IsoDay,
  counts: Record<IsoDay, number> = {}
): DayCount[] {
  return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const day = addDays(end, i + 1 - ACTIVITY_DAYS)
    return { day, count: counts[day] ?? 0 }
  })
}

export function publicEntry(overrides: Partial<PublicEntry> = {}): PublicEntry {
  return {
    id: '2026-10-20-alpha',
    subject: 'alpha',
    date: '2026-10-20',
    title: 'Alpha holds up',
    result: 'pass',
    ...overrides,
  }
}

// Shipped progress as of 2026-10-21, the day Vitest pins.
export function publicProgress(
  entries: PublicEntry[] = [],
  counts: Record<IsoDay, number> = {}
): PublicProgress {
  return { entries, days: days('2026-10-21', counts) }
}
