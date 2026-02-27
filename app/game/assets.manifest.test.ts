import { describe, expect, it } from 'vitest'

import {
  createStableClipIds,
  getResolvedClipForState,
  normalizeClipToken,
} from '@app/game/assets'

describe('asset manifest utilities', () => {
  it('normalizes clip tokens while keeping underscores stable', () => {
    expect(normalizeClipToken('Sprites/JumpAndFall/Jumping_')).toBe(
      'sprites-jumpandfall-jumping_'
    )
  })

  it('adds deterministic suffixes for colliding normalized tokens', () => {
    const ids = createStableClipIds([
      'Sprites/Jumping',
      'Sprites/Jumping!',
      'Sprites/Jumping??',
    ])

    expect(ids.get('Sprites/Jumping')).toBe('sprites-jumping--1')
    expect(ids.get('Sprites/Jumping!')).toBe('sprites-jumping--2')
    expect(ids.get('Sprites/Jumping??')).toBe('sprites-jumping--3')
  })

  it('resolves goblin idle to the canonical Idle clip instead of attack subclips', () => {
    const resolved = getResolvedClipForState('goblin', 'idle')

    expect(resolved).not.toBeNull()
    expect(resolved?.rawPath.toLowerCase()).toBe('idle')
  })
})
