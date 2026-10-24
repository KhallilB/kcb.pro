import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router'
import { tomeData } from '@app/tome/copy'
import { CLOUDS, cloudImage, type CloudSpec } from '@app/tome/clouds'
import type { TomeHandle } from '@app/tome/engine.js'
import type { TomePlace } from '@app/tome/place'
import { useSite } from '../site'

// Full-viewport book over the page. Built once; hidden it sleeps so returning is instant.
// arrival: place to turn to when shown, read once. onList: the reader left; onFail: it cannot run here.
export function TomeStage({
  shown,
  engine,
  arrival,
  onList,
  onFail,
  insetTop,
}: {
  shown: boolean
  engine: RefObject<TomeHandle | null>
  arrival: () => TomePlace | null
  onList: () => void
  onFail: () => void
  insetTop: () => number
}) {
  const { asOf, tome } = useSite()
  const navigate = useNavigate()
  const host = useRef<HTMLDivElement>(null)
  // fetching the engine, drawing its first frame, then ready (the book is on screen).
  const [stage, setStage] = useState<'fetching' | 'drawing' | 'ready'>('fetching')
  const ready = stage === 'ready'
  // Cover open: the clouds in front of the book part.
  const [open, setOpen] = useState(false)
  // Mounted over the boot script's mist: appear at once, since a fade would show the page through.
  const [boot] = useState(() => document.documentElement.dataset.tome === 'pending')
  // navigate changes with every route; the engine must outlive routes.
  const handlers = useRef({ shown, arrival, onList, onFail, insetTop, navigate })
  handlers.current = { shown, arrival, onList, onFail, insetTop, navigate }

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    let handle: TomeHandle | null = null
    tome
      .load()
      .then(({ mountTome }) => {
        if (cancelled) return
        handle = mountTome(el, {
          data: tomeData(asOf),
          onList: () => handlers.current.onList(),
          onNavigate: (path) => {
            handlers.current.navigate(path)
            window.scrollTo(0, 0)
          },
          insetTop: () => handlers.current.insetTop(),
          onReady: () => {
            if (!cancelled) setStage('ready')
          },
          onOpen: (next) => {
            if (!cancelled) setOpen(next)
          },
        })
        if (!handle) return handlers.current.onFail()
        engine.current = handle
        setStage((now) => (now === 'ready' ? now : 'drawing'))
        if (!handlers.current.shown) handle.hide()
        else {
          const place = handlers.current.arrival()
          if (place) handle.show(place)
        }
      })
      .catch(() => {
        if (!cancelled) handlers.current.onFail()
      })
    return () => {
      cancelled = true
      handle?.destroy()
      if (engine.current === handle) engine.current = null
    }
  }, [asOf, tome, engine])

  // Before the engine is ready the mount above applies the current state.
  useEffect(() => {
    const handle = engine.current
    if (!handle) return
    if (shown) handle.show(handlers.current.arrival())
    else handle.hide()
  }, [shown, engine])

  return (
    <div
      className="tome"
      data-ready={ready || undefined}
      data-stage={ready ? undefined : stage}
      data-open={open || undefined}
      data-boot={(boot && !ready) || undefined}
      data-shown={shown || undefined}
      inert={shown ? undefined : true}
    >
      <Mist />
      <div className="tome__vignette" aria-hidden="true" />
      <div ref={host} className="tome__host" />
      <Veil />
      {/* Stays mounted after ready so it can fade out as the book fades in. */}
      <div
        className="tome__loading"
        role={ready ? undefined : 'status'}
        aria-hidden={ready || undefined}
      >
        <div className="tome__motes" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="tome__mote" />
          ))}
        </div>
        <div className="tome__seal">
          <svg className="tome__ring" viewBox="-70 -70 140 140" aria-hidden="true">
            <circle className="tome__ring-dots" r={64} pathLength={100} />
            <circle className="tome__ring-line" r={58} />
          </svg>
          <Lozenge />
        </div>
        <p className="tome__loading-text">Loading the fancy version</p>
        <span className="tome__progress" aria-hidden="true">
          <span className="tome__progress-fill" />
        </span>
      </div>
    </div>
  )
}

// useId may contain characters that break url(#id) references.
const svgId = (id: string) => `tome${id.replace(/[^\w-]/g, '')}`

// A cloud layer: drawn once as a small image, scaled up by CSS and drifted by the compositor.
function Cloud({ name, spec, tone }: { name: string; spec: CloudSpec; tone: 'light' | 'dark' }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--cloud-${tone}`).trim()
    cloudImage(spec, color)
      .then((url) => live && setSrc(url))
      // Decorative: without canvas the sky's gradient stands on its own.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [spec, tone])
  return src ? <img className={name} src={src} alt="" aria-hidden="true" /> : null
}

// Behind the book: shaded banks far back, pale ones nearer, moving faster in the same wind.
function Mist() {
  return (
    <>
      <Cloud name="tome__mist tome__mist--far" spec={CLOUDS.far} tone="dark" />
      <Cloud name="tome__mist tome__mist--near" spec={CLOUDS.near} tone="light" />
    </>
  )
}

// In front of the closed book. Each bank drifts inside a wrapper that data-open slides aside.
function Veil() {
  return (
    <>
      <div className="tome__veil tome__veil--left" aria-hidden="true">
        <Cloud name="tome__veil-cloud" spec={CLOUDS.veilLeft} tone="light" />
      </div>
      <div className="tome__veil tome__veil--right" aria-hidden="true">
        <Cloud name="tome__veil-cloud" spec={CLOUDS.veilRight} tone="light" />
      </div>
    </>
  )
}

// The cover's centrepiece: gilt lozenge, teal gem, a fleuron at each point.
function Lozenge() {
  const star = 'M0-6L1.5-1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5-1.5Z'
  const gem = 'M0-20L13 0L0 20L-13 0Z'
  const clip = svgId(useId())
  return (
    <svg className="tome__lozenge" viewBox="-60 -62 120 124" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={gem} />
        </clipPath>
      </defs>
      <path className="tome__fillet" pathLength={1} d="M0-44L30 0L0 44L-30 0Z" />
      <path className="tome__fillet tome__fillet--inner" pathLength={1} d="M0-38L25 0L0 38L-25 0Z" />
      <path className="tome__gem" d={gem} />
      <path className="tome__facet" d="M0-20L-13 0L0 0Z" />
      <path className="tome__facet tome__facet--shade" d="M0 20L13 0L0 0Z" />
      {/* Light sweeping across the glass. */}
      <g clipPath={`url(#${clip})`}>
        <rect className="tome__sheen" x={-4} y={-24} width={6} height={48} />
      </g>
      {[
        [0, -54],
        [40, 0],
        [0, 54],
        [-40, 0],
      ].map(([x, y], i) => (
        <path key={i} className="tome__fleuron" d={star} transform={`translate(${x} ${y})`} />
      ))}
    </svg>
  )
}
