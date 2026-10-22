import type { BriefSection } from '@app/portfolio/domain/types'
import { anchorId } from './anchor'

export function Brief({ sections }: { sections: BriefSection[] }) {
  return (
    <div className="reading">
      <nav aria-label="On this page" className="toc">
        <p className="toc__label mono secondary">On this page</p>
        <ul>
          {sections.map((s) => (
            <li key={s.heading}>
              <a href={`#${anchorId(s.heading)}`}>{s.heading}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="prose">
        {sections.map((s) => (
          <section key={s.heading} aria-labelledby={anchorId(s.heading)}>
            <h2 id={anchorId(s.heading)} className="h2">
              {s.heading}
            </h2>
            {s.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
