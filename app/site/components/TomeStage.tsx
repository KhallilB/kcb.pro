import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { tomeData } from '@app/tome/copy'
import { useSite } from '../site'

// Full-viewport book over the home page. onList: the reader left; onFail: it cannot run here.
export function TomeStage({
  onList,
  onFail,
  insetTop,
}: {
  onList: () => void
  onFail: () => void
  insetTop: () => number
}) {
  const { asOf, tome } = useSite()
  const navigate = useNavigate()
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const handlers = useRef({ onList, onFail, insetTop })
  handlers.current = { onList, onFail, insetTop }

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    let destroy: (() => void) | null = null
    tome
      .load()
      .then(({ mountTome }) => {
        if (cancelled) return
        destroy = mountTome(el, {
          data: tomeData(asOf),
          onList: () => handlers.current.onList(),
          onNavigate: (path) => navigate(path),
          insetTop: () => handlers.current.insetTop(),
        })
        if (destroy) setReady(true)
        else handlers.current.onFail()
      })
      .catch(() => {
        if (!cancelled) handlers.current.onFail()
      })
    return () => {
      cancelled = true
      destroy?.()
    }
  }, [asOf, tome, navigate])

  return (
    <div className="tome" data-ready={ready || undefined}>
      <div className="tome__fog tome__fog--a" aria-hidden="true" />
      <div className="tome__fog tome__fog--b" aria-hidden="true" />
      <div className="tome__fog tome__fog--c" aria-hidden="true" />
      <div className="tome__vignette" aria-hidden="true" />
      <div ref={host} className="tome__host" />
      {!ready && <p className="tome__loading">Opening the tome…</p>}
    </div>
  )
}
