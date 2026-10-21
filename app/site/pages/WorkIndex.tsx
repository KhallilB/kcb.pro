import { Link } from 'react-router'
import { workIndex } from '@app/portfolio/domain/catalog'
import { formatMonth } from '@app/portfolio/domain/dates'
import { StatusChip } from '../components/StatusChip'
import { useSite } from '../site'

export function WorkIndex() {
  const { catalog } = useSite()
  const projects = workIndex(catalog.projects)

  return (
    <>
      <header className="page-head">
        <h1 className="h1">Work</h1>
        <p className="mono secondary">{projects.length} projects</p>
      </header>
      <ul className="rows">
        {projects.map((project) => (
          <li key={project.slug} className="row row--tall">
            <span className="row__rail mono secondary">
              {formatMonth(project.startsOn)}
            </span>
            <span className="row__main">
              <Link to={`/work/${project.slug}`} className="row__title">
                {project.title}
              </Link>
              <span className="row__summary">{project.about}</span>
            </span>
            <span className="row__meta">
              <StatusChip item={project} />
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
