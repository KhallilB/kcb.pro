import type { BriefSection, Catalog, Media } from './types'

// Placeholder copy is a launch blocker: the site must never show it.
const PLACEHOLDER =
  /\b(tbd|todo|lorem ipsum|your name|coming soon|placeholder)\b/i

export const hasPlaceholder = (text: string) => PLACEHOLDER.test(text)

const DESTINATION = /^(https?:\/\/|\/)\S+/

const isSize = (n: number) => Number.isInteger(n) && n > 0

function mediaErrors(slug: string, media: Media): string[] {
  const errors: string[] = []
  // Content is typed, but alt may still arrive empty or missing from hand edits.
  if (!media.alt?.trim()) errors.push(`"${slug}" media needs alt text`)
  if (!isSize(media.width) || !isSize(media.height)) {
    errors.push(`"${slug}" media needs a width and height`)
  }
  if (!DESTINATION.test(media.src)) errors.push(`"${slug}" media has no source`)
  return errors
}

function texts(fields: Array<string | undefined>, brief: BriefSection[]) {
  return [
    ...fields,
    ...brief.flatMap((section) => [section.heading, ...section.body]),
  ].filter((text): text is string => Boolean(text))
}

export function validateCatalog(catalog: Catalog): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  const slugs = [
    ...catalog.projects.map((p) => p.slug),
    ...catalog.studies.map((s) => s.slug),
  ]
  for (const slug of slugs) {
    if (seen.has(slug)) errors.push(`Duplicate slug "${slug}"`)
    seen.add(slug)
  }

  for (const p of catalog.projects) {
    const words = texts(
      [
        p.title,
        p.summary,
        p.about,
        p.role,
        p.domain,
        p.signature,
        p.media?.alt,
        ...p.stack,
      ],
      p.brief
    )
    for (const text of words) {
      if (PLACEHOLDER.test(text)) {
        errors.push(`"${p.slug}" has placeholder text: ${text}`)
      }
    }
    if (!p.about.trim()) errors.push(`"${p.slug}" needs an about paragraph`)
    if (p.status === 'shipped' && !p.shippedOn) {
      errors.push(`"${p.slug}" is shipped but has no shippedOn date`)
    }
    for (const link of p.links) {
      if (!DESTINATION.test(link.href)) {
        errors.push(`"${p.slug}" has a link with no destination: ${link.label}`)
      }
    }
    if (p.media) errors.push(...mediaErrors(p.slug, p.media))
  }

  const projectSlugs = new Set(catalog.projects.map((p) => p.slug))
  const hiddenSlugs = new Set(
    catalog.projects.filter((p) => p.listed === false).map((p) => p.slug)
  )
  for (const s of catalog.studies) {
    const words = texts(
      [s.title, s.question, s.about, s.builtSlice, s.kitPiece],
      s.brief
    )
    for (const text of words) {
      if (PLACEHOLDER.test(text)) {
        errors.push(`Study "${s.slug}" has placeholder text: ${text}`)
      }
    }
    if (!s.about.trim()) errors.push(`Study "${s.slug}" needs an about paragraph`)
    for (const fed of s.feeds) {
      if (!projectSlugs.has(fed)) {
        errors.push(`Study "${s.slug}" feeds unknown project "${fed}"`)
      } else if (hiddenSlugs.has(fed)) {
        errors.push(`Study "${s.slug}" feeds hidden project "${fed}"`)
      }
    }
  }

  return errors
}
