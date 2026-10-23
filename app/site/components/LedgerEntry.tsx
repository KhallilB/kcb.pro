import { formatDay } from '@app/portfolio/domain/dates'
import {
  evidenceHref,
  kindLabel,
  resultLabel,
  type ProgressEntry,
} from '@app/portfolio/domain/progress'

// The id is the anchor that book seals and shared links land on.
export function LedgerEntry({
  entry,
  repo,
}: {
  entry: ProgressEntry
  repo: string
}) {
  const hasFacts = Boolean(entry.passMark) || entry.measured.length > 0
  return (
    <li id={entry.id} className="entry">
      <time className="entry__rail mono secondary" dateTime={entry.date}>
        {formatDay(entry.date)}
      </time>
      <div className="entry__main">
        <p className="entry__meta">
          <span className="result" data-result={entry.result}>
            <span className="result__mark" aria-hidden="true" />
            <span className="result__text">{resultLabel(entry.result)}</span>
          </span>
          <span className="mono secondary">{kindLabel(entry.kind)}</span>
          {entry.commit && (
            <a
              className="link mono"
              href={`https://github.com/${repo}/commit/${entry.commit}`}
              aria-label={`Commit ${entry.commit}`}
            >
              {entry.commit}
            </a>
          )}
        </p>
        <h3 className="entry__title h3">{entry.title}</h3>
        {hasFacts && (
          <dl className="entry__facts">
            {entry.passMark && (
              <div>
                <dt>Pass mark</dt>
                <dd>{entry.passMark}</dd>
              </div>
            )}
            {entry.measured.map((m, i) => (
              <div key={`${m.label}${i}`}>
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {entry.evidence.length > 0 && (
          <details className="entry__evidence">
            <summary>Evidence</summary>
            <ul>
              {entry.evidence.map((item, i) => (
                <li key={`${item.label}${i}`}>
                  <a
                    className="link"
                    href={evidenceHref(item, repo, entry.commit)}
                  >
                    {item.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </li>
  )
}
