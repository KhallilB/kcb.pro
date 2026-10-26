import type { Project } from '../domain/types'

export const projects: Project[] = [
  {
    slug: 'gallery',
    kind: 'site',
    title: 'The Gallery',
    summary: 'This site: my work as a plain list and as a 3D book drawn entirely in code.',
    about:
      'My work as a plain list and as a 3D book, both built from the same content. The book has no 3D models and no image files: every cover, page and texture is painted in code when it loads.',
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
          'I wanted a portfolio that shows real work in progress, not just finished screenshots, and one you could read like a book without being locked out if your browser can’t draw it.',
        ],
      },
      {
        heading: 'The book',
        body: [
          'About 1,600 lines of JavaScript on top of Three.js. There are no 3D models and no image files: the cover, the paper grain and every page of text are painted onto canvases as the book loads, from the same content files as the rest of the site.',
          'Its own code is 30 KB gzipped, 159 KB with Three.js. It only downloads when the book is about to show, or in the background while you read the list, so the first switch to 3D only has to build the scene.',
          'On kcb.pro the book is on screen about 2 seconds after the page opens, measured on my laptop. It used to take nearly 4. Most of the wait was painting the cloth weave as about 40,000 tiny squares; it is now one small image scaled up, and the book paints its pages 22 times on load instead of 36.',
        ],
      },
      {
        heading: 'The plain site',
        body: [
          'Every page is turned into plain HTML when the site is built, so it reads fine with JavaScript off and shows up fast: the home page is under 2 KB of HTML gzipped, and the whole page, book included, is about 400 KB over the wire. React then takes over in the browser. A browser without WebGL never sees a broken book; it gets the list.',
          'All the content lives in a few typed files, and the build checks them first: a missing field, leftover filler text, or a study pointing at a hidden project stops the build instead of reaching the site.',
          'The look comes from the book: Cinzel for headings, EB Garamond for reading, warm parchment, and one deep green for links and highlights. All of it is hand-written CSS driven by a single file of design tokens.',
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
    title: 'Mugen Arena',
    summary: 'A 3D arena fighting game where every fighter drops in as a folder.',
    about:
      'A 3D fighting game in the browser where every fighter is a folder: its model, its moves and how the computer plays it. Drop one in and it can fight any other, whatever its height.',
    status: 'in-progress',
    startsOn: '2026-10-23',
    order: 3,
    role: 'Design and engineering',
    stack: ['TypeScript', 'Three.js', 'Vite', 'Python', 'Blender'],
    domain:
      'A fighting game that plays out the same way every time: a fixed clock of 60 ticks a second, hit detection on the model’s own bones, and one set of shared animations that fits fighters from 1.15 m to 2.45 m tall.',
    signature:
      'The Fighter Factory: pause any match, step through a move frame by frame with its hit areas drawn on the model, change the numbers and save them straight back to the fighter’s files.',
    links: [
      { label: 'Source', href: 'https://github.com/KhallilB/arena-mugen-3d' },
    ],
    brief: [
      {
        heading: 'The problem',
        body: [
          'M.U.G.E.N showed that people love building fighters as much as playing them. But its fighters are 2D sprites in hard-to-read files tuned by trial and error, and many use art nobody had the right to use. Mugen Arena keeps the core idea, a fighter you can drop in as a folder, and moves it to 3D.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Each fighter folder holds one 3D model and three plain files: its stats, its moves with their frame timing and hit areas, and how the computer plays it. A shared library of 27 animations gives every fighter movement, blocks and knockdowns from the start, and adjusts them so a small fighter and a giant can still hit and grab each other.',
        ],
      },
      {
        heading: 'The key piece',
        body: [
          'The Fighter Factory. Press Tab during any match to pause it and step through the current move one frame at a time. Its wind-up, hitting and recovery frames are colour-coded, and where it can hit and be hit is drawn on the model. Change its timing, damage or reach, or how the computer plays, and save it straight back to the fighter’s files.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'First, a one-day test with three fighters of very different heights: does a hit land in both directions, and does the game hold 60 frames a second? Then the arena and camera, the full set of moves, the Fighter Factory, and six launch fighters, each with its own computer opponent.',
        ],
      },
      {
        heading: 'Use of AI',
        body: [
          'New fighters can be drafted by AI: a language model writes the files and a 3D generator makes the model. None joins the roster until a validator checks it and I approve it.',
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
