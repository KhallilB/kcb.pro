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

// Where a project stands in plain words: goal, steps, what comes next.
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
    .map(({ result, n }) => `${n} ${word(result)}`)
    .join(' · ')

  return (
    <section className="journey" aria-labelledby="progress">
      <h2 id="progress" className="h2">
        Where it stands
      </h2>
      {goal && <p className="journey__goal">{goal}</p>}
      {steps.length > 0 ? (
        <>
          <ol className="journey__steps">
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
        <p className="journey__empty">No steps recorded yet.</p>
      )}
      {next && <p className="journey__next">Next: {next.title}</p>}
      <p className="journey__asof mono secondary">
        As of <time dateTime={asOf}>{formatDay(asOf)}</time>
        {quiet && (
          <>
            {' · '}Quiet since <time dateTime={quiet}>{formatDay(quiet)}</time>
          </>
        )}
      </p>
    </section>
  )
}
