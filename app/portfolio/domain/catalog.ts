import type { Catalog, Project, ProjectStatus } from './types'

const byOrder = (a: Project, b: Project) => a.order - b.order

export function nowBuilding(projects: Project[]): Project | undefined {
  return projects
    .filter((p) => p.kind === 'endeavor' && p.status === 'in-progress')
    .sort(byOrder)[0]
}

export function featured(projects: Project[]): Project[] {
  return projects.filter((p) => p.kind === 'endeavor').sort(byOrder)
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
