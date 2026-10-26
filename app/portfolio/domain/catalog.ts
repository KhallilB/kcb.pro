import type { Catalog, Project, ProjectStatus, Study } from './types'

const byOrder = (a: Project, b: Project) => a.order - b.order

export function published(catalog: Catalog): Catalog {
  return {
    projects: catalog.projects.filter((p) => p.listed !== false),
    studies: catalog.studies,
  }
}

export function nowBuilding(projects: Project[]): Project | undefined {
  return projects
    .filter((p) => p.kind === 'endeavor' && p.status === 'in-progress')
    .sort(byOrder)[0]
}

export function featured(projects: Project[]): Project[] {
  return projects
    .filter(
      (p) => p.kind === 'endeavor' && p.listed !== false && p.rank !== undefined
    )
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
}

// Listed projects with a repo; each must publish a valid progress.json.
export function registered(
  projects: Project[]
): { slug: string; repo: string }[] {
  return projects.flatMap((p) =>
    p.repo && p.listed !== false ? [{ slug: p.slug, repo: p.repo }] : []
  )
}

const RANK: Record<ProjectStatus, number> = {
  'in-progress': 0,
  planned: 1,
  shipped: 2,
}

// Live now, then next by start, then done by most recently shipped.
export function workIndex(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const rank = RANK[a.status] - RANK[b.status]
    if (rank !== 0) return rank
    if (a.status === 'shipped') {
      return (b.shippedOn ?? '').localeCompare(a.shippedOn ?? '')
    }
    if (a.status === 'in-progress') return byOrder(a, b)
    return a.startsOn.localeCompare(b.startsOn)
  })
}

// Home lists finished studies only; planned ones read as a to-do list.
export function finishedStudies(studies: Study[]): Study[] {
  return studies
    .filter((s) => s.status === 'shipped')
    .sort((a, b) => (b.shippedOn ?? '').localeCompare(a.shippedOn ?? ''))
}

export function findProject(projects: Project[], slug: string) {
  return projects.find((p) => p.slug === slug)
}

export function sitePaths(catalog: Catalog): string[] {
  return [
    '/',
    '/work',
    ...workIndex(catalog.projects).map((p) => `/work/${p.slug}`),
    '/studies',
    ...catalog.studies.map((s) => `/studies/${s.slug}`),
    '/about',
  ]
}
