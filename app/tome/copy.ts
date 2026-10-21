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
    deckWorkshop: Chapter
    mugenArena: Chapter
    wander: Chapter
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
    why: 'Its gesture layer is the one thing all three endeavors need: the map, the frame strip and the version rail.',
  },
  'map-labels': {
    short: 'Map labels',
    why: 'Labels that yield without flicker are the hardest part of Wander’s map, and nobody has written down how they work.',
  },
  'benefits-application': {
    short: 'Benefits form',
    why: 'Software millions are forced to use, rebuilt to survive a phone and a lost signal, with a memo an agency could act on.',
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
      'I build deep, useful web apps. Each project in this book was chosen to learn one hard engineering domain: local-first desktop software, real-time simulation, and maps built from open data.',
      'Every claim here carries the date it was last true. If something is unfinished, it says so.',
    ],
    contactLine:
      'I am looking for frontend roles where the hard part is the interface.',
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
      deckWorkshop: chapter(
        'deck-workshop',
        asOf,
        [
          [
            'The problem',
            'Players tune decks by feel and paste over the old list, so nobody knows whether the last change helped.',
          ],
          [
            'The approach',
            'A Rust watcher tails the game’s log and files every game under the version that played it.',
          ],
          [
            'The proof',
            'A record under twenty games says so, and a rate always comes with its range.',
          ],
        ],
        [
          ['Built with', 'Tauri · Rust · Svelte'],
          ['Data', 'On your machine'],
          ['Season', 'Sep to Dec 2026'],
        ]
      ),
      mugenArena: chapter(
        'mugen-arena',
        asOf,
        [
          [
            'The idea',
            'Every fighter is a text file: states, commands, animations and hits. Edit a move and fight with it seconds later.',
          ],
          [
            'Determinism',
            'The same inputs give the same frames in every browser, proven by replaying a match and comparing state hashes.',
          ],
          [
            'Assets',
            'Kenney’s CC0 characters and arena. Nothing from anyone who did not license it.',
          ],
        ],
        [
          ['Domain', 'Simulation'],
          ['Boundary', 'WebGPU'],
          ['Season', 'Jan to Mar 2027'],
        ]
      ),
      wander: chapter(
        'wander',
        asOf,
        [
          [
            'The problem',
            'Maps answer how to get there. Wander answers what this place is, what was here, and what that tree is.',
          ],
          [
            'Launch cities',
            'New York, London, Paris, San Francisco and Melbourne, each dataset license-checked first.',
          ],
          [
            'Offline',
            'Each city compiles to static tiles, so a walk keeps working when the signal drops.',
          ],
        ],
        [
          ['Domain', 'Geospatial'],
          ['Boundary', 'Offline tiles'],
          ['Season', 'Apr to Jun 2027'],
        ]
      ),
    },
  }
}
