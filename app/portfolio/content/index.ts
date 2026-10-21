import type { Catalog } from '../domain/types'
import { projects } from './projects'
import { studies } from './studies'

export const content: Catalog = { projects, studies }

export const profile = {
  name: 'Khallil Bailey',
  role: 'Frontend engineer',
  headline: 'Frontend engineer building deep, useful web apps.',
  github: 'https://github.com/KhallilB',
}
