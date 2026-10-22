import { published } from '../domain/catalog'
import type { Catalog } from '../domain/types'
import { projects } from './projects'
import { studies } from './studies'

// Every entry, hidden ones included; the build validates this.
export const catalog: Catalog = { projects, studies }

// What the site and the book show.
export const content: Catalog = published(catalog)

export const profile = {
  name: 'Khallil Bailey',
  role: 'Frontend engineer',
  headline: 'Frontend engineer building web apps that do real work.',
  github: 'https://github.com/KhallilB',
}
