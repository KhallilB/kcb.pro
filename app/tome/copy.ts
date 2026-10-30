import { content, profile } from '@app/portfolio/content'
import { findProject, nowBuilding } from '@app/portfolio/domain/catalog'
import { formatLongDay, formatMonth } from '@app/portfolio/domain/dates'
import { formatLabel, statusLine } from '@app/portfolio/domain/status'
import type { IsoDay, Link, Project } from '@app/portfolio/domain/types'

type Pair = [string, string]

interface Chapter {
  title: string
  summary: string
  about: string
  // One line, for the contents page.
  shelf: string
  status: string
  notes: Pair[]
  facts: Pair[]
  links: Link[]
  // First shot, tipped into the chapter page; absent until the project has one.
  plate?: { src: string; caption?: string }
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
  shelf: string,
  notes: Pair[],
  facts: Pair[]
): Chapter {
  const p = project(slug)
  // Videos have no still to print, so only an image becomes a plate.
  const shot = p.media?.find((m) => m.kind === 'image')
  return {
    title: p.title,
    summary: p.summary,
    about: p.about,
    shelf,
    status: statusLine(p, asOf),
    notes,
    facts,
    links: p.links,
    plate: shot && { src: shot.src, caption: shot.caption },
    path: `/work/${p.slug}`,
  }
}

// Page-sized copy: the briefs say it in full on each project page.
const STUDY_NOTES: Record<string, { short: string; why: string }> = {
  'terminal-speed': {
    short: 'Fast terminal',
    why: 'Each AI assistant gets a terminal of its own, so a terminal has to stay smooth and small however much it prints.',
  },
  'review-signal': {
    short: 'Review triage',
    why: 'AI reviewers are right often enough to help and wrong often enough to waste time. Showing less may be the fix.',
  },
  'safe-fixes': {
    short: 'Safe fixes',
    why: 'A design rule only helps an agent if the agent knows which fixes it can apply without asking.',
  },
  'read-only': {
    short: 'Read-only',
    why: 'A reviewer told not to edit can still edit. I want a limit the operating system enforces.',
  },
  'trusted-checker': {
    short: 'Trusted checks',
    why: 'A rule that’s wrong too often gets ignored, and then the right ones get ignored with it.',
  },
  'decision-or-luck': {
    short: 'Choice or luck',
    why: 'In a simulation, a result only feels fair if you can see whether the choice or the dice decided it.',
  },
  'merge-queue': {
    short: 'Merge queue',
    why: 'Splitting work across assistants only pays off if their changes can land together safely.',
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
        'A desktop app for AI coding assistants',
        [
          [
            'The problem',
            'Put a few AI coding assistants on one codebase and they get in each other’s way. Afterwards, nobody can tell who changed what.',
          ],
          [
            'One writer',
            'On every task, one assistant can change the code and the rest can only read it. Each tool’s own sandbox is meant to enforce that. So far I’ve confirmed it for Codex.',
          ],
          [
            'So far',
            'The first build is out: the window, a live terminal and the task screen, on sample data. No assistant runs inside it yet.',
          ],
        ],
        [
          ['Built with', 'Tauri · Rust · React'],
          ['Data', 'Stays on your machine'],
          ['To try', 'Download the build'],
        ]
      ),
      kbui: chapter(
        'kbui',
        asOf,
        'The design system behind my projects',
        [
          [
            'The idea',
            'Every design value lives in one file. The styles are plain CSS that any framework can use, and React just adds the behaviour.',
          ],
          [
            'The contract',
            'Each stylesheet starts with a line listing the classes it uses. If that line is missing, the build fails.',
          ],
          [
            'Checked',
            'Every component is opened in a real browser and checked for accessibility problems on every run.',
          ],
        ],
        [
          ['Built with', 'CSS · React · Base UI'],
          ['Used by', 'This site and Bezl'],
          ['To try', 'Open the component site'],
        ]
      ),
    },
  }
}
