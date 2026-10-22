import type { Study } from '../domain/types'

export const studies: Study[] = [
  {
    slug: 'figma-canvas',
    title: 'How Figma’s canvas stays smooth with everyone on it',
    format: 'teardown',
    question:
      'How does an endless canvas stay sharp and smooth while other people move around on it?',
    about:
      'A close look at how Figma’s endless canvas stays smooth with other people on it, followed by a one-week rebuild of its panning, zooming and live cursors.',
    builtSlice:
      'Panning, pinch-to-zoom, consistent scrolling across mice and trackpads, and other people’s cursors gliding smoothly over a small server.',
    kitPiece:
      'Gesture code for panning and zooming a large canvas smoothly on any mouse or trackpad.',
    feeds: [],
    status: 'planned',
    startsOn: '2026-11-02',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'Whether Figma draws with a canvas or with page elements, how it handles high-resolution screens, how it makes scrolling, trackpads and pinching feel the same on every device, and how other people’s cursors look smooth even though their positions only arrive a few times a second.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'Cursors look smooth because the app fills in the motion between the few updates it receives. Shapes stay sharp because they are redrawn at each zoom level, rather than an image being stretched.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'A speed test at five times zoom with 1,000 shapes on screen, automated tests that simulate pointers, and a table showing how different mice and trackpads report movement. The scope stops at panning, zooming and cursors: no shared selection and no real-time document syncing.',
        ],
      },
    ],
  },
  {
    slug: 'map-labels',
    title: 'How Apple Maps and Google Maps decide which labels you see',
    format: 'teardown',
    question:
      'How do map labels make room for each other without flickering as you zoom and move around?',
    about:
      'A close look at how map apps choose which labels to show as you zoom and move around, followed by a one-week rebuild of a label system that never flickers.',
    builtSlice:
      'A label system that places the most important labels first, keeps winners steady, fades changes in and out, and can be explored with a keyboard.',
    kitPiece: 'A label system that makes room for the most important labels without flickering.',
    feeds: [],
    status: 'planned',
    startsOn: '2027-04-05',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'Which label wins when two overlap, how that changes as you zoom, why labels fade rather than pop, and how they stay still while you drag the map. MapLibre’s open-source label code is the public reference; none of its map tiles, fonts or other files are copied.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'Every frame, labels are placed in order of importance, skipping any that would overlap one already placed. A label that won a spot keeps it for a while so it doesn’t flicker, and fades cover up the moments when the winners change.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'Placing 5,000 possible labels in under 4 milliseconds a frame, in a background thread, with the same result every time for the same view. Automated tests drag the map around and check for flicker, and a screen-reader-friendly list shows which labels are visible.',
        ],
      },
    ],
  },
  {
    slug: 'benefits-application',
    title: 'A state benefits application, reimagined',
    format: 'legacy',
    question: 'How do you make a 40-question legal form bearable to fill in on a phone?',
    about:
      'A redesign of a state benefits application for people applying on their phones, with a working version that survives a dropped connection and keeps the legal wording intact.',
    builtSlice:
      'A form you can pause and pick up later, driven by a description of its questions, that keeps the legal wording and explains mistakes in plain language.',
    kitPiece:
      'The pause-and-resume form system, and a text component that shows plain language with the official wording one tap away.',
    feeds: [],
    status: 'planned',
    startsOn: '2027-06-28',
    brief: [
      {
        heading: 'Who it’s for',
        body: [
          'People applying on a phone with prepaid data, a shared device, or a session that keeps getting interrupted. The questions come from the real public application form. The applicants are made up, and no real government accounts are used.',
        ],
      },
      {
        heading: 'What I’d change',
        body: [
          'Save your progress and come back later with a code. Show a plain-language version of the legal text, with the original one tap away. Put a checklist of what you’ll need at the very start. Offer a quick, non-binding check of whether you’re likely to qualify, and show the rule it used.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'It works with JavaScript turned on or off, meets the WCAG 2.2 AA accessibility standard, and is usable on a 320-pixel-wide screen. Tests cover reloading the page, timing out and pressing the back button. Five volunteers will try the old and new versions so I can compare how long each takes, and the results go into a one-page memo written for the agency.',
        ],
      },
    ],
  },
]
