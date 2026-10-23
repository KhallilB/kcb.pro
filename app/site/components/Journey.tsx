import { formatDay } from '@app/portfolio/domain/dates'
import {
  journeySteps,
  nextStep,
  quietSince,
  STATUS_ORDER,
  STATUS_WORD,
  type ProgressResult,
  type PublicProgress,
} from '@app/portfolio/domain/progress'
import { useSite } from '../site'

const word = (result: ProgressResult) => STATUS_WORD[result].toLowerCase()

const COUNT: Record<ProgressResult, (n: number, total: number) => string> = {
  pass: (n, total) => `${n} of ${total} done`,
  partial: (n) => `${n} in progress`,
  'not-run': (n) => `${n} planned`,
  fail: (n) => `${n} being rethought`,
}

// A project's progress in plain words: goal, steps, what comes next.
export function Journey({
  goal,
  progress,
}: {
  goal?: string
  progress: PublicProgress
}) {
  const { asOf } = useSite()
  const steps = journeySteps(progress.entries, asOf)
  const next = nextStep(steps)
  const quiet = quietSince(progress.entries, asOf)
  const counts = STATUS_ORDER.map((result) => ({
    result,
    n: steps.filter((s) => s.result === result).length,
  }))
    .filter(({ n }) => n > 0)
    .map(({ result, n }) => COUNT[result](n, steps.length))
    .join(', ')

  return (
    <section className="journey" aria-labelledby="progress">
      <h2 id="progress" className="h2">
        Progress
      </h2>
      {goal && <p className="journey__goal">{goal}</p>}
      {steps.length > 0 ? (
        <>
          {/* Explicit: list-style none drops the list role in Safari. */}
          <ol className="journey__steps" role="list">
            {steps.map((step, i) => (
              <li key={step.id}>
                <span
                  className="mark"
                  data-result={step.result}
                  role="img"
                  aria-label={`Step ${i + 1} of ${steps.length}: ${step.title}, ${word(step.result)}`}
                />
              </li>
            ))}
          </ol>
          <p className="journey__counts">{counts}</p>
        </>
      ) : (
        <p className="journey__empty">Nothing logged yet.</p>
      )}
      {next && <p className="journey__next">Next up: {next.title}</p>}
      <p className="journey__asof mono secondary">
        Updated <time dateTime={asOf}>{formatDay(asOf)}</time>
        {quiet && (
          <>
            {' · '}No updates since{' '}
            <time dateTime={quiet}>{formatDay(quiet)}</time>
          </>
        )}
      </p>
    </section>
  )
}
