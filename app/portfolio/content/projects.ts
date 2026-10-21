import type { Project } from '../domain/types'

export const projects: Project[] = [
  {
    slug: 'gallery',
    kind: 'site',
    title: 'The Gallery',
    summary: 'This site: every project dated, every claim checkable.',
    about:
      'The site you are on: a ruled index and a leather tome over one catalog, every page prerendered and every claim dated.',
    status: 'in-progress',
    startsOn: '2026-10-19',
    order: 0,
    role: 'Design and engineering',
    stack: ['React 19', 'Vite', 'React Router', 'Cloudflare Pages'],
    domain: 'Build-time data and content architecture.',
    signature: 'The ruled index with an as-of stamp on every status.',
    links: [{ label: 'Source', href: 'https://github.com/KhallilB/kcb.pro' }],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Portfolios now look polished by default, so polish proves nothing. This site shows work you can open, dated and measured, with the decisions written down.',
        ],
      },
      {
        heading: 'How it is built',
        body: [
          'Every route is prerendered to static HTML at build, then React hydrates it. Content lives in typed modules that a validator checks at build, so a missing field or leftover filler text fails the build instead of reaching a page.',
          'Styling is hand-written CSS on one token file: one sans, one mono, warm paper, one vermilion accent for links, focus and the live dot.',
        ],
      },
      {
        heading: 'What comes next',
        body: [
          'An evidence contract: each project publishes an evidence file from CI, and its card shows status and numbers from that file, marked unverified when it is missing. Then live embeds, the system map and a history scrubber.',
        ],
      },
    ],
  },
  {
    slug: 'deck-workshop',
    kind: 'endeavor',
    title: 'Deck Workshop',
    summary: 'Tune a Hearthstone deck and know what each change did.',
    about:
      'A desktop app that keeps every version of a Hearthstone deck, files each game you play under the version that played it, and says honestly whether a change helped.',
    status: 'in-progress',
    startsOn: '2026-09-20',
    order: 1,
    role: 'Design and engineering',
    stack: ['Tauri 2', 'Rust', 'Svelte 5', 'TypeScript', 'SQLite'],
    domain:
      'Local-first desktop architecture, streaming log parsing into an event-sourced game record, draw probability and small-sample statistics.',
    signature:
      'The version rail: a deck’s history as a line of versions, each carrying its games, record and uncertainty band.',
    links: [],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Players tune decks by feel and paste over the old list, so nobody knows whether the last change helped. Deck Workshop keeps every change as a version, files each game under the version that played it, and shows what the change did with honest uncertainty.',
        ],
      },
      {
        heading: 'Core loop',
        body: [
          'Import a deck code or build a deck. Mark the cards that define it. Try a change and watch the curve, early plays and draw odds move before committing. Play. The log watcher files each game under its version. Compare two versions in plain language, then keep the change or roll back.',
        ],
      },
      {
        heading: 'Signature component',
        body: [
          'The version rail. Every change is a node; trying a change splits the rail, keeping it merges the branch, rolling back moves the head. Each node carries its games, record and an uncertainty band, and under the threshold it reads “not enough games yet” in place of a percentage.',
        ],
      },
      {
        heading: 'What it teaches',
        body: [
          'A Rust file watcher tailing the game’s Power.log, a streaming parser that turns log lines into an event-sourced game record, the deckstring format (base64 over varints), hypergeometric draw odds, and statistics that refuse to invent a win rate from twelve games.',
        ],
      },
      {
        heading: 'Boundary pushed',
        body: [
          'Tauri 2 with Rust owning the file system and the log watcher; a parser that tolerates partial lines, client restarts and patches that change the log; the same Svelte UI built for the browser against fixtures, so this site can embed it.',
        ],
      },
      {
        heading: 'AI in the product',
        body: [
          'Optional and read-only. A local Ollama model, one cloud provider or a compatible endpoint explains a comparison through typed tools that read the deck and its games. It cites the games it used, never edits a deck, never crafts or dusts, and never states an unobserved card as fact.',
        ],
      },
      {
        heading: 'How it is verified',
        body: [
          'Parser golden tests over recorded log fixtures, deckstring round-trip property tests, draw odds checked against closed-form values, storage migration tests, a Playwright walk of the browser build, and native smoke tests on macOS and Windows. Every push already runs a gate of format, architecture, types, tests, backlog traceability and the desktop build contract.',
        ],
      },
      {
        heading: 'Data and IP',
        body: [
          'Card data from HearthstoneJSON. No Blizzard card art in the repo or the embed; cards render as text frames. Hearthstone is named only to say what the tool works with.',
        ],
      },
      {
        heading: 'First slice',
        body: [
          'Import a deck code, save it as version one, and show the curve and opening-hand odds, in the browser build on fixture cards.',
        ],
      },
    ],
  },
  {
    slug: 'mugen-arena',
    kind: 'endeavor',
    title: 'Mugen Arena',
    summary: 'A 3D arena battler where every fighter is a file you can edit.',
    about:
      'A browser fighting game where every fighter is a plain text file. Change a move’s frames or hitbox and fight with it seconds later.',
    status: 'planned',
    startsOn: '2027-01-04',
    order: 2,
    role: 'Design and engineering',
    stack: ['TypeScript', 'React 19', 'WebGPU', 'Web Workers', 'WebRTC'],
    domain:
      'Deterministic real-time simulation: a fixed-step loop, a character-file interpreter, 3D capsule collision, input buffering and rollback netcode.',
    signature:
      'The frame strip: a move’s startup, active and recovery frames, scrubbable, with its hit capsules drawn on the 3D fighter.',
    links: [],
    brief: [
      {
        heading: 'The problem',
        body: [
          'M.U.G.E.N proved people love building fighters as much as playing them, but its characters are opaque files tuned by trial and error, and most borrow art nobody licensed. Mugen Arena keeps the idea, every fighter is a text file, and makes the file live: edit a move, fight with it seconds later, and see every frame.',
        ],
      },
      {
        heading: 'Core loop',
        body: [
          'Pick two fighters and an arena. Fight locally or against the CPU. Open any fighter’s file, change a move’s startup, damage or hit capsule, watch it in the frame strip, save, and fight again. Share a fighter as one file or a link.',
        ],
      },
      {
        heading: 'Signature component',
        body: [
          'The frame strip. Every frame of a move is a cell marked startup, active or recovery. Scrub it and the 3D fighter poses at that frame with its hit and hurt capsules drawn on the model. Editing a cell edits the file.',
        ],
      },
      {
        heading: 'The character file',
        body: [
          'Plain text in four sections: states (a state machine with entry conditions), commands (motion inputs with buffer windows), animations (CC0 skeletal clips with frame timings) and hits (capsules, damage, hitstun, knockback). The editor validates against a schema and points at the line that failed.',
        ],
      },
      {
        heading: 'What it teaches',
        body: [
          'A fixed 60 Hz step decoupled from rendering, a parser and interpreter for the fighter format, capsule collision in 3D, motion-input recognition over an input buffer, fixed-point math for cross-browser determinism, and rollback netcode that saves, restores and resimulates frames.',
        ],
      },
      {
        heading: 'Boundary pushed',
        body: [
          'WebGPU rendering with a WebGL fallback; the simulation in a worker on fixed-point math so the same inputs give the same frames in every browser; a replay test that compares state hashes frame by frame across engines; rollback over WebRTC data channels as a later slice.',
        ],
      },
      {
        heading: 'AI in the product',
        body: [
          'None. The CPU opponent is a scripted fighter written in the same file format, readable and editable like any other.',
        ],
      },
      {
        heading: 'How it is verified',
        body: [
          'Parser golden tests and schema error tests, capsule collision unit tests, motion-input tests on recorded input streams, a determinism replay with per-frame state hashes, frame-time budgets for render and simulation, and a measured input-to-frame latency.',
        ],
      },
      {
        heading: 'Assets and IP',
        body: [
          'Kenney’s Animated Characters Bundle and Mini Arena, both CC0. No sprites, sounds or characters from the M.U.G.E.N community. The working name is screened before launch.',
        ],
      },
      {
        heading: 'First slice',
        body: [
          'One fighter and one arena: walk, jump and one attack defined in the file, its frame strip, and two players on one keyboard.',
        ],
      },
    ],
  },
  {
    slug: 'wander',
    kind: 'endeavor',
    title: 'Wander',
    summary: 'The city as layers: then and now on the street you stand on.',
    about:
      'A walking map that layers a city’s open data on the street you stand on: tree species, historic photos, public art and local history.',
    status: 'planned',
    startsOn: '2027-04-12',
    order: 3,
    role: 'Design and engineering',
    stack: ['TypeScript', 'React 19', 'MapLibre GL', 'PMTiles', 'WebGPU'],
    domain: 'Geospatial rendering and data pipelines.',
    signature:
      'The layer dial: a thumb control that blends translucent map layers, paired with a then-and-now slider aligned by device orientation.',
    links: [],
    brief: [
      {
        heading: 'The problem',
        body: [
          'Maps answer “how do I get there”. Wander answers “what is this place, what was here, what is that tree”, in the cities whose open data makes that true.',
        ],
      },
      {
        heading: 'Core loop',
        body: [
          'Open the map where you stand. Dial layers: then-and-now photos, street trees by species, public art, history from Wikipedia, your notes. Point the phone to align a historic photo with the street, pin the places you touched into a walk, and share it.',
        ],
      },
      {
        heading: 'Signature component',
        body: [
          'The layer dial, a radial control that stacks translucent layers and sets each one’s opacity with a thumb, paired with the then-and-now slider aligned by device orientation.',
        ],
      },
      {
        heading: 'Launch cities',
        body: [
          'New York, London, Paris, San Francisco and Melbourne, each dataset license-checked before the season. Everywhere else: an OpenStreetMap base with Wikipedia geosearch and geotagged Commons photos.',
        ],
      },
      {
        heading: 'What it teaches',
        body: [
          'Vector tiles, projections, tile caching for offline use, sensor fusion, and a build-time pipeline that compiles each city’s open data into static tiles.',
        ],
      },
      {
        heading: 'Boundary pushed',
        body: [
          'Static PMTiles built per city; WebGPU rendering where available with a WebGL fallback; a plain map when every sensor is denied.',
        ],
      },
      {
        heading: 'AI in the product',
        body: [
          'None. Species, dates and history come from data, and every datum links to its source dataset and row.',
        ],
      },
      {
        heading: 'How it is verified',
        body: [
          'Pipeline tests on fixture datasets, layer state machine tests, gesture tests with synthetic pointers, an offline walk end to end, and a frame-time budget while panning.',
        ],
      },
      {
        heading: 'First slice',
        body: ['One city, the base map, the tree layer and a place sheet.'],
      },
    ],
  },
]
