import { Link } from 'react-router'
import { useSite } from '../site'

export function About() {
  const { profile } = useSite()
  return (
    <article>
      <header className="page-head">
        <h1 className="h1">About</h1>
        <p className="lede">
          {profile.role}. I build deep, useful web apps and write down how they
          were made.
        </p>
      </header>
      <div className="prose prose--solo">
        <h2 className="h2">How I work</h2>
        <p>
          Each project is chosen to learn one hard engineering domain no other
          project here covers: local-first desktop software that reads its own
          evidence from game logs, a deterministic real-time simulation, and a
          map built from open city data.
        </p>
        <p>
          Every claim on this site carries a date. Status comes from the
          project, not from adjectives, and nothing is shown as finished before
          it is.
        </p>
        <p>
          AI speeds the mechanical parts of the work, such as test scaffolding,
          codemods and first drafts. Architecture, hard UI code and visual
          design stay mine, and each repo keeps a ledger of what AI drafted,
          what I rewrote and what I rejected.
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
              Everything I have built <span aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </div>
    </article>
  )
}
