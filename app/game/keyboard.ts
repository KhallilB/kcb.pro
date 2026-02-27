import type { KeyboardContext, KeyboardIntent } from '@app/game/types'

export function shouldIgnoreKeyboardTarget(targetElement: EventTarget | null): boolean {
  if (!(targetElement instanceof HTMLElement)) {
    return false
  }

  const tagName = targetElement.tagName.toLowerCase()

  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  if (targetElement.isContentEditable) {
    return true
  }

  return targetElement.closest('[contenteditable="true"]') !== null
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key
}

export function parseKeyboardIntent(
  key: string,
  context: KeyboardContext,
  targetElement: EventTarget | null
): KeyboardIntent | null {
  if (shouldIgnoreKeyboardTarget(targetElement)) {
    return null
  }

  const normalizedKey = normalizeKey(key)

  if (context === 'intro' || context === 'hub') {
    if (normalizedKey === 'ArrowLeft' || normalizedKey === 'a') {
      return 'move_left'
    }

    if (normalizedKey === 'ArrowRight' || normalizedKey === 'd') {
      return 'move_right'
    }

    if (normalizedKey === 'j') {
      return 'attack'
    }

    return null
  }

  if (context === 'encounter') {
    if (normalizedKey === 'ArrowLeft') {
      return 'gesture_swipe_left'
    }

    if (normalizedKey === 'ArrowRight') {
      return 'gesture_swipe_right'
    }

    if (normalizedKey === 'a') {
      return 'move_left'
    }

    if (normalizedKey === 'd') {
      return 'move_right'
    }

    if (normalizedKey === 'j' || normalizedKey === ' ' || normalizedKey === 'Enter') {
      return 'gesture_tap'
    }

    if (normalizedKey === 'Shift') {
      return 'gesture_hold'
    }

    if (normalizedKey === 'ArrowUp') {
      return 'gesture_swipe_up'
    }

    return null
  }

  return null
}

export function nextWrappedFocusIndex(
  currentIndex: number,
  totalCount: number,
  delta: -1 | 1
): number {
  if (totalCount <= 0) {
    return 0
  }

  return (currentIndex + delta + totalCount) % totalCount
}
