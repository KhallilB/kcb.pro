import { content, profile } from '@app/portfolio/content'
import { findProject } from '@app/portfolio/domain/catalog'

export interface PageMeta {
  title: string
  description: string
  status: 200 | 404
}

const DEFAULT_DESCRIPTION =
  'Frontend engineer in Los Angeles with more than five years of building product interfaces. What I’m building now, with a date on everything.'

const titled = (name: string) => `${name} · ${profile.name}`

export function pageMeta(path: string): PageMeta {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
  const [, section, slug, ...rest] = clean.split('/')
  const ok = (title: string, description = DEFAULT_DESCRIPTION): PageMeta => ({
    title,
    description,
    status: 200,
  })
  const notFound: PageMeta = {
    title: titled('Not found'),
    description: DEFAULT_DESCRIPTION,
    status: 404,
  }
  if (rest.length > 0) return notFound

  if (clean === '/') return ok(profile.name)
  if (section === 'about' && !slug) return ok(titled('About'))
  if (section === 'work') {
    if (!slug) return ok(titled('Work'))
    const project = findProject(content.projects, slug)
    return project ? ok(titled(project.title), project.summary) : notFound
  }
  if (section === 'studies') {
    if (!slug) return ok(titled('Work studies'))
    const study = content.studies.find((s) => s.slug === slug)
    return study ? ok(titled(study.title), study.question) : notFound
  }
  return notFound
}
