import type { BriefSection, Catalog, Media } from './types'
import { isShortLine } from './text'

// Placeholder copy is a launch blocker: the site must never show it.
const PLACEHOLDER =
  /\b(tbd|todo|lorem ipsum|your name|coming soon|placeholder)\b/i

const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/

export const hasPlaceholder = (text: string) => PLACEHOLDER.test(text)

const DESTINATION = /^(https?:\/\/|\/)\S+/

const isSize = (n: number) => Number.isInteger(n) && n > 0

function mediaErrors(slug: string, media: Media, index: number): string[] {
  const errors: string[] = []
  const shot = `"${slug}" shot ${index + 1}`
  // Content is typed, but alt may still arrive empty or missing from hand edits.
  if (!media.alt?.trim()) errors.push(`${shot} needs alt text`)
  if (!isSize(media.width) || !isSize(media.height)) {
    errors.push(`${shot} needs a width and height`)
  }
  if (!DESTINATION.test(media.src)) errors.push(`${shot} has no source`)
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
        p.goal,
        p.about,
        p.role,
        p.domain,
        p.signature,
        ...(p.media ?? []).flatMap((m) => [m.alt, m.caption]),
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
    if (p.repo !== undefined && !REPO.test(p.repo)) {
      errors.push(`"${p.slug}" has a repo that is not owner/name: ${p.repo}`)
    }
    if (p.repo !== undefined && p.goal === undefined) {
      errors.push(`"${p.slug}" has a repo, so it needs a goal sentence`)
    } else if (p.goal !== undefined && !isShortLine(p.goal)) {
      errors.push(`"${p.slug}" needs a goal of one line, 1 to 140 characters`)
    }
    if (p.rank !== undefined && (p.kind !== 'endeavor' || p.listed === false)) {
      errors.push(`"${p.slug}" has a rank but is not a listed endeavor`)
    }
    p.media?.forEach((m, i) => errors.push(...mediaErrors(p.slug, m, i)))
  }

  const byRank = new Map<number, string[]>()
  for (const p of catalog.projects) {
    if (p.rank !== undefined)
      byRank.set(p.rank, [...(byRank.get(p.rank) ?? []), p.slug])
  }
  for (const [rank, rankSlugs] of byRank) {
    if (rankSlugs.length > 1) {
      errors.push(
        `Rank ${rank} is used by ${rankSlugs.map((s) => `"${s}"`).join(' and ')}`
      )
    }
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
