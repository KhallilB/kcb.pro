import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { TomeData } from '@app/tome/copy'
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

function fakeEngine(result: 'mount' | 'fail' = 'mount') {
  const calls: Mounted[] = []
  const destroyed: number[] = []
  const hooks: TomeHooks = {
    supportsWebGL: () => true,
    load: async () => ({
      mountTome: (host, opts) => {
        calls.push({ host, ...opts })
        return result === 'fail' ? null : () => destroyed.push(calls.length)
      },
    }),
  }
  return { hooks, calls, destroyed }
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
const NAMES = { Tome: '3D book', List: '2D list' }
const option = (name: 'Tome' | 'List') =>
  within(screen.getByRole('group', { name: 'View' })).getByRole('button', { name: NAMES[name] })

beforeEach(() => sessionStorage.clear())

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
    expect(calls[0].data.chapters.mugenArena.title).toBe('Mugen Arena')
    expect(calls[0].data.asOf).toBe('21 October 2026')
  })

  it('toggles to the plain list and back with one control', async () => {
    const { hooks, calls, destroyed } = fakeEngine()
    await visit('/', hooks)
    fireEvent.click(option('List'))
    expect(option('List')).toHaveAttribute('aria-pressed', 'true')
    expect(stage()).toBeNull()
    expect(page()).not.toHaveAttribute('inert')
    expect(destroyed).toHaveLength(1)

    fireEvent.click(option('Tome'))
    await act(async () => {})
    expect(option('Tome')).toHaveAttribute('aria-pressed', 'true')
    expect(calls).toHaveLength(2)
  })

  it('tells the engine how much of the top the toggle needs', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    expect(calls[0].insetTop()).toBeGreaterThan(0)
  })

  it('moves into the header in 2D instead of floating', async () => {
    const { hooks } = fakeEngine()
    await visit('/', hooks)
    fireEvent.click(option('List'))
    expect(within(screen.getByRole('banner')).getByRole('group', { name: 'View' })).toBeInTheDocument()
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

  it('never opens on other pages', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/work', hooks)
    expect(calls).toHaveLength(0)
    expect(toggle()).toBeNull()
    expect(page()).not.toHaveAttribute('inert')
  })
})
