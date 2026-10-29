import type { Study } from '../domain/types'

export const studies: Study[] = [
  {
    slug: 'figma-canvas',
    title: 'How Figma’s canvas stays smooth with everyone on it',
    format: 'teardown',
    question:
      'How does an endless canvas stay sharp and smooth while other people move around on it?',
    about:
      'Figma’s canvas stays smooth even with lots of people moving around on it. I want to understand how, so I’ll study it and then spend a week rebuilding the panning, zooming and live cursors myself.',
    builtSlice:
      'Panning and pinch-to-zoom that feel the same on any mouse or trackpad, plus other people’s cursors gliding smoothly, synced through a small server.',
    kitPiece:
      'Smooth pan-and-zoom code that works on any mouse or trackpad, for Bezl’s preview canvas.',
    feeds: ['bezl'],
    status: 'planned',
    startsOn: '2026-11-02',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'First, whether Figma draws with a single canvas or with regular page elements, and how it stays sharp on high-resolution screens. Then how it makes scrolling and pinching feel the same on every device. And finally, how other people’s cursors move so smoothly when their positions only arrive a few times a second.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'The cursors probably look smooth because the app fills in the movement between the few updates it gets. Shapes likely stay sharp because they’re redrawn at each zoom level, instead of being stretched like an image.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll run a speed test at five times zoom with 1,000 shapes on screen, write automated tests that simulate a pointer, and put together a table of how different mice and trackpads report movement.',
          'I’m keeping the scope tight: panning, zooming and cursors. No shared selection, and no real-time syncing of the document.',
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
      'VS Code’s terminal, which is built on xterm.js, stays smooth even when a program floods it with output. I’ll dig into how, then spend a week building a terminal pane that stays smooth and keeps its memory use in check.',
    builtSlice:
      'A terminal pane that draws on the GPU, updates the screen at most once a frame, limits how much history it keeps, and still works with a screen reader.',
    kitPiece:
      'A fast terminal pane for Bezl, where every AI assistant runs in a terminal of its own.',
    feeds: ['bezl'],
    status: 'planned',
    startsOn: '2026-11-16',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How xterm.js turns a stream of output into a grid of characters, and when it switches to drawing with WebGL. How it batches output so the screen only updates once a frame. How much history it keeps, and what that costs in memory. And how it stays usable with a screen reader.',
          'I’ll compare all of this with Ghostty’s terminal engine, which Bezl already uses for snapshots.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I think it never draws more than once a frame, however fast output comes in, and only draws the rows you can actually see. Memory probably stays flat because older lines are packed tightly and thrown away once they pass a limit.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll stream 100 MB of output through the pane and check that it holds 60 frames a second. I’ll chart its memory over ten minutes of output. And I’ll write tests that replay recorded terminal sessions and check the screen comes out right.',
          'This feeds straight into Bezl’s live terminals milestone, along with its open checks on speed and memory.',
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
      'GitHub’s Primer and Shopify’s Polaris both turn written design rules into automated checks. I’ll look at how they do it, then spend a week building a small rule checker for kbui.',
    builtSlice:
      'A checker that reads a screen built with kbui and flags broken rules, like a value that isn’t from the token file, a missing label or a heading out of order. For each one, it names the rule and suggests a fix.',
    kitPiece:
      'The first rules for kbui’s rule engine, written once so that people and AI agents read the same thing.',
    feeds: ['kbui'],
    status: 'planned',
    startsOn: '2026-11-30',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How Primer and Polaris write their guidelines, and which of them they turn into lint rules or tests. How those checks tell their own components apart from raw markup. And what they still leave to human review.',
          'Both publish their design tokens and lint rules as open source, so that’s what I’ll work from.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I expect most of the rules that get checked are about tokens and accessibility, since those can be read straight from the code. Rules about layout and visual hierarchy probably stay in the written guidelines, because you need to see the whole screen to judge them.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll run the checker on ten real screens. Five follow the rules and five break them on purpose. Then I’ll count what it catches and what it flags by mistake.',
          'This feeds two kbui milestones: a single source of rules for agents and components, and rules that can check whole screens.',
        ],
      },
    ],
  },
]
