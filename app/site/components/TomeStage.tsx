import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router'
import { tomeData } from '@app/tome/copy'
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
  const [ready, setReady] = useState(false)
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
        })
        if (!handle) return handlers.current.onFail()
        engine.current = handle
        setReady(true)
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
      data-boot={(boot && !ready) || undefined}
      data-shown={shown || undefined}
      inert={shown ? undefined : true}
    >
      <div className="tome__fog tome__fog--a" aria-hidden="true" />
      <div className="tome__fog tome__fog--b" aria-hidden="true" />
      <div className="tome__fog tome__fog--c" aria-hidden="true" />
      <div className="tome__vignette" aria-hidden="true" />
      <div ref={host} className="tome__host" />
      {/* Stays mounted after ready so it can fade out as the book fades in. */}
      <div
        className="tome__loading"
        role={ready ? undefined : 'status'}
        aria-hidden={ready || undefined}
      >
        <Lozenge />
        <p className="tome__loading-text">Loading the fancy version</p>
        <span className="tome__loading-rule" aria-hidden="true" />
      </div>
    </div>
  )
}

// The cover's centrepiece: gilt lozenge, teal gem, a fleuron at each point.
function Lozenge() {
  const star = 'M0-6L1.5-1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5-1.5Z'
  return (
    <svg className="tome__lozenge" viewBox="-60 -62 120 124" aria-hidden="true">
      <path className="tome__fillet" pathLength={1} d="M0-44L30 0L0 44L-30 0Z" />
      <path className="tome__fillet tome__fillet--inner" pathLength={1} d="M0-38L25 0L0 38L-25 0Z" />
      <path className="tome__gem" d="M0-20L13 0L0 20L-13 0Z" />
      <path className="tome__facet" d="M0-20L-13 0L0 0Z" />
      <path className="tome__facet tome__facet--shade" d="M0 20L13 0L0 0Z" />
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
