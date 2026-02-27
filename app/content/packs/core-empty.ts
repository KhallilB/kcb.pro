import type { ContentPackV1 } from '@app/content/types'

const pack: ContentPackV1 = {
  schemaVersion: '1',
  id: 'core-empty',
  name: 'Core Empty Pack',
  encounters: [
    {
      id: 'encounter-goblin',
      characterId: 'goblin',
      title: 'Goblin Trial',
      actions: ['tap', 'swipe_right', 'hold'],
      revealId: 'reveal-goblin',
    },
    {
      id: 'encounter-joanna',
      characterId: 'joanna_darc',
      title: 'Joanna Trial',
      actions: ['swipe_up', 'tap', 'hold'],
      revealId: 'reveal-joanna',
    },
    {
      id: 'encounter-harpy',
      characterId: 'night_harpy',
      title: 'Harpy Trial',
      actions: ['tap', 'tap', 'swipe_left'],
      revealId: 'reveal-harpy',
    },
    {
      id: 'encounter-lord',
      characterId: 'night_lord',
      title: 'Night Lord Trial',
      actions: ['hold', 'swipe_right', 'tap'],
      revealId: 'reveal-lord',
    },
    {
      id: 'encounter-phantom',
      characterId: 'phantom',
      title: 'Phantom Trial',
      actions: ['swipe_left', 'tap', 'hold'],
      revealId: 'reveal-phantom',
    },
    {
      id: 'encounter-skeleton',
      characterId: 'skeleton_kinight',
      title: 'Skeleton Trial',
      actions: ['tap', 'hold', 'swipe_up'],
      revealId: 'reveal-skeleton',
    },
  ],
  reveals: [
    {
      id: 'reveal-goblin',
      title: 'Slot Ready: Goblin',
      body: 'Attach a future project here. This reveal card is a ready placeholder for your first build story.',
    },
    {
      id: 'reveal-joanna',
      title: 'Slot Ready: Joanna',
      body: 'Use this slot for a process-heavy case study focused on product and execution decisions.',
    },
    {
      id: 'reveal-harpy',
      title: 'Slot Ready: Harpy',
      body: 'Use this slot to showcase interaction design systems and motion-first UX decisions.',
    },
    {
      id: 'reveal-lord',
      title: 'Slot Ready: Night Lord',
      body: 'Use this slot for architecture, systems scaling, and technical complexity narratives.',
    },
    {
      id: 'reveal-phantom',
      title: 'Slot Ready: Phantom',
      body: 'Use this slot for performance, optimization, and hard engineering constraints.',
    },
    {
      id: 'reveal-skeleton',
      title: 'Slot Ready: Skeleton',
      body: 'Use this slot for reliability, QA discipline, and maintainability wins.',
    },
  ],
}

export default pack
