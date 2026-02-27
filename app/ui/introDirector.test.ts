import { describe, expect, it } from 'vitest'

import { INTRO_STAGES, getIntroPlayback } from '@app/ui/introDirector'

describe('introDirector', () => {
  it('defines ordered intro stages', () => {
    expect(INTRO_STAGES.map((stage) => stage.id)).toEqual([
      'signal_link',
      'combat_brief',
      'entry_protocol',
    ])
  })

  it('returns faster playback in reduced motion mode', () => {
    const standard = getIntroPlayback(false)
    const reduced = getIntroPlayback(true)

    expect(reduced.stageDurationMs).toBeLessThan(standard.stageDurationMs)
    expect(reduced.transitionMs).toBeLessThan(standard.transitionMs)
  })
})
