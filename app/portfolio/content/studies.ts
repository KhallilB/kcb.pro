import type { Study } from '../domain/types'

export const studies: Study[] = [
  {
    slug: 'figma-canvas',
    title: 'Figma’s canvas pan, zoom and multiplayer cursors',
    format: 'teardown',
    question:
      'How does an infinite canvas stay crisp and smooth with other people on it?',
    builtSlice:
      'Pan, pinch-zoom, wheel normalization and cursor presence with interpolation over a small relay.',
    kitPiece:
      'The gesture layer behind Wander’s map, Mugen Arena’s frame strip and Deck Workshop’s version rail.',
    feeds: ['wander', 'mugen-arena', 'deck-workshop'],
    status: 'planned',
    startsOn: '2026-11-02',
    brief: [
      {
        heading: 'What I inspect',
        body: [
          'Canvas versus DOM rendering, device pixel ratio, how wheel, trackpad and pinch deltas are normalized across devices, and how cursors look continuous at low update rates.',
        ],
      },
      {
        heading: 'Hypothesis',
        body: [
          'Smoothness is interpolation between sparse updates; crispness is redrawing at the zoomed scale rather than scaling a bitmap.',
        ],
      },
      {
        heading: 'Proof',
        body: [
          'A frame budget at 5x zoom with 1,000 shapes, synthetic pointer tests, and a table of input devices and their delta behaviour. Scope stops at pan, zoom and cursors: no selection sync, no CRDT.',
        ],
      },
    ],
  },
  {
    slug: 'map-labels',
    title: 'How Apple Maps and Google Maps decide which labels you see',
    format: 'teardown',
    question:
      'Why do map labels yield to each other without flickering as you zoom and pan?',
    builtSlice:
      'A priority-ordered label placer with a collision index, hysteresis, fades and keyboard navigation.',
    kitPiece: 'The label placer, used by Wander.',
    feeds: ['wander'],
    status: 'planned',
    startsOn: '2027-04-05',
    brief: [
      {
        heading: 'What I inspect',
        body: [
          'Which labels win when they collide, how priority shifts with zoom, why labels fade instead of popping, and how they stay put while panning. MapLibre’s open collision code is the documented counterpart; no tiles, fonts or assets are copied.',
        ],
      },
      {
        heading: 'Hypothesis',
        body: [
          'A priority-ordered greedy placement over a spatial index each frame, with hysteresis so a label that won keeps winning for a while, and fades that hide placement changes.',
        ],
      },
      {
        heading: 'Proof',
        body: [
          '5,000 candidate labels placed under 4 ms a frame in a worker, deterministic for the same viewport, with flicker tests across synthetic pans and an accessibility twin that lists the visible labels.',
        ],
      },
    ],
  },
  {
    slug: 'benefits-application',
    title: 'A state benefits application, reimagined',
    format: 'legacy',
    question: 'How do you make a 40-field statutory form survivable on a phone?',
    builtSlice:
      'A resumable, schema-driven form with the legal text kept and plain-language errors.',
    kitPiece: 'The resumable form engine and the two-register text component.',
    feeds: ['wander', 'deck-workshop'],
    status: 'planned',
    startsOn: '2027-06-28',
    brief: [
      {
        heading: 'Who it serves',
        body: [
          'People applying on a phone with prepaid data, shared devices and interrupted sessions. The public application form is the schema; applicants are synthetic; no real portal accounts.',
        ],
      },
      {
        heading: 'Proposed features',
        body: [
          'Save and resume with a code, a plain-language layer over the legal text with the original one tap away, a “what you will need” checklist up front, and an advisory eligibility pre-check that shows its rule.',
        ],
      },
      {
        heading: 'Proof',
        body: [
          'Works with JavaScript off and on, WCAG 2.2 AA, usable at 320 px; interruption tests for reload, timeout and the back button; a before-and-after task-time table from five volunteers; a one-page memo addressed to the agency.',
        ],
      },
    ],
  },
]
