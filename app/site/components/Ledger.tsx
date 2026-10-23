import { formatDay } from '@app/portfolio/domain/dates'
import {
  progressCounts,
  quietSince,
  type ProjectProgress,
} from '@app/portfolio/domain/progress'
import { useSite } from '../site'

// Evidence first: what is proven, as of the build day.
export function Ledger({
  progress,
}: {
  repo: string
  progress: ProjectProgress
}) {
  const { asOf } = useSite()
  const { entries } = progress.file
  const counts = progressCounts(entries, asOf)
  const quiet = quietSince(entries, asOf)
  const tally = `${counts.proven} proven · ${counts.partial} partial · ${counts.failed} failed · ${counts.open} open`

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
    </section>
  )
}
