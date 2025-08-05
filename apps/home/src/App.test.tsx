import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import App from './App'

describe('Home App', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the home app title', () => {
    render(<App />)
    expect(screen.getByText('Home App v1')).toBeInTheDocument()
  })

  it('renders a div container', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { name: 'Home App v1' })
    const container = heading.parentElement
    expect(container).toBeInTheDocument()
    expect(container?.tagName).toBe('DIV')
  })
})
