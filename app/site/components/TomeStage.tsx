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
      data-shown={shown || undefined}
      inert={shown ? undefined : true}
    >
      <div className="tome__fog tome__fog--a" aria-hidden="true" />
      <div className="tome__fog tome__fog--b" aria-hidden="true" />
      <div className="tome__fog tome__fog--c" aria-hidden="true" />
      <div className="tome__vignette" aria-hidden="true" />
      <div ref={host} className="tome__host" />
      {!ready && <p className="tome__loading">Opening the tome…</p>}
    </div>
  )
}
