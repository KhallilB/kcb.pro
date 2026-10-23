import { useEffect, useState } from 'react'
import { formatDay } from '@app/portfolio/domain/dates'
import {
  progressCounts,
  quietSince,
  type ProgressKind,
  type ProjectProgress,
} from '@app/portfolio/domain/progress'
import { useSite } from '../site'
import { LedgerEntry } from './LedgerEntry'

type Filter = ProgressKind | 'all'

const FILTERS: { filter: Filter; label: string }[] = [
  { filter: 'all', label: 'All' },
  { filter: 'experiment', label: 'Experiments' },
  { filter: 'tests', label: 'Tests' },
  { filter: 'release', label: 'Releases' },
  { filter: 'milestone', label: 'Milestones' },
]

// Evidence first: what is proven, as of the build day.
export function Ledger({
  repo,
  progress,
}: {
  repo: string
  progress: ProjectProgress
}) {
  const { asOf } = useSite()
  const [filter, setFilter] = useState<Filter>('all')
  // Filters appear after hydration; the prerendered page lists every entry.
  const [live, setLive] = useState(false)
  useEffect(() => setLive(true), [])

  const { entries } = progress.file
  const counts = progressCounts(entries, asOf)
  const quiet = quietSince(entries, asOf)
  const tally = `${counts.proven} proven · ${counts.partial} partial · ${counts.failed} failed · ${counts.open} open`
  const shown = [...entries]
    .reverse()
    .filter((entry) => filter === 'all' || entry.kind === filter)

  return (
    <section className="ledger" aria-labelledby="progress">
      <header className="ledger__head">
        <h2 id="progress" className="h2">
          Progress
        </h2>
        <p className="ledger__counts mono secondary">
          {tally} · as of <time dateTime={asOf}>{formatDay(asOf)}</time>
        </p>
        {quiet && (
          <p className="ledger__quiet">
            Quiet since <time dateTime={quiet}>{formatDay(quiet)}</time>
          </p>
        )}
      </header>
      {live && entries.length > 0 && (
        <div
          className="ledger__filters"
          role="group"
          aria-label="Filter entries"
        >
          {FILTERS.map((f) => (
            <button
              key={f.filter}
              type="button"
              className="ledger__filter"
              aria-pressed={filter === f.filter}
              onClick={() => setFilter(f.filter)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {shown.length > 0 ? (
        <ol className="ledger__entries">
          {shown.map((entry) => (
            <LedgerEntry key={entry.id} entry={entry} repo={repo} />
          ))}
        </ol>
      ) : (
        <p className="ledger__empty">
          {entries.length === 0
            ? 'No entries yet.'
            : 'No entries of this kind yet.'}
        </p>
      )}
    </section>
  )
}
