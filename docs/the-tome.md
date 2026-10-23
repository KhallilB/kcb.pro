# How the Tome works

The Tome is the 3D book on the home page. It's built with Three.js r128 and lives in
`app/tome/engine.js`. The rest of the site only talks to it through a small handle.

## Reading it as a visitor

- Click the cover to open it. Turn pages by clicking the left or right page,
  dragging, or with the arrow keys, Page Up/Down or Space.
- Pull a coloured ribbon to jump to a chapter. Home closes the book; End jumps to
  the last page.
- Each project's chapter page has an "Open the project page" button that leaves the book
  for that project's 2D page.
- Rows on the contents page jump to their chapter. The study links and "All my work"
  open the matching site page; "Code" opens GitHub in a new tab.
- L or Escape switches to the 2D site.

## How it loads

1. `Layout.tsx` checks for WebGL. Without it, there's no toggle and no book.
2. When the book first needs to show, `TomeStage.tsx` lazy-loads `engine.js` and
   calls `mountTome(host, options)`. While the 2D site is open, the engine file is
   downloaded in the background during idle time, so the first switch to 3D only
   has to build the scene.
3. The engine paints every page, cover and texture onto canvases (nothing is loaded
   from image files). Then it waits up to 2.5 seconds for the Cinzel and EB Garamond
   fonts, so the text on the pages uses the right typeface, and starts drawing.

While it loads, home shows the book's mist from the first frame: an inline script in
`index.html` flags the page before React runs, and `Layout.tsx` keeps that flag until it
knows whether WebGL works, so the list never flashes. If the engine takes longer than
250 ms, the cover's gilt lozenge appears with "Loading the fancy version", then fades as
the book fades in.

`mountTome` returns `null` if WebGL fails. The site then hides the toggle and stays 2D.

## The engine's handle

```ts
const book = mountTome(host, { data, onList, onNavigate, insetTop })

book.show(place) // wake up; turn to a place such as 'kbui' if given
book.hide() // zoom into the page and go to sleep
book.place() // which chapter is open now, or null while closed
book.destroy() // free the WebGL context and every texture
```

The engine calls back into the site:

- `onList()` when the reader presses L or Escape.
- `onNavigate(path)` when a link painted on a page is clicked.
- `insetTop()` to learn how much space to leave at the top for the fixed 3D/2D toggle.

## Switching between 3D and 2D

The book is built once and then kept. Switching to 2D doesn't destroy it:

- **Hiding:** the camera zooms toward the page you last touched while the overlay
  fades and grows slightly. When the zoom finishes, the animation loop stops
  completely, so a hidden book uses no CPU or GPU.
- **Showing:** the same in reverse. The overlay fades in and the camera pulls back.
  Because the scene already exists, this is instant.
- **Keeping your place:** `app/tome/place.ts` maps chapters to site pages:

  | Book chapter      | Site page                  |
  | ----------------- | -------------------------- |
  | About             | `/about`                   |
  | Bezl              | `/work/bezl`               |
  | kbui              | `/work/kbui`               |
  | Work studies      | `/studies` and every study |
  | Contents, Contact | stay where you are         |

  Press 3D on `/work/kbui` and the book opens at kbui. Turn to Bezl and press 2D,
  and you land on `/work/bezl`. On the home page, 2D scrolls the list
  to the card for the chapter you were reading instead.

With "reduce motion" turned on, every transition is instant.

## Debugging the 3D scene

Two things make the book hard to check with the usual tools:

- **Headless browsers can't show it.** Playwright's software WebGL never puts the
  canvas into screenshots, and is too slow to animate it anyway. The e2e tests swap
  in a stub engine for this reason.
- **Screenshots of a canvas can be stale.** Some embedded or background browser
  panes don't repaint the canvas until something on the page changes.

What works: read frames straight from the renderer inside a real browser. Add a
temporary dev-only line near the end of `mountTome`:

```js
if (import.meta.env.DEV)
  window.__tome = { scene, camera, renderer, coverState, claspState, sheets }
```

Then, in the browser console, render a frame and copy it to a 2D canvas you can
inspect or save:

```js
const { renderer, scene, camera } = window.__tome
renderer.render(scene, camera)
const shot = document.createElement('canvas')
shot.width = 640
shot.height = 400
shot.getContext('2d').drawImage(renderer.domElement, 0, 0, 640, 400)
open(shot.toDataURL()) // or read pixels with getImageData
```

Useful tricks:

- **Freeze a moment:** set both `t` and `target` on `coverState`, `claspState` or a
  sheet (for example `coverState.t = coverState.target = 0.35`). The book holds that
  pose, so you can study it.
- **Find a stray object:** hide meshes one at a time (or half at a time) and count
  pixels in the area where the glitch shows. The first hide that clears it is your
  object.

Remove the `window.__tome` line before committing.
