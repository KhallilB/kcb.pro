import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { TomeData } from '@app/tome/copy'
import type { TomePlace } from '@app/tome/place'
import { AppRoutes } from './AppRoutes'
import { SiteProvider } from './site-context'
import type { TomeHooks } from './site'

interface Mounted {
  host: HTMLElement
  data: TomeData
  onList: () => void
  onNavigate: (path: string) => void
  insetTop: () => number
}

function fakeEngine(result: 'mount' | 'fail' = 'mount', reading: TomePlace | null = null) {
  const calls: Mounted[] = []
  const shows: (TomePlace | null)[] = []
  const log = { hides: 0, destroyed: 0 }
  const hooks: TomeHooks = {
    supportsWebGL: () => true,
    load: async () => ({
      mountTome: (host, opts) => {
        calls.push({ host, ...opts })
        if (result === 'fail') return null
        return {
          destroy: () => log.destroyed++,
          show: (place) => shows.push(place),
          hide: () => log.hides++,
          place: () => reading,
        }
      },
    }),
  }
  return { hooks, calls, shows, log }
}

async function visit(path: string, hooks: TomeHooks) {
  const view = render(
    <SiteProvider asOf="2026-10-21" tome={hooks}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </SiteProvider>
  )
  await act(async () => {})
  return view
}

const page = () => document.querySelector('.shell') as HTMLElement
const stage = () => document.querySelector('.tome')
const toggle = () => screen.queryByRole('group', { name: 'View' })
const wordmark = () => document.querySelector('.wordmark') as HTMLElement
const NAMES = { Tome: '3D book', List: '2D list' }
const option = (name: 'Tome' | 'List') =>
  within(screen.getByRole('group', { name: 'View' })).getByRole('button', { name: NAMES[name] })

beforeEach(() => {
  sessionStorage.clear()
  delete document.documentElement.dataset.tome
})

describe('the tome on the home page', () => {
  it('opens over the page and keeps the page behind it inert', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    expect(option('Tome')).toHaveTextContent('3D')
    expect(option('List')).toHaveTextContent('2D')
    expect(option('Tome')).toHaveAttribute('aria-pressed', 'true')
    expect(option('List')).toHaveAttribute('aria-pressed', 'false')
    expect(page()).toHaveAttribute('inert')
    expect(calls).toHaveLength(1)
  })

  it('hands the engine the portfolio’s own chapters', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    expect(calls[0].data.chapters.kbui.title).toBe('kbui')
    expect(calls[0].data.asOf).toBe('21 October 2026')
  })

  it('toggles to the plain list and back without rebuilding the book', async () => {
    const { hooks, calls, shows, log } = fakeEngine()
    await visit('/', hooks)
    fireEvent.click(option('List'))
    expect(option('List')).toHaveAttribute('aria-pressed', 'true')
    expect(stage()).toHaveAttribute('inert')
    expect(page()).not.toHaveAttribute('inert')
    expect(log).toEqual({ hides: 1, destroyed: 0 })

    fireEvent.click(option('Tome'))
    await act(async () => {})
    expect(option('Tome')).toHaveAttribute('aria-pressed', 'true')
    expect(stage()).not.toHaveAttribute('inert')
    expect(calls).toHaveLength(1)
    expect(shows).toEqual([null])
  })

  it('keeps the book open at its page while the visitor reads a linked page', async () => {
    const { hooks, calls, shows, log } = fakeEngine()
    await visit('/', hooks)
    act(() => calls[0].onNavigate('/studies/map-labels'))
    expect(log.hides).toBe(1)

    fireEvent.click(wordmark())
    await act(async () => {})
    expect(calls).toHaveLength(1)
    expect(shows).toEqual(['studies'])
  })

  it('opens at the chapter the visitor last read as a page', async () => {
    const { hooks, calls, shows } = fakeEngine()
    await visit('/work/kbui', hooks)
    expect(calls).toHaveLength(0)

    fireEvent.click(wordmark())
    await act(async () => {})
    expect(calls).toHaveLength(1)
    expect(shows).toEqual(['kbui'])
  })

  it('lands the list on the chapter the book was open at', async () => {
    const scrolled: Element[] = []
    // jsdom has no scrolling.
    Element.prototype.scrollIntoView ??= () => {}
    const scroll = vi
      .spyOn(Element.prototype, 'scrollIntoView')
      .mockImplementation(function (this: Element) {
        scrolled.push(this)
      })
    const { hooks } = fakeEngine('mount', 'kbui')
    await visit('/', hooks)
    fireEvent.click(option('List'))
    await waitFor(() => expect(scrolled).toHaveLength(1))
    expect(scrolled[0]).toHaveAttribute('data-place', 'kbui')
    scroll.mockRestore()
  })

  it('lets go of the book when the site closes', async () => {
    const { hooks, log } = fakeEngine()
    const view = await visit('/', hooks)
    view.unmount()
    expect(log.destroyed).toBe(1)
  })

  it('tells the engine how much of the top the toggle needs', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    expect(calls[0].insetTop()).toBeGreaterThan(0)
  })

  it('keeps one toggle in one place across both views', async () => {
    const { hooks } = fakeEngine()
    await visit('/', hooks)
    const before = toggle()
    fireEvent.click(option('List'))
    expect(toggle()).toBe(before)
    expect(page()).not.toContainElement(toggle())
  })

  it('stays outside the inert page so it works while the book is open', async () => {
    const { hooks } = fakeEngine()
    await visit('/', hooks)
    expect(page()).not.toContainElement(toggle())
  })

  it('falls back to the list when the engine asks for it', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    act(() => calls[0].onList())
    expect(page()).not.toHaveAttribute('inert')
    expect(option('List')).toHaveAttribute('aria-pressed', 'true')
  })

  it('follows a link the engine opens', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    act(() => calls[0].onNavigate('/studies/map-labels'))
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How Apple Maps and Google Maps decide which labels you see',
      })
    ).toBeInTheDocument()
    expect(page()).not.toHaveAttribute('inert')
  })

  it('offers no toggle when WebGL is missing', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', { ...hooks, supportsWebGL: () => false })
    expect(calls).toHaveLength(0)
    expect(toggle()).toBeNull()
    expect(stage()).toBeNull()
  })

  it('keeps the list hidden from first paint until the book takes over', async () => {
    const root = document.documentElement
    root.dataset.tome = 'pending'
    // Each record's oldValue is the flag before that change; null means it was gone.
    const before: (string | null)[] = []
    const watch = new MutationObserver((records) => before.push(...records.map((r) => r.oldValue)))
    watch.observe(root, { attributeFilter: ['data-tome'], attributeOldValue: true })
    const { hooks } = fakeEngine()
    await visit('/', hooks)
    before.push(...watch.takeRecords().map((r) => r.oldValue))
    watch.disconnect()
    expect(before).not.toContain(null)
    expect(root.dataset.tome).toBe('open')
  })

  it('shows the list at once when WebGL is missing', async () => {
    document.documentElement.dataset.tome = 'pending'
    const { hooks } = fakeEngine()
    await visit('/', { ...hooks, supportsWebGL: () => false })
    expect(document.documentElement.dataset.tome).toBeUndefined()
  })

  it('takes over the boot mist at once, and fades in only when switched to', async () => {
    document.documentElement.dataset.tome = 'pending'
    const { hooks } = fakeEngine()
    let release = () => {}
    const slow: TomeHooks = {
      ...hooks,
      load: () => new Promise((done) => (release = () => done(hooks.load()))),
    }
    await visit('/', slow)
    expect(stage()).toHaveAttribute('data-boot')
    await act(async () => release())
    expect(stage()).not.toHaveAttribute('data-boot')
  })

  it('fades the book in when the visitor switches to it', async () => {
    const { hooks } = fakeEngine()
    await visit('/work', hooks)
    fireEvent.click(option('Tome'))
    await act(async () => {})
    expect(stage()).not.toHaveAttribute('data-boot')
  })

  it('says the book is opening until the engine is ready', async () => {
    const { hooks } = fakeEngine()
    let release = () => {}
    const slow: TomeHooks = {
      ...hooks,
      load: () => new Promise((done) => (release = () => done(hooks.load()))),
    }
    await visit('/', slow)
    expect(screen.getByRole('status')).toHaveTextContent('Opening the tome')
    await act(async () => release())
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('withdraws the toggle when the engine cannot start', async () => {
    const { hooks } = fakeEngine('fail')
    await visit('/', hooks)
    expect(page()).not.toHaveAttribute('inert')
    expect(toggle()).toBeNull()
  })

  it('remembers a visitor who chose the list', async () => {
    const first = fakeEngine()
    const view = await visit('/', first.hooks)
    fireEvent.click(option('List'))
    view.unmount()

    const second = fakeEngine()
    await visit('/', second.hooks)
    expect(second.calls).toHaveLength(0)
    expect(option('List')).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers the toggle on other pages without opening the book unasked', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/work', hooks)
    expect(calls).toHaveLength(0)
    expect(option('List')).toHaveAttribute('aria-pressed', 'true')
    expect(page()).not.toHaveAttribute('inert')
  })

  it('opens the book over another page at that page’s chapter, and steps back to it', async () => {
    const { hooks, calls, shows } = fakeEngine()
    await visit('/work/kbui', hooks)
    fireEvent.click(option('Tome'))
    await act(async () => {})
    expect(calls).toHaveLength(1)
    expect(shows).toEqual(['kbui'])
    expect(page()).toHaveAttribute('inert')

    fireEvent.click(option('List'))
    expect(page()).not.toHaveAttribute('inert')
    expect(screen.getByRole('heading', { level: 1, name: 'kbui' })).toBeInTheDocument()
  })

  it('leaves the book for the page of the chapter being read', async () => {
    const { hooks } = fakeEngine('mount', 'bezl')
    await visit('/work/kbui', hooks)
    fireEvent.click(option('Tome'))
    await act(async () => {})
    fireEvent.click(option('List'))
    expect(screen.getByRole('heading', { level: 1, name: 'Bezl' })).toBeInTheDocument()
  })
})
