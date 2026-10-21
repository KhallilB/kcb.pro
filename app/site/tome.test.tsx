import { act, fireEvent, render, screen } from '@testing-library/react'
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

beforeEach(() => sessionStorage.clear())

describe('the tome on the home page', () => {
  it('opens over the page and keeps the page behind it inert', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument()
    expect(page()).toHaveAttribute('inert')
    expect(calls).toHaveLength(1)
  })

  it('hands the engine the portfolio’s own chapters', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    expect(calls[0].data.chapters.mugenArena.title).toBe('Mugen Arena')
    expect(calls[0].data.asOf).toBe('21 October 2026')
  })

  it('steps aside for the plain list, and comes back on request', async () => {
    const { hooks, destroyed } = fakeEngine()
    await visit('/', hooks)
    fireEvent.click(screen.getByRole('button', { name: 'List view' }))
    expect(screen.queryByRole('button', { name: 'List view' })).not.toBeInTheDocument()
    expect(page()).not.toHaveAttribute('inert')
    expect(destroyed).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Open the tome' }))
    await act(async () => {})
    expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument()
  })

  it('falls back to the list when the engine asks for it', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', hooks)
    act(() => calls[0].onList())
    expect(page()).not.toHaveAttribute('inert')
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

  it('shows the list when WebGL is missing', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/', { ...hooks, supportsWebGL: () => false })
    expect(calls).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'List view' })).not.toBeInTheDocument()
  })

  it('shows the list when the engine cannot start', async () => {
    const { hooks } = fakeEngine('fail')
    await visit('/', hooks)
    expect(page()).not.toHaveAttribute('inert')
  })

  it('remembers a visitor who chose the list', async () => {
    const first = fakeEngine()
    const view = await visit('/', first.hooks)
    fireEvent.click(screen.getByRole('button', { name: 'List view' }))
    view.unmount()

    const second = fakeEngine()
    await visit('/', second.hooks)
    expect(second.calls).toHaveLength(0)
  })

  it('never opens on other pages', async () => {
    const { hooks, calls } = fakeEngine()
    await visit('/work', hooks)
    expect(calls).toHaveLength(0)
    expect(page()).not.toHaveAttribute('inert')
  })
})
