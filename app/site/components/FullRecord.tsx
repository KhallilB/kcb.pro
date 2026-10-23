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
  const { pathname, hash, key } = useLocation()
  const ref = useRef<HTMLDetailsElement>(null)

  // Path, hash or same-link navigation re-opens; runs before 1b's seek.
  useEffect(() => {
    const details = ref.current
    if (!details) return
    // :target goes stale under pushState, so the landed mark is ours.
    for (const el of details.querySelectorAll<HTMLElement>('[data-landed]'))
      delete el.dataset.landed
    const target = document.getElementById(idFromHash(hash))
    if (!target || !details.contains(target)) return
    details.open = true
    target.dataset.landed = ''
    target.scrollIntoView({ block: 'start' })
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1
    target.focus({ preventScroll: true })
  }, [pathname, hash, key])

  const steps = journeySteps(progress.entries, asOf)
  return (
    // Browsers may open it on fragment navigation before hydration.
    <details id="record" className="record" ref={ref} suppressHydrationWarning>
      <summary className="record__summary">
        <h2 className="h2">The full record</h2>
      </summary>
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
