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
        name: 'Frontend engineer building web apps that do real work.',
      })
    ).toBeInTheDocument()
  })

  it('names what is being built now, dated by the build', () => {
    visit('/')
    const live = screen.getByTestId('now-building')
    expect(within(live).getByRole('link', { name: 'Bezl' })).toHaveAttribute(
      'href',
      '/work/bezl'
    )
    expect(live).toHaveTextContent('as of 21 Oct 2026')
  })

  it('features the two endeavors with dated status', () => {
    visit('/')
    const work = screen.getByRole('region', { name: 'Selected work' })
    const cards = within(work).getAllByRole('article')
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Bezl',
      'kbui',
    ])
    expect(cards[0]).toHaveTextContent('In progress · as of 21 Oct 2026')
    expect(cards[1]).toHaveTextContent('In progress · as of 21 Oct 2026')
  })

  it('describes each project in words, with no picture', () => {
    const { container } = visit('/')
    const cards = within(screen.getByRole('region', { name: 'Selected work' })).getAllByRole(
      'article'
    )
    expect(cards[0]).toHaveTextContent('runs Codex, Claude Code and Gemini CLI')
    expect(cards[1]).toHaveTextContent('keeps every value in one token file')
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
    visit('/work/kbui')
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
      'Last updated 21 Oct 2026'
    )
  })
})

describe('work index', () => {
  it('describes every project in its row', () => {
    visit('/work')
    const rows = within(screen.getByRole('main')).getAllByRole('listitem')
    expect(rows[1]).toHaveTextContent('runs Codex, Claude Code and Gemini CLI')
    expect(rows[2]).toHaveTextContent('keeps every value in one token file')
  })

  it('lists live work first, then what is next', () => {
    visit('/work')
    const rows = within(screen.getByRole('main')).getAllByRole('listitem')
    expect(rows.map((r) => within(r).getByRole('link').textContent)).toEqual([
      'The Gallery',
      'Bezl',
      'kbui',
    ])
  })
})

describe('project page', () => {
  it('leads with the spec header', () => {
    visit('/work/bezl')
    expect(screen.getByRole('heading', { level: 1, name: 'Bezl' })).toBeInTheDocument()
    const spec = screen.getByRole('group', { name: 'Spec' })
    expect(spec).toHaveTextContent('Role')
    expect(spec).toHaveTextContent('Tauri 2')
    expect(spec).toHaveTextContent('In progress · as of 21 Oct 2026')
  })

  it('holds an empty build log until GitHub and the changelog are linked', () => {
    visit('/work/kbui')
    const log = screen.getByRole('region', { name: 'Build log' })
    expect(log).toHaveTextContent('Nothing here yet')
    expect(within(log).queryByRole('img')).toBeNull()
  })

  it('renders every brief section as a heading with a contents link', () => {
    visit('/work/bezl')
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toContain('The problem')
    expect(headings).toContain('What is proven so far')
    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(within(toc).getByRole('link', { name: 'The problem' })).toHaveAttribute(
      'href',
      '#the-problem'
    )
  })

  it.each([
    ['bezl', 'https://github.com/KhallilB/bezl'],
    ['kbui', 'https://github.com/KhallilB/kbui'],
  ])('links %s to its public source', (slug, href) => {
    visit(`/work/${slug}`)
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Source/ })
    ).toHaveAttribute('href', href)
  })

  it('shows source only where it is public', () => {
    visit('/work/gallery')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: /Source/ })).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/kcb.pro'
    )
  })

  it('sends a hidden project to the not-found page', () => {
    visit('/work/wander')
    expect(
      screen.getByRole('heading', { level: 1, name: 'There’s nothing at this address.' })
    ).toBeInTheDocument()
  })

  it('sends an unknown project to the not-found page', () => {
    visit('/work/nope')
    expect(
      screen.getByRole('heading', { level: 1, name: 'There’s nothing at this address.' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /See all my work/ })).toHaveAttribute(
      'href',
      '/work'
    )
  })
})

describe('studies', () => {
  it('shows a study that feeds no listed project without a Used by row', () => {
    visit('/studies/map-labels')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How Apple Maps and Google Maps decide which labels you see',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Teardown')).toBeInTheDocument()
    const spec = screen.getByRole('group', { name: 'Spec' })
    expect(spec).not.toHaveTextContent('Used by')
    expect(within(spec).queryByRole('link', { name: 'Wander' })).toBeNull()
  })

  it('says what a study is and holds an empty build log', () => {
    visit('/studies/figma-canvas')
    expect(screen.getByRole('main')).toHaveTextContent('rebuild of its panning, zooming')
    expect(screen.getByRole('region', { name: 'Build log' })).toHaveTextContent('Nothing here yet')
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
