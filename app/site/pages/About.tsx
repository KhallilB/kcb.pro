import { Link } from 'react-router'
import { useSite } from '../site'

export function About() {
  const { profile } = useSite()
  return (
    <article>
      <header className="page-head">
        <h1 className="h1">About</h1>
        <p className="lede">
          {profile.role}. I build web apps that do real work, and I write down
          how I made them.
        </p>
      </header>
      <div className="prose prose--solo">
        <h2 className="h2">How I work</h2>
        <p>
          I pick each project to learn one hard area of engineering that the
          others don’t cover: a desktop app that keeps your data on your own
          machine and learns from a game’s logs, a fighting game that plays out
          exactly the same on every computer, and a map built from cities’ open
          data.
        </p>
        <p>
          Everything on this site has a date next to it. A project’s status
          says where it really stands, not how I’d like it to sound, and
          nothing is called finished before it is.
        </p>
        <p>
          I use AI to speed up the repetitive parts of the work, like setting up
          tests, making the same change across many files, and first drafts.
          The overall design, the tricky interface code and the visual design
          are mine. Each project keeps a record of what AI drafted, what I
          rewrote and what I threw away.
        </p>
        <h2 className="h2">Elsewhere</h2>
        <ul className="plain">
          <li>
            <a href={profile.github} className="link">
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </li>
          <li>
            <Link to="/work" className="link">
              See all my work <span aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </div>
    </article>
  )
}
