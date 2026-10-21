import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { formatDay } from '@app/portfolio/domain/dates'
import { useHomeView } from '../home-view'
import { pageMeta } from '../meta'
import { useSite } from '../site'
import { TomeStage } from './TomeStage'

const NAV = [
  { to: '/work', label: 'Work' },
  { to: '/studies', label: 'Studies' },
  { to: '/about', label: 'About' },
]

export function Layout() {
  const { asOf, profile } = useSite()
  const { pathname } = useLocation()
  const [view, setView] = useHomeView()
  const [hydrated, setHydrated] = useState(false)
  const isHome = pathname === '/'
  const tomeOpen = isHome && view === 'tome'

  useEffect(() => setHydrated(true), [])
  const stageOn = hydrated && tomeOpen
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

  return (
    <>
      {stageOn && <TomeStage onList={showList} />}
      <div className="shell" inert={stageOn ? true : undefined}>
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
              {isHome && hydrated && !tomeOpen && (
                <li>
                  <button
                    type="button"
                    className="nav__tome"
                    onClick={() => setView('tome')}
                  >
                    Open the tome
                  </button>
                </li>
              )}
            </ul>
          </nav>
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
