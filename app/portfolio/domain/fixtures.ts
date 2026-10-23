import type { Commit, ProgressEntry, ProgressFile } from './progress'
import type { Catalog, Project, Study } from './types'

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
