import type { Project } from '../domain/types'

export const projects: Project[] = [
  {
    slug: 'gallery',
    kind: 'site',
    title: 'The Gallery',
    summary: 'This site: my work as a plain list and as a 3D book.',
    about:
      'My work as a plain list and as a 3D book, both built from the same content.',
    status: 'in-progress',
    startsOn: '2026-10-19',
    order: 0,
    role: 'Design and engineering',
    stack: ['React 19', 'Vite', 'React Router', 'Three.js', 'Cloudflare Pages'],
    domain: 'Content checked at build time, published as static pages.',
    signature: 'A date next to every status, so nothing looks finished before it is.',
    links: [{ label: 'Source', href: 'https://github.com/KhallilB/kcb.pro' }],
    brief: [
      {
        heading: 'Why it exists',
        body: [
          'I wanted a portfolio that shows real work in progress, not just finished screenshots.',
        ],
      },
      {
        heading: 'How it is built',
        body: [
          'Every page is turned into plain HTML when the site is built, so it loads fast and works without JavaScript. React then takes over in the browser. All the content lives in a few typed files, and the build checks them first: a missing field or leftover filler text stops the build instead of reaching the site.',
          'The look comes from the book on the home page: Cinzel for headings, EB Garamond for reading, warm parchment, and one deep green for links and highlights. All of it is hand-written CSS driven by a single file of design tokens.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'Proof that updates itself. Each project will publish a small file of results from its own test runs, and its card here will show those numbers, or say clearly when they are missing. After that: live demos you can try on the page, a map of how the projects connect, and a way to scroll back through each project’s history.',
        ],
      },
    ],
  },
  {
    slug: 'bezl',
    kind: 'endeavor',
    title: 'Bezl',
    summary: 'AI coding assistants side by side, with a record of who did what.',
    about:
      'A desktop app that runs Codex, Claude Code and Gemini CLI as separate workers on one task. One of them may change the code, the others may only read and review it, and every step is written to a local log that is only ever added to.',
    status: 'in-progress',
    startsOn: '2026-10-22',
    order: 1,
    role: 'Design and engineering',
    stack: ['Tauri 2', 'Rust', 'React 19', 'TypeScript', 'xterm.js'],
    domain:
      'Running other programs from a desktop app: live terminals inside one window, permissions enforced by the tools themselves rather than requested in a prompt, and a record you can check afterwards.',
    signature:
      'One writer per task: reviewers that are stopped from editing by the assistant’s own sandbox, not by a polite request.',
    links: [{ label: 'Source', href: 'https://github.com/KhallilB/bezl' }],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Running more than one AI coding assistant on the same code gets messy quickly. Two of them edit the same file, a reviewer starts making changes of its own, and afterwards nobody can say who did what. Bezl gives each task one assistant that may write, any number that may only read, and a record of everything that happened.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Bezl opens the official command-line tools in terminals inside one window, each signed in with its own account. It never calls a provider’s API, never holds anyone’s credentials, and never passes one assistant’s output to another. Each task gets its own copy of the repository, and the rules for what each assistant may do travel with the task.',
        ],
      },
      {
        heading: 'What is proven so far',
        body: [
          'Three short experiments ran on 22 Oct 2026, each with a pass mark set before it started.',
          'Three terminals each received a 20 MB stream with no bytes lost and 2 ms typing latency. Peak memory went past the original 300 MB limit, so it was replaced by two limits the real terminal has to meet: under 150 MB at rest and under 600 MB during a burst.',
          'Ghostty’s terminal engine produced a correct text snapshot of a vim screen, but only when built with the Homebrew release of Zig 0.15.',
          'Codex in read-only mode was blocked from writing a file by the operating system. The same check for Claude Code and Gemini CLI has not run yet.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'The core in Rust: tasks, workers and the permissions each one holds, with the log stored as events that are only ever added to. The interface is planned on kbui.',
        ],
      },
      {
        heading: 'Use of AI',
        body: [
          'Bezl directs AI assistants but adds none of its own. It starts the tools you already use and records what they do.',
        ],
      },
    ],
  },
  {
    slug: 'kbui',
    kind: 'endeavor',
    title: 'kbui',
    summary: 'One design system for all my projects: tokens, CSS and React.',
    about:
      'A small design system that keeps every value in one token file, all styling in plain CSS that any framework can use, and behaviour in a thin React layer. Tests check that the pieces stay in agreement.',
    status: 'in-progress',
    startsOn: '2026-10-16',
    order: 2,
    role: 'Design and engineering',
    stack: ['TypeScript', 'CSS', 'React 19', 'Base UI', 'Storybook'],
    domain:
      'Design tokens, accessible components, and rules that a build checks instead of a reviewer having to remember them.',
    signature:
      'The anatomy line: one comment at the top of each stylesheet that names a component’s classes and attributes, so any framework can render it the same way.',
    links: [{ label: 'Source', href: 'https://github.com/KhallilB/kbui' }],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Every project needs buttons, fields and dialogs, and each one tends to grow its own slightly different set. kbui is one shared set, so a fix or an accessibility improvement reaches every project at once.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Colours, spacing and type live in one file in the W3C design tokens format, with light and dark values side by side. Styling is plain CSS keyed on class names and data attributes, so it does not depend on React. The React layer uses Base UI for focus, keyboard and screen-reader behaviour, and adds only the right classes and attributes.',
        ],
      },
      {
        heading: 'How it stays honest',
        body: [
          'The build fails if a token points at one that does not exist, if a stylesheet uses a raw colour, or if a component is missing its test or its story. Every story is also rendered in a real browser and scanned for accessibility problems. The last recorded run passed all 28 component tests and all 16 stories.',
        ],
      },
      {
        heading: 'Who uses it',
        body: [
          'One other app uses it today, and Bezl’s interface is planned on it. Projects install it straight from its folder, so it has no version numbers yet. A project that builds in the cloud will need released versions first.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'About twenty more components, including layout and text, each with a complete anatomy line. After that, the plan is to let people describe a screen in plain language and have kbui check the result against its own design rules. None of that is built yet.',
        ],
      },
    ],
  },
  {
    slug: 'deck-workshop',
    kind: 'endeavor',
    listed: false,
    title: 'Deck Workshop',
    summary: 'Change your Hearthstone deck and find out whether the change helped.',
    about:
      'A desktop app that saves every version of your Hearthstone deck, records each game you play against the version you played it with, and tells you honestly whether a change made things better.',
    status: 'in-progress',
    startsOn: '2026-09-20',
    order: 1,
    role: 'Design and engineering',
    stack: ['Tauri 2', 'Rust', 'Svelte 5', 'TypeScript', 'SQLite'],
    domain:
      'Desktop apps that keep your data on your own machine, reading a game’s log as it is written, and statistics that stay honest with only a few games to go on.',
    signature:
      'The version timeline: your deck’s history as a line of versions, each showing its games, its record and how sure that record is.',
    links: [],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Most players tweak their decks by feel and overwrite the old list, so they never really know whether the last change helped. Deck Workshop saves each change as a new version, files every game under the version that played it, and shows what the change actually did, including how uncertain that is.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Paste in a deck code or build a deck from scratch, then mark the cards it is built around. Try out a change and see, before you commit to it, how it shifts your mana curve, your early turns and your chances of drawing key cards. Then go and play. The app reads the game’s log in the background and files each game under the right version. Afterwards, compare any two versions in plain language, and keep the change or go back.',
        ],
      },
      {
        heading: 'The key piece',
        body: [
          'The version timeline. Every change is a point on a line. Trying something out starts a side branch, keeping it joins the branch back in, and going back moves you to an earlier point. Each point shows its games, its win–loss record and a range for how confident that record is. With too few games, it says “not enough games yet” instead of showing a percentage it can’t back up.',
        ],
      },
      {
        heading: 'What I’ll learn',
        body: [
          'Watching a file from Rust as the game writes to it. Turning a stream of raw log lines into a clean history of each game. Reading and writing Hearthstone’s compact deck codes. Working out the exact odds of drawing a card. And statistics that refuse to invent a win rate from twelve games.',
        ],
      },
      {
        heading: 'Hard parts',
        body: [
          'Rust handles the files and the log watching, inside a Tauri 2 desktop shell. The log reader has to cope with half-written lines, the game restarting and patches that change the log format. The same Svelte interface also builds for the browser using sample data, so this site can show a working demo.',
        ],
      },
      {
        heading: 'Use of AI',
        body: [
          'Optional, and it can only read. You can ask a model to explain a comparison: one running on your own machine through Ollama, one cloud provider, or any compatible service. It reads your deck and games through a small set of tools, points to the games it used, and never changes a deck, crafts or disenchants cards, or claims to know a card it hasn’t seen.',
        ],
      },
      {
        heading: 'How I’ll test it',
        body: [
          'The log reader is checked against recorded real logs. Deck codes are checked to come back exactly as they went in. Draw odds are compared with values worked out by hand. Saved-data upgrades get their own tests, the browser build is clicked through automatically, and quick checks run on macOS and Windows. Every push already runs formatting, structure, type and test checks, plus a check that every piece of work traces back to a planned task.',
        ],
      },
      {
        heading: 'Data and rights',
        body: [
          'Card data comes from HearthstoneJSON. There is no Blizzard card art in the code or the demo; cards appear as text. Hearthstone is named only to say what the app works with.',
        ],
      },
      {
        heading: 'First milestone',
        body: [
          'Paste a deck code, save it as version one, and see its mana curve and the odds of each opening hand, in the browser version using sample cards.',
        ],
      },
    ],
  },
  {
    slug: 'mugen-arena',
    kind: 'endeavor',
    listed: false,
    title: 'Mugen Arena',
    summary: 'A 3D fighting game where every fighter is a file you can edit.',
    about:
      'A fighting game in the browser where every fighter is a plain text file. Change how a move works and fight with the new version seconds later.',
    status: 'planned',
    startsOn: '2027-01-04',
    order: 2,
    role: 'Design and engineering',
    stack: ['TypeScript', 'React 19', 'WebGPU', 'Web Workers', 'WebRTC'],
    domain:
      'Real-time game simulation that plays out exactly the same on every computer: a fixed game clock, a reader for fighter files, 3D hit detection, input timing and online play that hides lag.',
    signature:
      'The frame strip: a move laid out frame by frame, which you can scrub through while the 3D fighter shows exactly where it can hit and be hit.',
    links: [],
    brief: [
      {
        heading: 'The problem',
        body: [
          'M.U.G.E.N showed that people love building fighters as much as playing them. But its characters are hard-to-read files tuned by trial and error, and many of them use art nobody had the right to use. Mugen Arena keeps the core idea, that every fighter is a text file, and makes that file come alive: change a move, fight with it seconds later, and see every frame of it.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Pick two fighters and an arena, then fight a friend on the same keyboard or the computer. Open any fighter’s file and change a move: how quickly it comes out, how much damage it does, or where it can hit. Watch the change in the frame strip, save, and fight again. Share a fighter as a single file or a link.',
        ],
      },
      {
        heading: 'The key piece',
        body: [
          'The frame strip. Every frame of a move is a cell, marked as wind-up, hitting or recovery. Drag across it and the 3D fighter strikes that exact pose, with the areas where it can hit and be hit drawn on the model. Editing a cell edits the file.',
        ],
      },
      {
        heading: 'The fighter file',
        body: [
          'Plain text in four parts: states (what the fighter is doing and what can interrupt it), commands (the button sequences for each move and how much timing slack they allow), animations (free-to-use 3D animations with their timing) and hits (where a hit lands, its damage, and how far it knocks the other fighter back). The editor checks the file as you type and points to the exact line with a problem.',
        ],
      },
      {
        heading: 'What I’ll learn',
        body: [
          'A game clock that ticks 60 times a second no matter how fast the screen draws. A reader for the fighter file format. Detecting hits in 3D. Recognising special-move inputs like quarter-circle-forward. Doing the maths in a way that gives identical results in every browser. And online play that predicts your opponent’s moves and quietly corrects itself when the real input arrives.',
        ],
      },
      {
        heading: 'Hard parts',
        body: [
          'Drawing with WebGPU, falling back to WebGL where it isn’t available. Running the game logic in a background thread with maths that rounds the same way everywhere, so the same inputs always give the same fight. Proving that with a test that replays a match in several browsers and compares the game state frame by frame. Online play over a direct browser-to-browser connection comes later.',
        ],
      },
      {
        heading: 'Use of AI',
        body: [
          'None. The computer opponent is a scripted fighter written in the same file format, so you can read it and change it like any other fighter.',
        ],
      },
      {
        heading: 'How I’ll test it',
        body: [
          'The file reader is checked against known-good files, and broken files must produce clear error messages. Hit detection and special-move inputs get their own tests using recorded inputs. A replay test checks that every frame comes out identical. And there are time budgets for drawing and game logic, plus a measured delay between pressing a button and seeing the result.',
        ],
      },
      {
        heading: 'Art and rights',
        body: [
          'Characters and the arena come from Kenney’s Animated Characters Bundle and Mini Arena, both free to use for anything. Nothing comes from the M.U.G.E.N community’s sprites, sounds or characters. The name will be checked for conflicts before launch.',
        ],
      },
      {
        heading: 'First milestone',
        body: [
          'One fighter in one arena who can walk, jump and throw one attack, all defined in the file, with its frame strip and two players on one keyboard.',
        ],
      },
    ],
  },
  {
    slug: 'wander',
    kind: 'endeavor',
    listed: false,
    title: 'Wander',
    summary: 'A map of what is around you, then and now.',
    about:
      'A walking map that shows what a city’s open data knows about the street you are on: the trees, old photos, public art and local history.',
    status: 'planned',
    startsOn: '2027-04-12',
    order: 3,
    role: 'Design and engineering',
    stack: ['TypeScript', 'React 19', 'MapLibre GL', 'PMTiles', 'WebGPU'],
    domain: 'Drawing maps fast, and turning public city data into maps that work offline.',
    signature:
      'The layer dial: a thumb control that fades map layers in and out, paired with a slider that lines an old photo up with the street in front of you.',
    links: [],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Map apps are great at answering “how do I get there?” Wander answers different questions: what is this place, what used to be here, and what kind of tree is that? It works in cities that publish enough open data to answer them.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Open the map where you are standing and turn on the layers you care about: old and new photos side by side, street trees by species, public art, history from Wikipedia, and your own notes. Point your phone at the street to line an old photo up with today’s view. Save the places you visited as a walk and share it.',
        ],
      },
      {
        heading: 'The key piece',
        body: [
          'The layer dial: a round control that stacks see-through map layers, with each one faded in or out by your thumb. It works alongside the then-and-now slider, which uses your phone’s direction to line photos up with the street.',
        ],
      },
      {
        heading: 'Launch cities',
        body: [
          'New York, London, Paris, San Francisco and Melbourne. Every dataset’s licence is checked before work starts. Anywhere else gets a basic version: an OpenStreetMap base map, nearby Wikipedia articles, and geotagged photos from Wikimedia Commons.',
        ],
      },
      {
        heading: 'What I’ll learn',
        body: [
          'How map data is cut into tiles and drawn, how the round earth is flattened onto a screen, saving tiles for offline use, combining phone sensors to work out which way you are facing, and a build step that turns each city’s open data into ready-made map files.',
        ],
      },
      {
        heading: 'Hard parts',
        body: [
          'Each city becomes a single file of map tiles, built ahead of time. Maps draw with WebGPU where the browser supports it and fall back to WebGL elsewhere. If you refuse every sensor permission, you still get a plain, working map.',
        ],
      },
      {
        heading: 'Use of AI',
        body: [
          'None. Tree species, dates and history all come from published data, and every fact links back to the exact dataset and row it came from.',
        ],
      },
      {
        heading: 'How I’ll test it',
        body: [
          'The data pipeline is tested on small sample datasets. The logic that turns layers on and off gets its own tests, as do gestures using simulated touches. A full walk is tested with the network switched off, and panning the map has to stay within a time budget for each frame.',
        ],
      },
      {
        heading: 'First milestone',
        body: ['One city, the base map, the tree layer, and a panel that tells you about the place you tapped.'],
      },
    ],
  },
]
