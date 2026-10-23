import { Link, useParams } from 'react-router'
import { findProject } from '@app/portfolio/domain/catalog'
import { toPublic } from '@app/portfolio/domain/progress'
import { Brief } from '../components/Brief'
import { BuildLog } from '../components/BuildLog'
import { FullRecord } from '../components/FullRecord'
import { Journey } from '../components/Journey'
import { StatusChip } from '../components/StatusChip'
import { useSite } from '../site'
import { NotFound } from './NotFound'

export function ProjectPage() {
  const { slug = '' } = useParams()
  const { asOf, catalog, progress } = useSite()
  const project = findProject(catalog.projects, slug)
  if (!project) return <NotFound />
  // Registered but not yet fetched (a fresh dev clone) keeps the empty log.
  const fetched = project.repo ? progress[project.slug] : undefined
  // Interim: trimmed here until the build writes the public shape.
  const ledger = fetched && toPublic(fetched, asOf)

  return (
    <article>
      <header className="page-head">
        <p className="crumb mono secondary">
          <Link to="/work">Work</Link> / {project.title}
        </p>
        <h1 className="h1">{project.title}</h1>
        <p className="lede">{project.summary}</p>
        <p className="about">{project.about}</p>
        <div className="spec" role="group" aria-label="Spec">
          <dl>
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{project.stack.join(', ')}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusChip item={project} />
              </dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd>{project.domain}</dd>
            </div>
          </dl>
          {project.links.length > 0 && (
            <ul className="spec__links">
              {project.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="link">
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      {ledger ? (
        <Journey goal={project.goal} progress={ledger} />
      ) : (
        <BuildLog />
      )}
      <Brief sections={project.brief} />
      {ledger && <FullRecord key={project.slug} progress={ledger} />}
    </article>
  )
}
