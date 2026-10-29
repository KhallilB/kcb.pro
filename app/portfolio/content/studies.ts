import type { Study } from '../domain/types'

export const studies: Study[] = [
  {
    slug: 'terminal-speed',
    title: 'How VS Code’s terminal keeps up with a flood of output',
    format: 'teardown',
    question:
      'How does a terminal in a web page stay smooth, and small, when a program prints thousands of lines a second?',
    about:
      'VS Code’s terminal, which is built on xterm.js, stays smooth even when a program floods it with output. I’ll dig into how, then spend a week building a terminal pane that stays smooth and keeps its memory use under a hard ceiling.',
    builtSlice:
      'A terminal pane that draws on the GPU, updates the screen at most once a frame, tells a noisy program to wait instead of holding everything in memory, and still works with a screen reader.',
    kitPiece:
      'A terminal pane with a fixed memory ceiling, for an app that runs several command-line programs side by side.',
    feeds: ['bezl'],
    status: 'planned',
    startsOn: '2026-11-02',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How xterm.js turns a stream of output into a grid of characters, and when it switches to drawing with WebGL. How it batches output so the screen only updates once a frame. How it tells the program on the other end to pause when the screen falls behind. How much history it keeps, and what that costs. And how it stays usable with a screen reader.',
          'I’ll compare all of this with Ghostty, a native terminal whose engine can also run without a window.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I think it never draws more than once a frame, however fast output comes in, and only draws the rows you can see. Memory probably stays flat because older lines are packed tightly and dropped past a limit, and because it pushes back on the program instead of queuing everything.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll stream 100 MB of output through four panes at once and check that none of it is lost, the screen holds 60 frames a second, and memory stays under a fixed ceiling both at rest and during the burst.',
          'An earlier test of mine lost nothing but used far more memory than it should. So the ceiling, and what pushing back does to the program, matter most.',
        ],
      },
    ],
  },
  {
    slug: 'review-signal',
    title: 'How Google keeps automated code review worth reading',
    format: 'teardown',
    question:
      'When an automated reviewer is often wrong, how do you keep its findings worth reading?',
    about:
      'Google runs many automated checks on every code review, and anyone can mark a finding as not useful. Checks that annoy people get fixed or switched off. I’ll study how that system, Tricorder, keeps the noise down, then spend a week building a triage step for AI reviewers.',
    builtSlice:
      'A triage step that sorts each review finding by whether it quotes the code it’s about or only describes what the code might do, folds minor ones away, and marks where two reviewers found the same thing on their own.',
    kitPiece:
      'A finding triage that shows a person only the review comments worth their time, for any setup where AI assistants review each other’s code.',
    feeds: ['bezl'],
    status: 'planned',
    startsOn: '2026-11-09',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How Tricorder decides a check is good enough to show, and what happens when people keep marking it not useful. How a finding is worded so someone can act on it straight away. And how findings that come with a fix are kept apart from ones that only point at a problem.',
          'I’ll compare it with GitHub’s code scanning, where people dismiss an alert and say why.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I expect the biggest gain comes from showing less. A reviewer that’s right two times in three still wastes a lot of attention if every finding is shown the same way. Findings that quote the exact line are probably right far more often than ones that describe behaviour.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll take a set of real review findings that have already been checked by hand, run them through the triage, and compare what a person reads before and after: how many findings, and how many of those were real.',
          'If triage can’t raise the share of real findings without hiding true ones, that’s a sign review findings shouldn’t sit in the main view at all.',
        ],
      },
    ],
  },
  {
    slug: 'safe-fixes',
    title: 'How Clippy and ESLint decide which fixes are safe to apply',
    format: 'teardown',
    question:
      'When a tool finds a mistake, how does it know whether it can fix it without asking?',
    about:
      'Rust’s Clippy and JavaScript’s ESLint fix some problems on their own and only suggest fixes for others. I want to understand which fixes a tool may apply on its own and why, then spend a week building that split into a checker for interface code.',
    builtSlice:
      'A rule checker for interface code that applies a fix only when nothing else changes, offers the rest as suggestions, and words every message so an AI agent can act on it without guessing.',
    kitPiece:
      'A fix-safety rubric and message format for a design system’s rules, read the same way by people and by AI agents.',
    feeds: ['kbui'],
    status: 'planned',
    startsOn: '2026-11-16',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How the Rust compiler grades each suggestion by how sure it is, and which grades a tool like cargo fix will apply by itself. How ESLint keeps “fix” and “suggest” apart, and what a rule’s author has to promise before a fix runs automatically. And how both word a message: what’s wrong, where, and what to change.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I expect a fix counts as safe only when it’s local and changes nothing else, like swapping a raw colour for the design token with the same value. Anything that needs judgement, like choosing the right heading level, is probably always a suggestion.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll write rules for a handful of common interface mistakes and run them on screens written by AI agents. Every automatic fix must leave the rendered page unchanged apart from the problem it fixed.',
          'Then I’ll hand the messages to an agent and count how often it fixes the problem on the first try.',
        ],
      },
    ],
  },
  {
    slug: 'read-only',
    title: 'How Deno and macOS sandboxes make a program read-only by force',
    format: 'teardown',
    question:
      'How do you stop a program from writing anything, rather than asking it nicely not to?',
    about:
      'Deno won’t let a script touch files or the network unless it’s been given permission, and macOS can wall a process off with a sandbox profile. I’ll look at how both enforce it, then spend a week building a check that proves a command-line tool can’t write.',
    builtSlice:
      'A launcher that starts a command-line program in an operating-system sandbox with no write access, plus a check that tries every way to write it can find and reports any that get through.',
    kitPiece:
      'A read-only launcher and preflight check for AI assistants that are meant to review code, never change it.',
    feeds: ['bezl'],
    status: 'planned',
    startsOn: '2026-11-23',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How Deno decides what a script may touch, and what it does when something isn’t allowed. How macOS sandbox profiles, the kind Chromium uses for web pages, describe what a process may read and write. And what a child process inherits, since a program that can start another program can often slip its own limits.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I expect a tool’s own settings aren’t enough, because plugins, hooks and helper programs it starts don’t always respect them. Only a limit the operating system enforces holds for everything the program starts.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll list the ways a program can try to write: files, temporary folders, settings, a helper program, a plugin. I’ll run each one under the launcher and check that every attempt is blocked and logged.',
          'I’ll also check the tools still work normally when all they do is read.',
        ],
      },
    ],
  },
  {
    slug: 'trusted-checker',
    title: 'How axe-core keeps false alarms rare enough to trust',
    format: 'teardown',
    question:
      'How does an automated checker stay right often enough that people stop second-guessing it?',
    about:
      'axe-core is the accessibility checker behind many browsers’ developer tools. It’s built to avoid false alarms, and when it can’t tell, it says so instead of guessing. I’ll study how its rules are designed and tested, then spend a week building a way to measure how often a design rule is right.',
    builtSlice:
      'A test bench that runs each design rule against labelled examples, reports how often it’s right, and keeps a rule out of the default set until it clears a bar.',
    kitPiece:
      'A precision bench for design rules, so only rules that are usually right get to block anything.',
    feeds: ['kbui'],
    status: 'planned',
    startsOn: '2026-11-30',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How axe-core decides a rule is reliable enough to ship, and how it tests each one against pages that should pass and pages that should fail. When it reports “needs review” instead of a violation. And how it handles what a rule can’t see, like text contrast on top of an image.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I expect axe-core is trusted mostly because it’s willing to say “I don’t know”. A rule with three answers (pass, fail and check by hand) can afford to be strict about the first two.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll build a set of small screens that follow or break each rule, label them by hand, and run every rule against them.',
          'A rule that’s wrong too often drops to “check by hand” until it improves, so the checker never blocks on a guess.',
        ],
      },
    ],
  },
  {
    slug: 'decision-or-luck',
    title:
      'How chess and baseball analytics tell a good decision from a lucky result',
    format: 'teardown',
    question:
      'When an outcome is partly chance, how do you show whether the decision behind it was good?',
    about:
      'Lichess grades every move by how good it was, whatever happened next. Baseball Savant’s expected stats show how a hit usually turns out, apart from where this one landed. I’ll study how both separate the decision from the result, then spend a week designing a way to explain a single chance outcome.',
    builtSlice:
      'An outcome receipt for one random event: what went in, what nudged the odds, the chance of each result, and where the roll actually landed, at a short and a detailed level.',
    kitPiece:
      'An outcome receipt pattern for simulations, so a result feels earned rather than rigged.',
    feeds: [],
    status: 'planned',
    startsOn: '2026-12-07',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How Lichess grades a move against the engine’s best move, and shows that without burying a casual player in numbers. How expected stats turn a hit’s speed and angle into the result it usually produces. And how both decide what to show a beginner and what to keep for an expert.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I expect both work because they compare the result with what usually happens from the same spot, rather than explaining every factor. People seem to accept bad luck once they can see the odds were on their side.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll design receipts for a few random events, from a single draw to one with several things shifting the odds, at both levels of detail.',
          'Then I’ll ask a handful of people to say, for each event, whether the decision or luck decided it, and check that they can tell from the receipt alone.',
        ],
      },
    ],
  },
  {
    slug: 'merge-queue',
    title:
      'How merge queues land parallel changes without breaking the main branch',
    format: 'teardown',
    question:
      'When several changes are ready at once, how do you land them all without breaking what already works?',
    about:
      'Two changes can each pass their tests and still break the main branch together. GitHub’s merge queue, bors and OpenStack’s Zuul solve this by testing changes in the order they’ll land. I’ll study how, then spend a week building a small queue for work done in parallel.',
    builtSlice:
      'A queue that takes several finished changes, tests each one on top of the ones ahead of it, and drops only the change that breaks things, not the whole batch.',
    kitPiece:
      'A landing queue for work split across several AI assistants at once, each owning its own files.',
    feeds: ['bezl'],
    status: 'planned',
    startsOn: '2026-12-14',
    brief: [
      {
        heading: 'What I’ll look at',
        body: [
          'How Zuul tests a change on top of the changes queued ahead of it before they’ve landed, and what happens when one in the middle fails. How bors batches changes and splits a failing batch to find the culprit. And how GitHub’s merge queue picks how many changes to test together.',
        ],
      },
      {
        heading: 'My guess',
        body: [
          'I expect batching saves the most time when changes rarely clash, and costs the most when they often do. If each piece of work owns its own files and agrees on its interfaces first, clashes should be rare enough for large batches.',
        ],
      },
      {
        heading: 'How I’ll prove it',
        body: [
          'I’ll replay a set of real changes through the queue, some made to clash on purpose, and compare how long it takes to land them one by one, in batches, and with testing ahead of time.',
          'Whatever the timing, a broken change must never reach the main branch.',
        ],
      },
    ],
  },
]
