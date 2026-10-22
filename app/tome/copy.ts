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
    why: 'All three projects need smooth dragging and zooming: the map, the frame strip and the version timeline.',
  },
  'map-labels': {
    short: 'Map labels',
    why: 'Labels that make room without flickering are the hardest part of Wander’s map, and few people explain how it’s done.',
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
      'I build web apps that do real work. I chose each project in this book to learn one hard area of engineering: desktop apps, real-time games, and maps made from open data.',
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
      deckWorkshop: chapter(
        'deck-workshop',
        asOf,
        [
          [
            'The problem',
            'Players tweak decks by feel and overwrite the old list, so nobody knows if the last change helped.',
          ],
          [
            'How it works',
            'The app reads the game’s log as you play and files each game under the deck version you used.',
          ],
          [
            'Honest numbers',
            'With fewer than twenty games it says so, and every win rate shows how sure it is.',
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
            'Every fighter is a text file: moves, inputs, animations and hits. Change a move and fight with it seconds later.',
          ],
          [
            'Same every time',
            'The same button presses give the same fight in every browser, checked by replaying matches frame by frame.',
          ],
          [
            'Art',
            'Free-to-use characters and arena from Kenney. Nothing borrowed without permission.',
          ],
        ],
        [
          ['Area', 'Real-time games'],
          ['Hard part', 'WebGPU'],
          ['Season', 'Jan to Mar 2027'],
        ]
      ),
      wander: chapter(
        'wander',
        asOf,
        [
          [
            'The problem',
            'Maps tell you how to get there. Wander tells you what this place is, what was here, and what that tree is.',
          ],
          [
            'Launch cities',
            'New York, London, Paris, San Francisco and Melbourne, with every dataset’s licence checked first.',
          ],
          [
            'Works offline',
            'Each city’s map is saved ahead of time, so a walk keeps working when the signal drops.',
          ],
        ],
        [
          ['Area', 'Maps'],
          ['Hard part', 'Offline maps'],
          ['Season', 'Apr to Jun 2027'],
        ]
      ),
    },
  }
}
