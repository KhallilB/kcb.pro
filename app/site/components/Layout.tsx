import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { formatDay } from '@app/portfolio/domain/dates'
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
  const [view, setView] = useHomeView()
  // Unknown until hydration; false hides the book and its toggle for good.
  const [tomeWorks, setTomeWorks] = useState<boolean | null>(null)
  const isHome = pathname === '/'
  const canTome = isHome && tomeWorks === true

  useEffect(() => setTomeWorks(tome.supportsWebGL()), [tome])
  const stageOn = canTome && view === 'tome'
  // Mirrors the inline script's flag in index.html; clearing it reveals the list.
  useEffect(() => {
    const flags = document.documentElement.dataset
    if (stageOn) flags.tome = 'open'
    else delete flags.tome
  }, [stageOn])

  // Leaving the book lands at the top of the list with focus on the content.
  const showList = () => {
    setView('list')
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.getElementById('content')?.focus({ preventScroll: true })
    })
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
      onChange={(next) => (next === 'list' ? showList() : setView('tome'))}
    />
  )

  return (
    <>
      {stageOn && (
        <TomeStage onList={showList} onFail={() => setTomeWorks(false)} insetTop={insetTop} />
      )}
      {/* Over the book it floats outside the inert page; over the list it sits in the header. */}
      {stageOn && toggle}
      <div
        className={canTome ? 'shell shell--toggle' : 'shell'}
        inert={stageOn ? true : undefined}
      >
        <a className="skip" href="#content">
          Skip to content
        </a>
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
          {!stageOn && toggle}
        </header>
        <main id="content" className="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="footer">
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
