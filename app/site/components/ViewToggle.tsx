import type { HomeView } from '../home-view'

const OPTIONS: { view: HomeView; label: string; spoken: string }[] = [
  { view: 'tome', label: '3D', spoken: ' book' },
  { view: 'list', label: '2D', spoken: ' list' },
]

// A brass slider in a leather track: the same control in both views, so switching never moves it.
export function ViewToggle({
  view,
  onChange,
}: {
  view: HomeView
  onChange: (view: HomeView) => void
}) {
  return (
    <div className="view-toggle" role="group" aria-label="View" data-view={view}>
      <span className="view-toggle__thumb" aria-hidden="true" />
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
