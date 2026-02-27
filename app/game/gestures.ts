import type { GestureAction } from '@app/content/types'

export interface Point {
  x: number
  y: number
}

export interface GestureConfig {
  holdThresholdMs: number
  swipeThresholdPx: number
}

export interface GestureMeta {
  durationMs: number
  deltaX: number
  deltaY: number
  distancePx: number
}

export type GestureStatus = 'accepted' | 'cancelled' | 'mismatch' | 'scroll_conflict'

export interface GestureResult {
  status: GestureStatus
  action: GestureAction | null
  expectedAction: GestureAction | null
  meta: GestureMeta
}

const DEFAULT_CONFIG: GestureConfig = {
  holdThresholdMs: 450,
  swipeThresholdPx: 80,
}

interface GestureStart {
  point: Point
  startedAt: number
}

function absMax(a: number, b: number): number {
  return Math.abs(a) > Math.abs(b) ? a : b
}

function toGestureMeta(start: Point, end: Point, durationMs: number): GestureMeta {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y

  return {
    durationMs,
    deltaX,
    deltaY,
    distancePx: Math.hypot(deltaX, deltaY),
  }
}

function zeroMeta(): GestureMeta {
  return {
    durationMs: 0,
    deltaX: 0,
    deltaY: 0,
    distancePx: 0,
  }
}

export function detectGesture(
  start: Point,
  end: Point,
  durationMs: number,
  config: GestureConfig = DEFAULT_CONFIG
): GestureAction {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dominantAxisDistance = absMax(dx, dy)

  if (Math.abs(dominantAxisDistance) >= config.swipeThresholdPx) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'swipe_right' : 'swipe_left'
    }

    return 'swipe_up'
  }

  if (durationMs >= config.holdThresholdMs) {
    return 'hold'
  }

  return 'tap'
}

export class GestureTracker {
  private start: GestureStart | null = null
  private latestPoint: Point | null = null
  private readonly config: GestureConfig

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    }
  }

  begin(point: Point, ts: number): void {
    this.start = { point, startedAt: ts }
    this.latestPoint = point
  }

  move(point: Point): void {
    this.latestPoint = point
  }

  end(point: Point, ts: number, expectedAction: GestureAction | null = null): GestureResult {
    if (!this.start) {
      return {
        status: 'cancelled',
        action: null,
        expectedAction,
        meta: zeroMeta(),
      }
    }

    const finalPoint = this.latestPoint ?? point
    const durationMs = ts - this.start.startedAt
    const action = detectGesture(this.start.point, finalPoint, durationMs, this.config)
    const meta = toGestureMeta(this.start.point, finalPoint, durationMs)

    this.start = null
    this.latestPoint = null

    if (meta.deltaY > 0 && Math.abs(meta.deltaY) > Math.abs(meta.deltaX)) {
      return {
        status: 'scroll_conflict',
        action: null,
        expectedAction,
        meta,
      }
    }

    if (expectedAction && action !== expectedAction) {
      return {
        status: 'mismatch',
        action,
        expectedAction,
        meta,
      }
    }

    return {
      status: 'accepted',
      action,
      expectedAction,
      meta,
    }
  }

  cancel(): GestureResult {
    this.start = null
    this.latestPoint = null

    return {
      status: 'cancelled',
      action: null,
      expectedAction: null,
      meta: zeroMeta(),
    }
  }
}

export function keyToGesture(key: string): GestureAction | null {
  switch (key) {
    case ' ':
    case 'Enter':
      return 'tap'
    case 'Shift':
      return 'hold'
    case 'ArrowLeft':
      return 'swipe_left'
    case 'ArrowRight':
      return 'swipe_right'
    case 'ArrowUp':
      return 'swipe_up'
    default:
      return null
  }
}
