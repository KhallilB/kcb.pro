import { Link } from 'react-router'
import { featured, nowBuilding } from '@app/portfolio/domain/catalog'
import { formatLabel } from '@app/portfolio/domain/status'
import { formatDay, formatMonth } from '@app/portfolio/domain/dates'
import { StatusChip } from '../components/StatusChip'
import { useSite } from '../site'

export function Home() {
  const { asOf, catalog, profile } = useSite()
  const live = nowBuilding(catalog.projects)
  const work = featured(catalog.projects)

  return (
    <>
      <section className="masthead">
        <h1 className="display">{profile.headline}</h1>
        <p className="lede">
          Three products, each built to learn one hard domain, shipped,
          measured and written up.
        </p>
        {live && (
          <p className="live" data-testid="now-building">
            <span className="live__dot" aria-hidden="true" />
            Now building <Link to={`/work/${live.slug}`}>{live.title}</Link>
            <span className="mono secondary">
              {' '}
              · as of <time dateTime={asOf}>{formatDay(asOf)}</time>
            </span>
          </p>
        )}
      </section>

      <section className="section" aria-labelledby="selected-work">
        <div className="section__head">
          <h2 id="selected-work" className="h3">
            Selected work
          </h2>
          <Link to="/work" className="link">
            All work <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="cards">
          {work.map((project) => (
            <article key={project.slug} className="card" data-place={project.slug}>
              <div className="card__body">
                <h3 className="card__title">
                  <Link to={`/work/${project.slug}`} className="card__link">
                    {project.title}
                  </Link>
                </h3>
                <p className="secondary">{project.summary}</p>
                <p className="card__about">{project.about}</p>
                <StatusChip item={project} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="work-studies" data-place="studies">
        <div className="section__head">
          <h2 id="work-studies" className="h3">
            Work studies
          </h2>
        </div>
        <ul className="rows">
          {catalog.studies.map((study) => (
            <li key={study.slug} className="row">
              <span className="row__rail mono secondary">
                {formatMonth(study.startsOn)}
              </span>
              <Link to={`/studies/${study.slug}`} className="row__title">
                {study.title}
              </Link>
              <span className="row__meta secondary">
                {formatLabel(study.format)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
