import { renderPage } from '../entry-server'
import { fixtureProgress } from '../portfolio/progress/fixture-progress'

describe('renderPage', () => {
  it('renders a project route to HTML with its title', () => {
    const page = renderPage('/work/bezl', '2026-10-21', {})
    expect(page.status).toBe(200)
    expect(page.title).toBe('Bezl · Khallil Bailey')
    expect(page.html).toContain('<h1')
    expect(page.html).toContain('Bezl')
    expect(page.html).toContain('as of 21 Oct 2026')
  })

  it('renders the journey card and a closed record with every entry anchored', () => {
    const page = renderPage('/work/bezl', '2026-10-21', fixtureProgress)
    expect(page.html).toContain('id="progress"')
    expect(page.html).toContain('Where it stands')
    expect(page.html).toContain('<details id="record" class="record">')
    expect(page.html).toContain('id="2026-10-20-pty-throughput"')
    expect(page.html).not.toContain('Filter entries')
  })

  it('renders the not-found page with a 404 status', () => {
    const page = renderPage('/missing', '2026-10-21', {})
    expect(page.status).toBe(404)
    expect(page.html).toContain('There’s nothing at this address.')
  })
})
