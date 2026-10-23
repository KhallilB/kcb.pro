import { activityWeeks } from '@app/portfolio/domain/activity'
import { formatDay, formatWeekday } from '@app/portfolio/domain/dates'
import type { DayCount } from '@app/portfolio/domain/progress'
import { useSite } from '../site'

// Square shade: none, 1, 2–3, 4–6, 7 or more commits.
function level(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return count <= 6 ? 3 : 4
}

const LEVELS = [0, 1, 2, 3, 4]

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

export function Activity({ days }: { days: DayCount[] }) {
  const { asOf } = useSite()
  const weeks = activityWeeks(days)
  const total = days.reduce((sum, d) => sum + d.count, 0)
  const active = days.filter((d) => d.count > 0).length

  return (
    <section className="activity" aria-labelledby="activity">
      <h3 id="activity" className="h3">
        Activity
      </h3>
      {total > 0 ? (
        <p className="activity__total">
          {plural(total, 'commit')} in the last 12 weeks
        </p>
      ) : (
        <p className="activity__empty">No commits in the last 12 weeks.</p>
      )}
      <table className="activity__grid">
        <caption className="sr-only">
          Commits per day for the 12 weeks to {formatDay(asOf)}:{' '}
          {plural(total, 'commit')} on {plural(active, 'day')}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Day</span>
            </th>
            {weeks.map((week) => (
              <th key={week[0].day} scope="col">
                <span className="sr-only">
                  Week of {formatDay(week[0].day)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks[0].map((first, row) => (
            <tr key={first.day}>
              <th scope="row">
                <span className="sr-only">{formatWeekday(first.day)}</span>
              </th>
              {weeks.map((week) => {
                const { day, count } = week[row]
                return (
                  <td
                    key={day}
                    data-level={level(count)}
                    title={`${plural(count, 'commit')} on ${formatDay(day)}`}
                  >
                    <span className="sr-only">{count}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="activity__legend secondary" aria-hidden="true">
        Less
        {LEVELS.map((n) => (
          <span key={n} className="activity__swatch" data-level={n} />
        ))}
        More
      </p>
    </section>
  )
}
