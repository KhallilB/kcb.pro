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
      'Gesture code for panning and zooming a large canvas smoothly on any mouse or trackpad, for Bezl’s preview canvas.',
    feeds: ['bezl'],
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
    slug: 'terminal-speed',
    title: 'How VS Code’s terminal keeps up with a flood of output',
    format: 'teardown',
    question:
      'How does a terminal in a web page stay smooth when a program prints thousands of lines a second?',
    about:
      'A close look at how VS Code’s terminal, built on xterm.js, keeps up with heavy output, followed by a one-week rebuild of a terminal pane that stays smooth and keeps memory in check.',
    builtSlice:
      'A terminal pane that draws on the GPU, gathers incoming output into one update per frame, caps how much history it keeps, and stays readable to screen readers.',
    kitPiece:
      'A fast terminal pane for Bezl, where each AI assistant runs in its own terminal.',
    feeds: ['bezl'],
    status: 'planned',
    startsOn: '2026-11-16',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How xterm.js turns a stream of output into a grid of characters, when it draws with WebGL instead of page elements, how it gathers output so the screen updates once a frame, how much history it keeps and what that costs in memory, and how it stays usable with a screen reader. Ghostty’s terminal engine, which Bezl already uses for snapshots, is the comparison.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'It stays smooth because it never draws more than once a frame, however fast output arrives, and only draws the rows on screen. Memory stays flat because old lines are packed tightly and dropped past a limit.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'Streaming 100 MB of output through the pane while it holds 60 frames a second, a chart of memory over ten minutes of output, and tests that replay recorded terminal sessions and check the screen matches. It feeds Bezl’s live terminals milestone and its open checks on terminal speed and memory.',
        ],
      },
    ],
  },
  {
    slug: 'design-rules',
    title: 'How GitHub Primer and Shopify Polaris turn design rules into checks',
    format: 'teardown',
    question:
      'How does a design system turn “use the right spacing” into something a tool can check?',
    about:
      'A close look at how two large design systems write down their rules and enforce them with lint and tests, followed by a one-week rebuild of a small rule checker for kbui.',
    builtSlice:
      'A checker that reads a screen built from kbui components and flags broken rules, such as a value not from the token file, a missing label or a heading out of order, with the rule and a fix for each.',
    kitPiece:
      'The first rules for kbui’s rule engine, written once so people and AI agents read the same ones.',
    feeds: ['kbui'],
    status: 'planned',
    startsOn: '2026-11-30',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How Primer and Polaris write their guidelines, which ones they turn into lint rules or tests, how those checks tell their own components apart from raw markup, and what they leave to human review. Both publish their design tokens and lint rules as open source, which is the public reference.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'Most of the rules that get checked are about tokens and accessibility, because those can be read straight from the code. Rules about layout and hierarchy stay in the written guidelines, because they depend on the whole screen.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'Running the checker on ten real screens, five that follow the rules and five that break them on purpose, and counting what it catches and what it flags wrongly. It feeds two kbui milestones: one source for agents and components, and rules that check screens.',
        ],
      },
    ],
  },
  {
    slug: 'fighter-editor',
    title: 'The M.U.G.E.N fighter editor, reimagined in 3D',
    format: 'legacy',
    question:
      'How do you make tuning a fighter’s moves feel like editing, not trial and error?',
    about:
      'A redesign of the tools people use to build M.U.G.E.N fighters, such as Fighter Factory, for a 3D game in the browser, with a working editor that shows every frame of a move on the model as you change it.',
    builtSlice:
      'A frame-by-frame editor: scrub through a move, see where it can hit and be hit on the 3D model, change its timing or damage, and save it back to the fighter’s file.',
    kitPiece:
      'The frame strip and hit-area overlay that become Mugen Arena’s Fighter Factory.',
    feeds: ['mugen-arena'],
    status: 'planned',
    startsOn: '2026-12-14',
    brief: [
      {
        heading: 'Who it’s for',
        body: [
          'People who build M.U.G.E.N fighters today, used to editing text files and testing by playing, and newcomers who want to change one move without learning the whole format. Every fighter used is free to use or made for the project.',
        ],
      },
      {
        heading: 'What I’d change',
        body: [
          'Show a move as a strip of frames marked wind-up, hitting and recovery, instead of numbers in a file. Draw the hit areas on the model at the frame you’re on. Check the file as you edit and point at the exact problem. Save straight back to the fighter’s files, so the next match uses the change.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'Five people who have built fighters before make the same change, a faster jab, in Fighter Factory and in the new editor, and I compare the time taken and the mistakes made. The editor works with a keyboard alone, and tests check that a saved change plays back frame for frame. It feeds Mugen Arena’s Fighter Factory milestone.',
        ],
      },
    ],
  },
]
