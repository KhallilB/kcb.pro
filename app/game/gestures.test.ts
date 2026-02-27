import { describe, expect, it } from 'vitest'

import { GestureTracker, detectGesture } from '@app/game/gestures'

describe('detectGesture', () => {
  it('detects tap', () => {
    expect(detectGesture({ x: 0, y: 0 }, { x: 8, y: 4 }, 120)).toBe('tap')
  })

  it('detects hold', () => {
    expect(detectGesture({ x: 0, y: 0 }, { x: 6, y: 2 }, 620)).toBe('hold')
  })

  it('detects horizontal swipe', () => {
    expect(detectGesture({ x: 0, y: 0 }, { x: 160, y: 4 }, 110)).toBe('swipe_right')
  })
})

describe('GestureTracker', () => {
  it('reports accepted gestures', () => {
    const tracker = new GestureTracker()
    tracker.begin({ x: 0, y: 0 }, 0)
    tracker.move({ x: 120, y: 0 })

    const result = tracker.end({ x: 120, y: 0 }, 120, 'swipe_right')

    expect(result.status).toBe('accepted')
    expect(result.action).toBe('swipe_right')
  })

  it('reports mismatches with expected actions', () => {
    const tracker = new GestureTracker()
    tracker.begin({ x: 0, y: 0 }, 0)
    tracker.move({ x: 120, y: 0 })

    const result = tracker.end({ x: 120, y: 0 }, 100, 'swipe_left')

    expect(result.status).toBe('mismatch')
    expect(result.action).toBe('swipe_right')
    expect(result.expectedAction).toBe('swipe_left')
  })

  it('reports likely scroll conflicts', () => {
    const tracker = new GestureTracker()
    tracker.begin({ x: 0, y: 0 }, 0)
    tracker.move({ x: 5, y: 100 })

    const result = tracker.end({ x: 5, y: 100 }, 90)

    expect(result.status).toBe('scroll_conflict')
    expect(result.action).toBeNull()
  })
})
