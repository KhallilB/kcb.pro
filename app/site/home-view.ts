import { useCallback, useState } from 'react'

export type HomeView = 'tome' | 'list'

const KEY = 'kcb:home-view'

// A visitor who picked the list keeps it for the session; storage may be blocked.
export function useHomeView(): [HomeView, (view: HomeView) => void] {
  // Safe to read at once: the overlay is client-only, so the view never changes prerendered markup.
  const [view, setState] = useState<HomeView>(() => {
    if (typeof window === 'undefined') return 'tome'
    try {
      return sessionStorage.getItem(KEY) === 'list' ? 'list' : 'tome'
    } catch {
      return 'tome'
    }
  })
  const setView = useCallback((next: HomeView) => {
    setState(next)
    try {
      sessionStorage.setItem(KEY, next)
    } catch {
      // Storage refused: the choice lasts for this page only.
    }
  }, [])
  return [view, setView]
}
