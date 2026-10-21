import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { tomeData } from '@app/tome/copy'
import { useSite } from '../site'

// Full-viewport book over the home page; any failure hands the visitor the plain list.
export function TomeStage({ onList }: { onList: () => void }) {
  const { asOf, tome } = useSite()
  const navigate = useNavigate()
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const leave = useRef(onList)
  leave.current = onList

  useEffect(() => {
    const el = host.current
    if (!el || !tome.supportsWebGL()) {
      leave.current()
      return
    }
    let cancelled = false
    let destroy: (() => void) | null = null
    tome
      .load()
      .then(({ mountTome }) => {
        if (cancelled) return
        destroy = mountTome(el, {
          data: tomeData(asOf),
          onList: () => leave.current(),
          onNavigate: (path) => navigate(path),
        })
        if (destroy) setReady(true)
        else leave.current()
      })
      .catch(() => {
        if (!cancelled) leave.current()
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
      <button type="button" className="tome__list" onClick={onList}>
        List view
      </button>
    </div>
  )
}
