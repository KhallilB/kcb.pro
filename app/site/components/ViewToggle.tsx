import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import type { HomeView } from '../home-view'

const OPTIONS: { view: HomeView; label: string; spoken: string }[] = [
  { view: 'tome', label: '3D', spoken: ' book' },
  { view: 'list', label: '2D', spoken: ' list' },
]

// Switching views remounts the toggle elsewhere; the new one starts where the old thumb was.
let lastShown: HomeView | null = null

// A brass slider in a leather track.
export function ViewToggle({
  view,
  onChange,
  ref,
}: {
  view: HomeView
  onChange: (view: HomeView) => void
  ref?: Ref<HTMLDivElement>
}) {
  const [shown, setShown] = useState(lastShown ?? view)
  const thumb = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    lastShown = view
    if (shown === view) return
    // Commit the start position so the slide animates.
    thumb.current?.getBoundingClientRect()
    setShown(view)
  }, [view, shown])

  return (
    <div ref={ref} className="view-toggle" role="group" aria-label="View" data-view={shown}>
      <span ref={thumb} className="view-toggle__thumb" aria-hidden="true" />
      {OPTIONS.map((o) => (
        <button
          key={o.view}
          type="button"
          className="view-toggle__option"
          aria-pressed={view === o.view}
          onClick={() => view !== o.view && onChange(o.view)}
        >
          {o.label}
          <span className="sr-only">{o.spoken}</span>
        </button>
      ))}
    </div>
  )
}
