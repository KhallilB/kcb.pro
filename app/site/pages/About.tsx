import { Link } from 'react-router'
import { useSite } from '../site'
import { ContactLinks } from '../components/ContactLinks'

export function About() {
  const { profile } = useSite()
  return (
    <article>
      <header className="page-head">
        <h1 className="h1">About</h1>
        <p className="lede">
          {profile.role} in Los Angeles. I build the kind of software you never
          have to Google how to use.
        </p>
      </header>
      <div className="prose prose--solo">
        <p>
          I grew up in Jamaica, studied computer science in Connecticut and
          California, and now live in Los Angeles. I’ve spent more than five
          years building product interfaces, much of it as one of the first
          engineers at a startup, where the frontend is whatever you make it.
        </p>
        <p>
          My favorite part of the job is watching something confusing finally
          click for people: fewer steps, clearer choices, less second-guessing.
          Simple doesn’t have to mean plain, though. I made this site’s home
          page a book, and it’s one of my favorite things I’ve built.
        </p>
        <p>
          Off the clock, I’m usually reading, playing basketball or video games,
          or out in the garden.
        </p>

        <h2 id="experience" className="h2">
          Experience
        </h2>
      </div>
      <ul className="rows experience" aria-labelledby="experience">
        {profile.experience.map((job) => (
          <li key={job.company} className="row row--tall">
            <span className="row__rail mono secondary">{job.years}</span>
            <span className="row__main">
              <span className="row__name">{job.company}</span>
              <span className="row__summary secondary">{job.about}</span>
              <span className="row__summary">{job.summary}</span>
            </span>
            <span className="row__meta secondary">{job.title}</span>
          </li>
        ))}
      </ul>
      <p className="experience__more">
        <a href={profile.resume} className="link">
          Full résumé (PDF) <span aria-hidden="true">↓</span>
        </a>
      </p>

      <div className="prose prose--solo">
        <h2 className="h2">What I’m building</h2>
        <p>
          Outside work I build things to learn the parts of engineering my job
          doesn’t cover. Right now that’s{' '}
          <Link to="/work/bezl">Bezl</Link>, a desktop app for running AI coding
          assistants side by side, and <Link to="/work/kbui">kbui</Link>, the
          design system my projects share. Plus this site.
        </p>
        <p>
          I lean on AI for the grunt work: scaffolding tests, making the same
          edit in a dozen places, getting a rough first draft down. The parts I
          actually care about, like how it all fits together, the fiddly
          interface code and how it looks, I do myself.
        </p>

        <h2 className="h2">Get in touch</h2>
        <ContactLinks />
      </div>
    </article>
  )
}
