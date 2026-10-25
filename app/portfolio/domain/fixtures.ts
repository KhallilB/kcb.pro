import type { Catalog, Media, Project, Study } from './types'

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
