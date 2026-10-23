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
          My favorite part of the job is when something confusing finally
          clicks: fewer steps, clearer choices, a screen that explains itself.
          But easy doesn’t have to mean boring, which is why this site’s home
          page is a book.
        </p>
        <p>
          Off the clock, I’m usually reading, playing basketball or video games,
          or out in the garden.
        </p>

        <h2 className="h2">Experience</h2>
      </div>
      <ul className="rows experience">
        {profile.experience.map((job) => (
          <li key={job.company} className="row row--tall">
            <span className="row__rail mono secondary">{job.years}</span>
            <span className="row__main">
              <span className="row__name">{job.company}</span>
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
          design system my projects share. This site is the third.
        </p>
        <p>
          Everything on this site has a date next to it. A project’s status
          says where it really stands, not how I’d like it to sound, and
          nothing is called finished before it is.
        </p>
        <p>
          I use AI for the repetitive parts of the work, like setting up tests,
          making the same change across many files, and first drafts. The
          overall design, the tricky interface code and the visual design are
          mine.
        </p>

        <h2 className="h2">Get in touch</h2>
        <ContactLinks />
      </div>
    </article>
  )
}
