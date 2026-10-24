import { content, profile } from '@app/portfolio/content'
import { findProject, nowBuilding } from '@app/portfolio/domain/catalog'
import { formatLongDay, formatMonth } from '@app/portfolio/domain/dates'
import { formatLabel, statusLine } from '@app/portfolio/domain/status'
import type { IsoDay, Project } from '@app/portfolio/domain/types'

type Pair = [string, string]

interface Chapter {
  title: string
  summary: string
  about: string
  status: string
  notes: Pair[]
  facts: Pair[]
  // The project's page in 2D.
  path: string
}

export interface TomeData {
  name: string
  role: string
  asOf: string
  nowBuilding: string
  about: string[]
  contactLine: string
  contact: { label: string; value: string; href: string }[]
  studies: {
    slug: string
    title: string
    short: string
    why: string
    when: string
    format: string
    path: string
  }[]
  chapters: {
    bezl: Chapter
    kbui: Chapter
  }
}

function project(slug: string): Project {
  const p = findProject(content.projects, slug)
  if (!p) throw new Error(`Tome chapter needs project "${slug}"`)
  return p
}

function chapter(
  slug: string,
  asOf: IsoDay,
  notes: Pair[],
  facts: Pair[]
): Chapter {
  const p = project(slug)
  return {
    title: p.title,
    summary: p.summary,
    about: p.about,
    status: statusLine(p, asOf),
    notes,
    facts,
    path: `/work/${p.slug}`,
  }
}

// Page-sized copy: the briefs say it in full on each project page.
const STUDY_NOTES: Record<string, { short: string; why: string }> = {
  'figma-canvas': {
    short: 'Figma canvas',
    why: 'Smooth dragging and zooming is the hardest part of any canvas, and Figma manages it with many people on screen at once.',
  },
  'map-labels': {
    short: 'Map labels',
    why: 'Labels that make room without flickering are one of the hardest parts of a map, and few people explain how it’s done.',
  },
  'benefits-application': {
    short: 'Benefits form',
    why: 'A form millions of people have to fill in, rebuilt to work on a phone and survive a dropped signal.',
  },
}

export function tomeData(asOf: IsoDay): TomeData {
  const live = nowBuilding(content.projects)
  return {
    name: profile.name,
    role: profile.role,
    asOf: formatLongDay(asOf),
    nowBuilding: live?.title ?? 'Between projects',
    about: [
      'I’m a frontend engineer in Los Angeles, and I’ve spent more than five years building product interfaces. This book is my side work: Bezl, a desktop app that runs AI coding assistants side by side, and kbui, the design system my projects share.',
    ],
    contactLine:
      'Email is the best way to reach me. My résumé has the full story.',
    contact: [
      { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
      { label: 'LinkedIn', value: 'in/khallilbailey', href: profile.linkedin },
      { label: 'GitHub', value: 'github.com/KhallilB', href: profile.github },
      { label: 'Résumé', value: 'Download the PDF', href: profile.resume },
    ],
    studies: content.studies.map((s) => ({
      slug: s.slug,
      title: s.title,
      ...STUDY_NOTES[s.slug],
      when: formatMonth(s.startsOn),
      format: formatLabel(s.format),
      path: `/studies/${s.slug}`,
    })),
    chapters: {
      bezl: chapter(
        'bezl',
        asOf,
        [
          [
            'The problem',
            'Several AI coding assistants on one codebase step on each other, and afterwards nobody can say who changed what.',
          ],
          [
            'One writer',
            'On each task, one assistant can change the code and the rest can only read it. Each tool’s own sandbox enforces that.',
          ],
          [
            'Proven so far',
            'Three terminals each took a 20 MB stream without losing a byte, and typing stayed at 2 ms. Memory use is still an open question.',
          ],
        ],
        [
          ['Built with', 'Tauri · Rust · React'],
          ['Data', 'On your machine'],
          ['Started', 'Oct 2026'],
        ]
      ),
      kbui: chapter(
        'kbui',
        asOf,
        [
          [
            'The idea',
            'Every design value lives in one file, the styles are plain CSS any framework can use, and React only adds behaviour.',
          ],
          [
            'Kept honest',
            'Every stylesheet starts with a line listing the classes it uses, and the build fails if that line is missing.',
          ],
          [
            'Checked',
            'Every component is opened in a real browser and checked for accessibility problems on each run.',
          ],
        ],
        [
          ['Built with', 'CSS · React · Base UI'],
          ['Used by', 'One other app; Bezl next'],
          ['Started', 'Oct 2026'],
        ]
      ),
    },
  }
}
