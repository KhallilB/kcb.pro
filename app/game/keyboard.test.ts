import { describe, expect, it } from 'vitest'

import { nextWrappedFocusIndex, parseKeyboardIntent } from '@app/game/keyboard'

describe('parseKeyboardIntent', () => {
  it('maps movement keys in intro and hub contexts', () => {
    expect(parseKeyboardIntent('ArrowLeft', 'intro', null)).toBe('move_left')
    expect(parseKeyboardIntent('a', 'intro', null)).toBe('move_left')
    expect(parseKeyboardIntent('ArrowRight', 'hub', null)).toBe('move_right')
    expect(parseKeyboardIntent('D', 'hub', null)).toBe('move_right')
  })

  it('maps attack key in intro and hub contexts', () => {
    expect(parseKeyboardIntent('j', 'intro', null)).toBe('attack')
    expect(parseKeyboardIntent('J', 'hub', null)).toBe('attack')
  })

  it('keeps encounter arrows mapped to swipe intents', () => {
    expect(parseKeyboardIntent('ArrowLeft', 'encounter', null)).toBe('gesture_swipe_left')
    expect(parseKeyboardIntent('ArrowRight', 'encounter', null)).toBe('gesture_swipe_right')
  })

  it('maps encounter compatibility shortcuts', () => {
    expect(parseKeyboardIntent('A', 'encounter', null)).toBe('move_left')
    expect(parseKeyboardIntent('d', 'encounter', null)).toBe('move_right')
    expect(parseKeyboardIntent('J', 'encounter', null)).toBe('gesture_tap')
    expect(parseKeyboardIntent('Enter', 'encounter', null)).toBe('gesture_tap')
    expect(parseKeyboardIntent(' ', 'encounter', null)).toBe('gesture_tap')
    expect(parseKeyboardIntent('Shift', 'encounter', null)).toBe('gesture_hold')
    expect(parseKeyboardIntent('ArrowUp', 'encounter', null)).toBe('gesture_swipe_up')
  })

  it('ignores keyboard commands while typing', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')

    expect(parseKeyboardIntent('ArrowLeft', 'intro', input)).toBeNull()
    expect(parseKeyboardIntent('j', 'hub', textarea)).toBeNull()
    expect(parseKeyboardIntent('ArrowRight', 'encounter', editable)).toBeNull()
  })

  it('returns null for unsupported keys or contexts', () => {
    expect(parseKeyboardIntent('x', 'intro', null)).toBeNull()
    expect(parseKeyboardIntent('j', 'reveal', null)).toBeNull()
  })
})

describe('nextWrappedFocusIndex', () => {
  it('wraps left from the first fighter to the last', () => {
    expect(nextWrappedFocusIndex(0, 6, -1)).toBe(5)
  })

  it('wraps right from the last fighter to the first', () => {
    expect(nextWrappedFocusIndex(5, 6, 1)).toBe(0)
  })
})
