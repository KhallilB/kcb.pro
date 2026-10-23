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
}

export interface TomeData {
  name: string
  role: string
  asOf: string
  nowBuilding: string
  about: string[]
  contactLine: string
  github: { label: string; href: string }
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
      'I build web apps that do real work. This book holds the two things I am building now: Bezl, a desktop app for running AI coding assistants side by side, and kbui, the design system my projects share.',
      'Everything here shows the date it was last true. If something isn’t finished, it says so.',
    ],
    contactLine:
      'I’m looking for frontend roles where the interface is the hard part.',
    github: { label: 'github.com/KhallilB', href: profile.github },
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
            'Each task has one assistant that may write and any number that may only read, to be held in place by each tool’s own sandbox.',
          ],
          [
            'Proven so far',
            'No terminal output was dropped on the way to the window, and typing echoes with no noticeable delay. Memory is the open question.',
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
            'One set of tokens, plain CSS that any framework can render, and a thin React layer for behaviour.',
          ],
          [
            'The contract',
            'Each stylesheet opens with an anatomy line naming its classes and attributes. The build fails when it is missing.',
          ],
          [
            'Checked',
            'Every story is rendered in a real browser and scanned for accessibility problems on each run.',
          ],
        ],
        [
          ['Built with', 'CSS · React · Base UI'],
          ['Used by', 'loupe; Bezl, in progress'],
          ['Started', 'Oct 2026'],
        ]
      ),
    },
  }
}
