import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { formatDay } from '@app/portfolio/domain/dates'
import {
  earlierEntries,
  journeySteps,
  STATUS_WORD,
  type PublicProgress,
} from '@app/portfolio/domain/progress'
import { useSite } from '../site'
import { Activity } from './Activity'
import { idFromHash } from './anchor'

// Prerendered closed so hydration matches; a hash naming anything inside opens it after.
export function FullRecord({ progress }: { progress: PublicProgress }) {
  const { asOf } = useSite()
  const { pathname, hash } = useLocation()
  const ref = useRef<HTMLDetailsElement>(null)

  // Re-runs on every navigation, before the book's seek looks for the entry.
  useEffect(() => {
    const details = ref.current
    const target = document.getElementById(idFromHash(hash))
    if (!details || !target || !details.contains(target)) return
    details.open = true
    target.scrollIntoView({ block: 'start' })
  }, [pathname, hash])

  const steps = journeySteps(progress.entries, asOf)
  return (
    <details id="record" className="record" ref={ref}>
      <summary className="record__summary h2">The full record</summary>
      <ol className="record__rows">
        {steps.map((step) => {
          const earlier = earlierEntries(progress.entries, step, asOf)
          return (
            <li key={step.id} id={step.id} className="record__row">
              <p className="result">
                <span
                  className="mark"
                  data-result={step.result}
                  aria-hidden="true"
                />
                <span className="result__text">{STATUS_WORD[step.result]}</span>
              </p>
              <div className="record__main">
                <p className="record__title">{step.title}</p>
                {step.summary && <p className="record__text">{step.summary}</p>}
                <p className="mono secondary">
                  <time dateTime={step.date}>{formatDay(step.date)}</time>
                </p>
                {earlier.length > 0 && (
                  <ol
                    className="record__earlier"
                    aria-label={`Earlier: ${step.title}`}
                  >
                    {earlier.map((e) => (
                      <li key={e.id} id={e.id} className="record__line">
                        <time dateTime={e.date}>{formatDay(e.date)}</time> ·{' '}
                        {STATUS_WORD[e.result]} · {e.summary ?? e.title}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <Activity days={progress.days} />
    </details>
  )
}
