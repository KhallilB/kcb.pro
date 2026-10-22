import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { formatDay } from '@app/portfolio/domain/dates'
import type { TomeHandle } from '@app/tome/engine.js'
import { pathOfPlace, placeOfPath, type TomePlace } from '@app/tome/place'
import { useHomeView } from '../home-view'
import { pageMeta } from '../meta'
import { useSite } from '../site'
import { TomeStage } from './TomeStage'
import { ViewToggle } from './ViewToggle'

const NAV = [
  { to: '/work', label: 'Work' },
  { to: '/studies', label: 'Studies' },
  { to: '/about', label: 'About' },
]

export function Layout() {
  const { asOf, profile, tome } = useSite()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useHomeView()
  // Unknown until hydration; false hides the book and its toggle for good.
  const [tomeWorks, setTomeWorks] = useState<boolean | null>(null)
  const isHome = pathname === '/'
  const canTome = tomeWorks === true
  // Off home the book opens only where the reader asked for it, never on arrival.
  const [tomePath, setTomePath] = useState<string | null>(null)

  useEffect(() => setTomeWorks(tome.supportsWebGL()), [tome])
  const stageOn = canTome && view === 'tome' && (isHome || pathname === tomePath)
  // Once built the book stays mounted, asleep, across views and pages.
  const [built, setBuilt] = useState(false)
  if (stageOn && !built) setBuilt(true)
  // Fetch the engine while the list is read, so the first 3D switch only builds.
  useEffect(() => {
    if (!canTome || stageOn || built) return
    const fetchIt = () => void tome.load().catch(() => {})
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500))
    idle(fetchIt)
  }, [canTome, stageOn, built, tome])
  const engine = useRef<TomeHandle | null>(null)
  const arrival = useRef<TomePlace | null>(null)
  // A page read in 2D is where the book opens next.
  useEffect(() => {
    if (!isHome) arrival.current = placeOfPath(pathname)
  }, [isHome, pathname])

  // Mirrors the inline script's flag in index.html; clearing it reveals the list.
  const wasOn = useRef(stageOn)
  useEffect(() => {
    const flags = document.documentElement.dataset
    if (stageOn) flags.tome = 'open'
    else delete flags.tome
    const left = wasOn.current && !stageOn
    wasOn.current = stageOn
    if (!left) return
    // The page rises into place as the book fades.
    flags.tomeLeft = ''
    const done = setTimeout(() => delete flags.tomeLeft, 900)
    return () => clearTimeout(done)
  }, [stageOn])

  // Leaving the book shows the chapter being read: its card on home, else its page.
  const showList = () => {
    const place = engine.current?.place()
    setView('list')
    setTomePath(null)
    const page = !isHome && place && place !== placeOfPath(pathname) && pathOfPlace(place)
    if (page) navigate(page)
    requestAnimationFrame(() => {
      const spot = isHome && place && document.querySelector(`[data-place="${place}"]`)
      if (spot) spot.scrollIntoView({ block: 'center' })
      else if (isHome || page) window.scrollTo(0, 0)
      document.getElementById('content')?.focus({ preventScroll: true })
    })
  }
  const showTome = () => {
    if (!isHome) {
      setTomePath(pathname)
      arrival.current = placeOfPath(pathname)
    }
    setView('tome')
  }
  useEffect(() => {
    document.title = pageMeta(pathname).title
  }, [pathname])

  const toggleRef = useRef<HTMLDivElement>(null)
  // 12px gap so the book never touches the toggle.
  const insetTop = () => (toggleRef.current?.getBoundingClientRect().bottom ?? 0) + 12
  const toggle = canTome && (
    <ViewToggle
      ref={toggleRef}
      view={stageOn ? 'tome' : 'list'}
      onChange={(next) => (next === 'list' ? showList() : showTome())}
    />
  )

  return (
    <>
      {built && tomeWorks && (
        <TomeStage
          shown={stageOn}
          engine={engine}
          arrival={() => {
            const place = arrival.current
            arrival.current = null
            return place
          }}
          onList={showList}
          onFail={() => setTomeWorks(false)}
          insetTop={insetTop}
        />
      )}
      {!stageOn && (
        <a className="skip" href="#content">
          Skip to content
        </a>
      )}
      {/* One fixed toggle for both views, outside the inert page; the header keeps its slot. */}
      {toggle}
      <div
        className={canTome ? 'shell shell--toggle' : 'shell'}
        inert={stageOn ? true : undefined}
      >
        <header className="header">
          <Link to="/" className="wordmark">
            {profile.name}
            <span className="wordmark__dot" aria-hidden="true" />
          </Link>
          <nav aria-label="Primary">
            <ul className="nav">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className="nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main id="content" className="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="footer" data-place="contact">
          <span>
            Built and measured, as of{' '}
            <time dateTime={asOf} className="mono">
              {formatDay(asOf)}
            </time>
          </span>
          <a href="https://github.com/KhallilB/kcb.pro" className="link">
            Source <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </>
  )
}
