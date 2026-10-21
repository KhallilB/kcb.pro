import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from './AppRoutes'
import { SiteProvider } from './site-context'

function visit(path: string) {
  return render(
    <SiteProvider asOf="2026-10-21">
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </SiteProvider>
  )
}

describe('home', () => {
  it('says who and what in the masthead', () => {
    visit('/')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Frontend engineer building deep, useful web apps.',
      })
    ).toBeInTheDocument()
  })

  it('names what is being built now, dated by the build', () => {
    visit('/')
    const live = screen.getByTestId('now-building')
    expect(within(live).getByRole('link', { name: 'Deck Workshop' })).toHaveAttribute(
      'href',
      '/work/deck-workshop'
    )
    expect(live).toHaveTextContent('as of 21 Oct 2026')
  })

  it('features the three endeavors with dated status', () => {
    visit('/')
    const work = screen.getByRole('region', { name: 'Selected work' })
    const cards = within(work).getAllByRole('article')
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Deck Workshop',
      'Mugen Arena',
      'Wander',
    ])
    expect(cards[0]).toHaveTextContent('In progress · as of 21 Oct 2026')
    expect(cards[1]).toHaveTextContent('Planned · Jan 2027')
    expect(cards[2]).toHaveTextContent('Planned · Apr 2027')
  })

  it('describes each project in words, with no picture', () => {
    const { container } = visit('/')
    const cards = within(screen.getByRole('region', { name: 'Selected work' })).getAllByRole(
      'article'
    )
    expect(cards[0]).toHaveTextContent('files each game you play under the version that played it')
    expect(cards[1]).toHaveTextContent('every fighter is a plain text file')
    expect(cards[2]).toHaveTextContent('layers a city’s open data')
    expect(container.querySelector('.card svg, .card img, .wip')).toBeNull()
  })

  it('lists the three work studies', () => {
    visit('/')
    const section = screen.getByRole('region', { name: 'Work studies' })
    expect(within(section).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/studies/figma-canvas',
      '/studies/map-labels',
      '/studies/benefits-application',
    ])
  })
})

describe('layout', () => {
  it('offers a skip link to the main content', () => {
    visit('/')
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#content'
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'content')
  })

  it('marks the current section in the navigation', () => {
    visit('/work/wander')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'Work' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(within(nav).getByRole('link', { name: 'Studies' })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('stamps the footer with the build day', () => {
    visit('/')
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'Built and measured, as of 21 Oct 2026'
    )
  })
})

describe('work index', () => {
  it('lists live work first, then what is next', () => {
    visit('/work')
    const rows = within(screen.getByRole('main')).getAllByRole('listitem')
    expect(rows.map((r) => within(r).getByRole('link').textContent)).toEqual([
      'The Gallery',
      'Deck Workshop',
      'Mugen Arena',
      'Wander',
    ])
  })
})

describe('project page', () => {
  it('leads with the spec header', () => {
    visit('/work/mugen-arena')
    expect(screen.getByRole('heading', { level: 1, name: 'Mugen Arena' })).toBeInTheDocument()
    const spec = screen.getByRole('group', { name: 'Spec' })
    expect(spec).toHaveTextContent('Role')
    expect(spec).toHaveTextContent('WebGPU')
    expect(spec).toHaveTextContent('Planned · Jan 2027')
  })

  it('holds an empty build log until GitHub and the changelog are linked', () => {
    visit('/work/deck-workshop')
    const log = screen.getByRole('region', { name: 'Build log' })
    expect(log).toHaveTextContent('Nothing linked yet')
    expect(within(log).queryByRole('img')).toBeNull()
  })

  it('renders every brief section as a heading with a contents link', () => {
    visit('/work/deck-workshop')
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toContain('The problem')
    expect(headings).toContain('Signature component')
    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(within(toc).getByRole('link', { name: 'The problem' })).toHaveAttribute(
      'href',
      '#the-problem'
    )
  })

  it('shows no source link for a private repo', () => {
    visit('/work/deck-workshop')
    expect(
      within(screen.getByRole('main')).queryByRole('link', { name: /Source/ })
    ).not.toBeInTheDocument()
  })

  it('shows source only where it is public', () => {
    visit('/work/gallery')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: /Source/ })).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/kcb.pro'
    )
  })

  it('sends an unknown project to the not-found page', () => {
    visit('/work/nope')
    expect(
      screen.getByRole('heading', { level: 1, name: 'This page moved or never existed.' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Everything I have built/ })).toHaveAttribute(
      'href',
      '/work'
    )
  })
})

describe('studies', () => {
  it('shows a study with the endeavors it feeds', () => {
    visit('/studies/map-labels')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How Apple Maps and Google Maps decide which labels you see',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Teardown')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wander' })).toHaveAttribute('href', '/work/wander')
  })

  it('lists all three studies on the index', () => {
    visit('/studies')
    expect(within(screen.getByRole('main')).getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('about', () => {
  it('links out to the code', () => {
    visit('/about')
    expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/KhallilB'
    )
  })
})
