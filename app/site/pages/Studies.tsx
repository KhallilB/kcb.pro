import { Card, Grid } from '@kb.ui/react'
import { Link, useParams } from 'react-router'
import { findProject } from '@app/portfolio/domain/catalog'
import { formatMonth } from '@app/portfolio/domain/dates'
import { formatLabel } from '@app/portfolio/domain/status'
import { Brief } from '../components/Brief'
import { BuildLog } from '../components/BuildLog'
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
          Short, one-week deep dives. Each one either takes apart how a
          well-known app works, or redesigns an older tool people still rely on.
          Each ends with a small working piece for a planned feature in one of
          my projects.
        </p>
      </header>
      <Grid as="ul" layout="stack" className="rows">
        {catalog.studies.map((study) => (
          <Card
            as="li"
            appearance="plain"
            key={study.slug}
            className="row row--tall"
          >
            <span className="row__rail mono secondary">
              {formatMonth(study.startsOn)}
            </span>
            <span className="row__main">
              <Link to={`/studies/${study.slug}`} className="row__title">
                {study.title}
              </Link>
              <span className="row__summary">{study.about}</span>
            </span>
            <span className="row__meta secondary">
              {formatLabel(study.format)}
            </span>
          </Card>
        ))}
      </Grid>
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
          <Link to="/studies">Work studies</Link> / {formatLabel(study.format)}
        </p>
        <h1 className="h1">{study.title}</h1>
        <p className="lede">{study.question}</p>
        <p className="about">{study.about}</p>
        <div className="spec" role="group" aria-label="Spec">
          <dl>
            <div>
              <dt>Format</dt>
              <dd>{formatLabel(study.format)}</dd>
            </div>
            <div>
              <dt>What I’ll build</dt>
              <dd>{study.builtSlice}</dd>
            </div>
            <div>
              <dt>What I’ll reuse</dt>
              <dd>{study.kitPiece}</dd>
            </div>
            {fed.length > 0 && (
              <div>
                <dt>Used by</dt>
                <dd>
                  {fed.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 && ', '}
                      <Link to={`/work/${p.slug}`}>{p.title}</Link>
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div>
              <dt>Status</dt>
              <dd>
                <StatusChip item={study} />
              </dd>
            </div>
          </dl>
        </div>
      </header>
      <BuildLog />
      <Brief sections={study.brief} />
    </article>
  )
}
