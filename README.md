# kcb.pro

**A portfolio that is also a book.** Live at [kcb.pro](https://kcb.pro).

You land on a leather tome floating in a pale green fog. Click it and the clasps
unhook, the cover swings open, and the pages bend as they turn. Pull a ribbon and it
drops you at a chapter. Every page in it is also a plain, fast website, one switch
away in the corner.

## What's inside

Three things I'm building, each picked to make me learn something hard:

- **Deck Workshop**: change your Hearthstone deck and find out whether the change
  actually helped.
- **Mugen Arena**: a fighting game where every fighter is a text file. Tweak a move,
  then fight with it seconds later.
- **Wander**: a walking map of what's around you, then and now.

There are also three **work studies**: one-week deep dives into how a piece of
software works, or how it should. Each one ends with a small part that a project
will reuse.

One house rule: **everything is dated.** Each status says when it was last true.
Nothing is called finished before it is.

## How it's put together

```text
  a few typed files of content
            │
            ▼
  rules that date, order and sanity-check them
            │
     ┌──────┴──────┐
     ▼             ▼
  the website    the book
  (React,        (Three.js, every page
  prerendered    painted in the browser)
  to HTML)
```

- **One source of truth.** Every word on the site and in the book comes from the same
  handful of TypeScript files. If one contains placeholder text, a missing date or a
  broken link, the build refuses to finish.
- **The website is just HTML.** Every page is rendered ahead of time, so it loads
  instantly and works without JavaScript or a graphics card. React wakes up afterwards
  for the extra touches.
- **The book is made entirely of code.** No 3D models and no image files. The
  leather, the brass corners, the emerald on the cover and the parchment are all
  drawn in code when the page loads.
- **The book never forgets your page.** Switch to the website and it zooms into the
  page you were reading, then goes to sleep without using any processing power. Switch
  back and it opens right where you left off. Read about Wander on the website, press
  3D, and the book opens at Wander.

## Made with

React 19 · TypeScript · Vite · Three.js · hand-written CSS · Bun · Cloudflare Pages

Type is set in Cinzel and EB Garamond.

## Curious about the internals?

The [docs](docs/) explain how the pieces fit, how the book works, and how a deploy
happens.

---

Built by [Khallil Bailey](https://github.com/KhallilB).
