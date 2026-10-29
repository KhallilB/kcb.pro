import type { Project } from '../domain/types'

export const projects: Project[] = [
  {
    slug: 'gallery',
    kind: 'site',
    title: 'The Gallery',
    summary: 'This site. My work as a simple list, or as a 3D book drawn in code.',
    about:
      'You’re looking at it. The same pages come in two forms: a plain list, and a 3D book you can flip through. The book uses no 3D models or images. Everything in it, down to the paper grain, is drawn in code.',
    status: 'in-progress',
    startsOn: '2026-10-19',
    order: 0,
    role: 'Design and engineering',
    stack: ['React 19', 'Vite', 'React Router', 'Three.js', 'Cloudflare Pages'],
    domain: 'Static sites, 3D on the web and page speed.',
    signature: 'Every status has a date next to it, so you can tell how current it is.',
    links: [{ label: 'Source', href: 'https://github.com/KhallilB/kcb.pro' }],
    brief: [
      {
        heading: 'Why it exists',
        body: [
          'I wanted a portfolio that shows work while it’s still happening, and I wanted it to feel like something. So the home page is a book you can open and leaf through. If your browser can’t draw it, you get the same pages as a plain list.',
        ],
      },
      {
        heading: 'The book',
        body: [
          'The book is about 1,600 lines of JavaScript on top of Three.js. There are no models or image files. When it loads, it paints the cover, the paper and every page of text onto canvases, using the same content as the rest of the site.',
          'Its own code comes to 30 KB gzipped, or 159 KB with Three.js. It doesn’t download until it’s needed. If you start on the list, it loads quietly in the background, so switching to 3D only has to set up the scene.',
          'On my laptop, the book shows up about 2 seconds after the page opens. It used to take almost 4. Most of that time went into painting the cloth texture as roughly 40,000 tiny squares. Now it’s one small image, scaled up, and each page is painted at most twice on load instead of three times.',
        ],
      },
      {
        heading: 'The plain site',
        body: [
          'Every page is turned into plain HTML when the site is built. It loads fast and reads fine with JavaScript turned off. The home page is under 2 KB of HTML gzipped, and the whole thing, book included, is about 400 KB. Once it reaches your browser, React takes over. If your browser can’t do WebGL, you get the list, never a broken book.',
          'All the content lives in a few typed files, and the build checks them before anything goes live. If a field is missing, filler text was left in, or a study points at a hidden project, the build stops.',
          'The look comes from the book: Cinzel for headings, EB Garamond for reading, warm parchment, and one deep green for links. The CSS is written by hand and runs off a single file of design tokens.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'I want the site to keep its own proof up to date. Each project will publish a small file of results from its test runs, and its card here will show those numbers, or say so when they’re missing. After that, I’d like to add live demos you can try on the page, a map of how the projects connect, and a way to scroll back through each project’s history.',
        ],
      },
    ],
  },
  {
    slug: 'bezl',
    kind: 'endeavor',
    title: 'Bezl',
    summary: 'Run a few AI coding assistants on one task, and see who did what.',
    about:
      'A desktop app for running Codex and Claude Code on the same task. One of them may change the code while the other reviews. Local models run through Ollama for jobs that don’t need tools, and every step is logged on your machine.',
    status: 'in-progress',
    startsOn: '2026-10-22',
    order: 1,
    rank: 1,
    repo: 'KhallilB/bezl-internal',
    goal: 'One window that runs AI coding assistants side by side, with one writer per task.',
    role: 'Design and engineering',
    stack: ['Tauri 2', 'Rust', 'React 19', 'TypeScript', 'xterm.js', 'Ollama'],
    domain: 'Desktop apps, embedded terminals, sandboxed permissions and local models.',
    signature:
      'Only one assistant per task can write. The others are kept read-only by their own sandbox, so the rule holds even if a model ignores what it’s told. Proven for Codex so far.',
    links: [
      { label: 'Source', href: 'https://github.com/KhallilB/bezl' },
      { label: 'Download', href: 'https://github.com/KhallilB/bezl/releases' },
    ],
    brief: [
      {
        heading: 'The problem',
        body: [
          'I started running two or three AI assistants on the same codebase, and it got messy fast. Two of them would edit the same file. A reviewer would decide to fix something on its own. By the end, I couldn’t tell who had changed what.',
          'Bezl fixes that with one rule. Each task gets one assistant that can write, and as many as you like that can only read. Everything they do is recorded.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Bezl doesn’t connect to any AI provider itself. It opens Codex and Claude Code through their official command-line tools, each in a terminal inside one window, and each keeps its own sign-in. Local models run through Ollama, on your machine by default. So Bezl never holds a key.',
          'Between assistants, Bezl only passes along what it made or checked itself: the diff, its own check results and findings it has verified. It never hands one assistant another’s conversation.',
          'Each task works on its own copy of the repository, and the rules for who can do what are attached to the task.',
        ],
      },
      {
        heading: 'What I’ve proven so far',
        body: [
          'On 22 Oct 2026 I ran three quick experiments. Before each one, I wrote down what would count as a pass.',
          'The first was about the terminals. No output went missing on its way to the window, and I couldn’t notice any lag when typing. Memory was the one miss. Under heavy output it went over the limit I’d set, so I split that limit in two: one for quiet periods and one for heavy bursts.',
          'The second was Ghostty’s terminal engine. It built within the time I’d allowed, and it captured a text snapshot of a live vim screen that matched what I’d typed. For now, it only works with one specific build of its compiler.',
          'The third was the sandbox. I ran Codex in read-only mode and had it try to change a file. The operating system blocked it, and Codex said so. I haven’t run the same test on Claude Code yet.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'Next up is the core, written in Rust. It keeps track of tasks, the assistants working on them, and what each one is allowed to do. The log is stored as a list of events that only ever grows. The interface is being built on kbui.',
        ],
      },
      {
        heading: 'Use of AI',
        body: [
          'Bezl doesn’t ship a model of its own. It launches the coding agents you already use, hands jobs that need no tools to models you run through Ollama, and keeps a record of all of it.',
        ],
      },
    ],
  },
  {
    slug: 'kbui',
    kind: 'endeavor',
    title: 'kbui',
    summary: 'The design system all my projects share, from tokens to React.',
    about:
      'A small design system that all my projects share. Colours, spacing and type live in one token file. The styling is plain CSS, so any framework can use it, and React adds the behaviour on top. Tests make sure the three never drift apart.',
    status: 'in-progress',
    startsOn: '2026-10-16',
    order: 2,
    rank: 2,
    repo: 'KhallilB/kbui',
    goal: 'One design system every project shares, with its rules checked by the build.',
    role: 'Design and engineering',
    stack: ['TypeScript', 'CSS', 'React 19', 'Base UI', 'Storybook'],
    domain: 'Design tokens, accessible components and automated design checks.',
    signature:
      'Every stylesheet starts with an anatomy line, a single comment listing the component’s classes and attributes. Any framework that follows it renders the component the same way.',
    links: [{ label: 'Source', href: 'https://github.com/KhallilB/kbui' }],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Every project needs buttons, form fields and dialogs. Left alone, each one ends up with its own slightly different version. kbui gives them one shared set, so when I fix a bug or improve accessibility, every project gets the fix.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'All the colours, spacing and type sizes live in one file, written in the W3C design tokens format. Light and dark values sit side by side.',
          'The styling is plain CSS that hooks onto class names and data attributes. It doesn’t depend on React at all.',
          'The React layer is thin. It uses Base UI to handle focus, keyboard support and screen readers, and its only other job is to put the right classes and attributes on each element.',
        ],
      },
      {
        heading: 'How it stays consistent',
        body: [
          'The build checks the rules, so I don’t have to remember them. It fails if a token points to one that doesn’t exist, if a stylesheet uses a raw colour, or if a component is missing its test or its story. Every story is also opened in a real browser and checked for accessibility problems. On the last recorded run, everything passed.',
        ],
      },
      {
        heading: 'Who uses it',
        body: [
          'One other app uses it today, and Bezl’s first screen is being built on it. Each release is published as packages you can download, so a project that builds in the cloud can lock to a specific version.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'About twenty more components are on the list, including layout and text, each with a full anatomy line. Further out, I’d like you to be able to describe a screen in plain English and have kbui check it against its own design rules. None of that exists yet.',
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
    summary: 'A 3D fighting game where each fighter is a folder you drop in.',
    about:
      'A 3D fighting game that runs in your browser. Each fighter is a folder holding its model, its moves and how the computer plays it. Drop a new one in and it can fight anyone on the roster, however tall either of them is.',
    status: 'in-progress',
    startsOn: '2026-10-23',
    listed: false,
    order: 3,
    repo: 'KhallilB/arena-mugen-3d',
    goal: 'A 3D arena fighter where each fighter is a folder you drop in, and the same inputs always play out the same match.',
    role: 'Design and engineering',
    stack: ['TypeScript', 'Three.js', 'Vite', 'Python', 'Blender'],
    domain:
      'Game simulation that plays out the same way every time. It runs on a fixed clock of 60 ticks a second, detects hits on the model’s own bones, and shares one set of animations across fighters from 1.15 m to 2.45 m tall.',
    signature:
      'The Fighter Factory. Pause a match, step through a move one frame at a time with its hit areas drawn on the model, then tweak the numbers and save them straight back to the fighter’s files.',
    links: [
      { label: 'Source', href: 'https://github.com/KhallilB/arena-mugen-3d' },
    ],
    brief: [
      {
        heading: 'The problem',
        body: [
          'M.U.G.E.N proved that people enjoy building fighters as much as playing them. But its fighters are 2D sprites described in hard-to-read files, and getting a move right takes a lot of trial and error. Many of them also use art nobody had permission to use.',
          'Mugen Arena keeps the part that worked, a fighter you can drop in as a folder, and brings it into 3D.',
        ],
      },
      {
        heading: 'How it works',
        body: [
          'Each fighter’s folder holds one 3D model and three plain files. One sets its stats. One describes its moves, with their frame timing and hit areas. The last one describes how the computer plays it.',
          'Every fighter also gets a shared library of 27 animations, covering walking, blocking and getting knocked down. The animations adjust to each fighter’s size, so a small fighter and a giant can still hit and grab each other.',
        ],
      },
      {
        heading: 'The key piece',
        body: [
          'The Fighter Factory. Press Tab during a match and the game pauses, so you can step through the current move one frame at a time. The wind-up, the hit and the recovery are colour-coded, and the areas where the fighter can hit and be hit are drawn right on the model.',
          'From there, you can change the move’s timing, damage or reach, or adjust how the computer plays. Save, and the change goes straight back into the fighter’s files.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'First comes a one-day test with three fighters of very different heights. I want to know two things: does a hit land in both directions, and can the game hold 60 frames a second?',
          'After that come the arena and camera, the full set of moves, the Fighter Factory, and six launch fighters, each with its own computer opponent.',
        ],
      },
      {
        heading: 'Use of AI',
        body: [
          'AI can draft new fighters. A language model writes the files and a 3D generator makes the model. Nothing joins the roster until it passes a validator and I’ve signed off on it.',
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
