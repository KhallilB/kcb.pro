import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { fixtureProgress } from '@app/portfolio/progress/fixture-progress'
import { AppRoutes } from './AppRoutes'
import { SiteProvider } from './site-context'

function visit(path: string) {
  return render(
    <SiteProvider asOf="2026-10-21" progress={fixtureProgress}>
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
        name: 'Frontend engineer who makes complicated products simple.',
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

  it('features ranked work by rank, then links to all of it', () => {
    visit('/')
    const work = screen.getByRole('region', { name: 'Selected work' })
    const cards = within(work).getAllByRole('article')
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Bezl',
      'kbui',
    ])
    for (const card of cards) {
      expect(card).toHaveTextContent('In progress · as of 21 Oct 2026')
    }
    const last = within(work).getAllByRole('link').at(-1)
    expect(last).toHaveAccessibleName('All work')
    expect(last).toHaveAttribute('href', '/work')
  })

  it('describes each project in words, with no picture', () => {
    const { container } = visit('/')
    const cards = within(screen.getByRole('region', { name: 'Selected work' })).getAllByRole(
      'article'
    )
    expect(cards[0]).toHaveTextContent('running Codex and Claude Code on the same task')
    expect(cards[1]).toHaveTextContent('Colours, spacing and type live in one token file')
    expect(container.querySelector('.card svg, .card img, .wip')).toBeNull()
  })

  it('keeps planned studies off home until one is finished', () => {
    visit('/')
    expect(screen.queryByRole('region', { name: 'Up next' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Work studies' })).toBeNull()
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

  it('puts every way to reach me in the footer', () => {
    visit('/work/bezl')
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByRole('link', { name: 'hi@kcb.pro' })).toHaveAttribute(
      'href',
      'mailto:hi@kcb.pro'
    )
    expect(footer.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/khallilbailey'
    )
    expect(footer.getByRole('link', { name: /Résumé/ })).toHaveAttribute(
      'href',
      '/khallil-bailey-resume.pdf'
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
    expect(rows[1]).toHaveTextContent('running Codex and Claude Code on the same task')
    expect(rows[2]).toHaveTextContent('Colours, spacing and type live in one token file')
    expect(rows).toHaveLength(3)
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

  it("shows Bezl's progress under the header and above the brief", () => {
    visit('/work/bezl')
    const card = screen.getByRole('region', { name: 'Progress' })
    expect(card).toHaveTextContent(
      'One window that runs AI coding assistants side by side, with one writer per task.'
    )
    expect(card).toHaveTextContent('3 of 6 done, 1 in progress, 2 planned')
    expect(card).toHaveTextContent(
      'Next up: A Claude Code reviewer cannot write'
    )
    expect(card).toHaveTextContent('Updated 21 Oct 2026')
    expect(within(card).getAllByRole('img')).toHaveLength(6)
    const brief = screen.getByRole('heading', { level: 2, name: 'The problem' })
    expect(
      card.compareDocumentPosition(brief) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('keeps Full history closed after the brief, every step anchored in journey order', () => {
    visit('/work/bezl')
    const record = document.getElementById('record') as HTMLDetailsElement
    expect(record).not.toHaveAttribute('open')
    const last = screen.getByRole('heading', { level: 2, name: 'Use of AI' })
    expect(
      last.compareDocumentPosition(record) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      Array.from(record.querySelectorAll('.record__row'), (r) => r.id)
    ).toEqual([
      '2026-10-20-libghostty-vt',
      '2026-10-20-reviewer-readonly-codex',
      '2026-10-21-scaffold',
      '2026-10-20-pty-throughput',
      '2026-10-20-reviewer-readonly-claude',
      '2026-10-21-pty-memory',
    ])
  })

  it('shows commit activity inside the record', () => {
    visit('/work/bezl')
    const record = document.getElementById('record') as HTMLDetailsElement
    record.open = true
    expect(
      within(record).getByRole('region', { name: 'Activity' })
    ).toHaveTextContent('11 commits in the last 12 weeks')
  })

  it('shows outcomes only: no pass mark, measurement, evidence or repository link beyond source and downloads', () => {
    const { container } = visit('/work/bezl')
    expect(container).not.toHaveTextContent('No lost bytes, echo under 100 ms')
    expect(container).not.toHaveTextContent('Surplus bytes per pane')
    expect(container).not.toHaveTextContent('RESULT.md')
    expect(screen.queryByRole('group', { name: 'Filter entries' })).toBeNull()
    const hrefs = Array.from(
      container.querySelectorAll('a'),
      (a) => a.getAttribute('href') ?? ''
    )
    expect(
      hrefs.filter((href) => href.includes('github.com/KhallilB/bezl'))
    ).toEqual([
      'https://github.com/KhallilB/bezl',
      'https://github.com/KhallilB/bezl/releases',
    ])
  })

  it('shows nothing in place of progress for a project without it', () => {
    visit('/work/gallery')
    expect(screen.queryByRole('region', { name: 'Build log' })).toBeNull()
    expect(screen.getByRole('main')).not.toHaveTextContent('Nothing here yet')
    expect(screen.queryByRole('region', { name: 'Progress' })).toBeNull()
    expect(document.getElementById('record')).toBeNull()
  })

  it('shows no empty placeholders', () => {
    visit('/work/kbui')
    expect(screen.queryByRole('region', { name: 'Build log' })).toBeNull()
    expect(screen.getByRole('main')).not.toHaveTextContent('Nothing here yet')
  })

  it('renders every brief section as a heading with a contents link', () => {
    visit('/work/bezl')
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toContain('The problem')
    expect(headings).toContain('What I’ve proven so far')
    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(within(toc).getByRole('link', { name: 'The problem' })).toHaveAttribute(
      'href',
      '#the-problem'
    )
  })

  it('links kbui to its public source', () => {
    visit('/work/kbui')
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /Source/ })
    ).toHaveAttribute('href', 'https://github.com/KhallilB/kbui')
  })

  it('offers Bezl’s public source and its downloads', () => {
    visit('/work/bezl')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: /Source/ })).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/bezl'
    )
    expect(main.getByRole('link', { name: /Download/ })).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/bezl/releases'
    )
  })

  it('shows source only where it is public', () => {
    visit('/work/gallery')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: /Source/ })).toHaveAttribute(
      'href',
      'https://github.com/KhallilB/kcb.pro'
    )
  })

  it.each(['/work/wander', '/work/mugen-arena'])('sends hidden project %s to the not-found page', (path) => {
    visit(path)
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
  it('links a study to the project it feeds', () => {
    visit('/studies/terminal-speed')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How VS Code’s terminal keeps up with a flood of output',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Teardown')).toBeInTheDocument()
    const spec = screen.getByRole('group', { name: 'Spec' })
    expect(spec).toHaveTextContent('Used by')
    expect(within(spec).getByRole('link', { name: 'Bezl' })).toHaveAttribute(
      'href',
      '/work/bezl'
    )
  })

  it('says plainly what each study leaves behind', () => {
    visit('/studies/figma-canvas')
    expect(screen.getByText('What I’ll reuse')).toBeInTheDocument()
    expect(screen.queryByText('What it gives the projects')).toBeNull()
  })

  it('says what a study is, with no empty placeholders', () => {
    visit('/studies/figma-canvas')
    expect(screen.getByRole('main')).toHaveTextContent('rebuilding the panning, zooming')
    expect(screen.getByRole('main')).not.toHaveTextContent('Nothing here yet')
  })

  it('says on the index that each study serves a project', () => {
    visit('/studies')
    const lede = screen.getByRole('main').querySelector('.lede')
    expect(lede).toHaveTextContent('redesigns an older tool people still rely on')
    expect(lede).toHaveTextContent('a planned feature in one of my projects')
  })

  it('lists all three studies on the index', () => {
    visit('/studies')
    expect(within(screen.getByRole('main')).getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('about', () => {
  it('names both projects under what I am building, and no hidden one', () => {
    visit('/about')
    const main = screen.getByRole('main')
    for (const [name, href] of [
      ['Bezl', '/work/bezl'],
      ['kbui', '/work/kbui'],
    ]) {
      expect(within(main).getByRole('link', { name })).toHaveAttribute('href', href)
    }
    expect(main).not.toHaveTextContent('Mugen Arena')
  })

  it('links out to the code', () => {
    visit('/about')
    expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: /GitHub/ })
    ).toHaveAttribute('href', 'https://github.com/KhallilB')
  })

  it('talks about the work, not about how the site is dated', () => {
    visit('/about')
    const text = screen.getByRole('main').textContent ?? ''
    expect(text).not.toContain('You’ll see dates on everything here')
    expect(text).not.toContain('This site is the third')
    expect(text).toContain('side by side, and kbui, the design system my projects share')
  })

  it('lists past roles, newest first', () => {
    visit('/about')
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    const text = main.textContent ?? ''
    const order = ['Databricks', 'Panther', 'Datable', 'Presidio Identity'].map((c) =>
      text.indexOf(c)
    )
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('says what each company does, then what I did there', () => {
    visit('/about')
    const rows = within(screen.getByRole('list', { name: 'Experience' })).getAllByRole('listitem')
    expect(rows).toHaveLength(4)
    const panther = rows[1].textContent ?? ''
    const company = panther.indexOf('A security platform that helps teams spot and stop attacks')
    const did = panther.indexOf('I built the interface for Panther’s AI features')
    expect(company).toBeGreaterThan(-1)
    expect(did).toBeGreaterThan(company)
  })

  it('never names a hidden project', () => {
    visit('/about')
    const text = screen.getByRole('main').textContent ?? ''
    for (const name of ['Deck Workshop', 'Wander']) {
      expect(text).not.toContain(name)
    }
  })
})

describe('shared portfolio layout', () => {
  it('keeps each shared project card an article with one title link', () => {
    const { container } = visit('/')
    const work = screen.getByRole('region', { name: 'Selected work' })
    const cards = within(work).getAllByRole('article')
    expect(container.querySelector('.cards')).toHaveClass('kb-grid')
    for (const card of cards) {
      expect(card).toHaveClass('kb-card')
      expect(within(card).getAllByRole('link')).toHaveLength(1)
      expect(within(card).queryByRole('button')).toBeNull()
      expect(card).not.toHaveAttribute('tabindex')
      expect(within(card).getByRole('link')).toHaveClass('card__link')
    }
  })

  it.each(['/work', '/studies'])(
    'preserves native ruled lists on %s',
    (path) => {
      visit(path)
      const main = within(screen.getByRole('main'))
      const list = main.getByRole('list')
      expect(list.tagName).toBe('UL')
      expect(list).toHaveClass('kb-grid', 'rows')
      expect(list).toHaveAttribute('data-layout', 'stack')
      for (const row of main.getAllByRole('listitem')) {
        expect(row).toHaveClass('kb-card', 'row')
        expect(row).toHaveAttribute('data-appearance', 'plain')
        expect(within(row).getAllByRole('link')).toHaveLength(1)
      }
    }
  )
})
