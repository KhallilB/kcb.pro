import { Link, useParams } from 'react-router'
import { findProject } from '@app/portfolio/domain/catalog'
import { formatMonth } from '@app/portfolio/domain/dates'
import { formatLabel } from '@app/portfolio/domain/status'
import { Brief } from '../components/Brief'
import { StatusChip } from '../components/StatusChip'
import { useSite } from '../site'
import { NotFound } from './NotFound'

export function StudiesIndex() {
  const { catalog } = useSite()
  return (
    <>
      <header className="page-head">
        <h1 className="h1">Work studies</h1>
        <p className="lede">
          One-week explorable essays: a teardown of a modern system, or a
          reimagining of software people are forced to use, each with a built
          slice that hands the kit one piece.
        </p>
      </header>
      <ul className="rows">
        {catalog.studies.map((study) => (
          <li key={study.slug} className="row row--tall">
            <span className="row__rail mono secondary">
              {formatMonth(study.startsOn)}
            </span>
            <span className="row__main">
              <Link to={`/studies/${study.slug}`} className="row__title">
                {study.title}
              </Link>
              <span className="row__summary secondary">{study.question}</span>
            </span>
            <span className="row__meta secondary">{formatLabel(study.format)}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export function StudyPage() {
  const { slug = '' } = useParams()
  const { catalog } = useSite()
  const study = catalog.studies.find((s) => s.slug === slug)
  if (!study) return <NotFound />
  const fed = study.feeds
    .map((s) => findProject(catalog.projects, s))
    .filter((p) => p !== undefined)

  return (
    <article>
      <header className="page-head">
        <p className="crumb mono secondary">
          <Link to="/studies">Studies</Link> / {formatLabel(study.format)}
        </p>
        <h1 className="h1">{study.title}</h1>
        <p className="lede">{study.question}</p>
        <div className="spec" role="group" aria-label="Spec">
          <dl>
            <div>
              <dt>Format</dt>
              <dd>{formatLabel(study.format)}</dd>
            </div>
            <div>
              <dt>Built slice</dt>
              <dd>{study.builtSlice}</dd>
            </div>
            <div>
              <dt>Gives the kit</dt>
              <dd>{study.kitPiece}</dd>
            </div>
            <div>
              <dt>Feeds</dt>
              <dd>
                {fed.map((p, i) => (
                  <span key={p.slug}>
                    {i > 0 && ', '}
                    <Link to={`/work/${p.slug}`}>{p.title}</Link>
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusChip item={study} />
              </dd>
            </div>
          </dl>
        </div>
      </header>
      <Brief sections={study.brief} />
    </article>
  )
}
