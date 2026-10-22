import { renderPage } from '../entry-server'

describe('renderPage', () => {
  it('renders a project route to HTML with its title', () => {
    const page = renderPage('/work/bezl', '2026-10-21')
    expect(page.status).toBe(200)
    expect(page.title).toBe('Bezl · Khallil Bailey')
    expect(page.html).toContain('<h1')
    expect(page.html).toContain('Bezl')
    expect(page.html).toContain('as of 21 Oct 2026')
  })

  it('renders the not-found page with a 404 status', () => {
    const page = renderPage('/missing', '2026-10-21')
    expect(page.status).toBe(404)
    expect(page.html).toContain('There’s nothing at this address.')
  })
})
