import { content, profile } from '@app/portfolio/content'
import { findProject } from '@app/portfolio/domain/catalog'

export interface PageMeta {
  title: string
  description: string
  status: 200 | 404
}

const DEFAULT_DESCRIPTION =
  'Frontend engineer in Los Angeles with more than five years of building product interfaces.'

const titled = (name: string) => `${name} · ${profile.name}`
const withoutTrailingSlash = (path: string) =>
  path.length > 1 ? path.replace(/\/+$/, '') : path

export const escapeAttr = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const ORIGIN = 'https://kcb.pro'
// public/og.png, captured by scripts/capture-og.ts.
const SHARE_IMAGE = { path: '/og.png', width: 1200, height: 630 }
const SHARE_ALT =
  'An open book floating in pale clouds: a title page for Khallil Bailey, frontend engineer, and a contents page with coloured ribbons.'

// Open Graph and Twitter tags; Twitter reads og:* for anything it lacks.
export function socialTags(path: string): string {
  const meta = pageMeta(path)
  if (meta.status !== 200) return ''
  const tags: [string, string, string | number][] = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', profile.name],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', meta.description],
    ['property', 'og:url', ORIGIN + withoutTrailingSlash(path)],
    ['property', 'og:image', ORIGIN + SHARE_IMAGE.path],
    ['property', 'og:image:width', SHARE_IMAGE.width],
    ['property', 'og:image:height', SHARE_IMAGE.height],
    ['property', 'og:image:alt', SHARE_ALT],
    ['name', 'twitter:card', 'summary_large_image'],
  ]
  return tags
    .map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escapeAttr(String(value))}" />`)
    .join('\n    ')
}

export function pageMeta(path: string): PageMeta {
  const clean = withoutTrailingSlash(path)
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
