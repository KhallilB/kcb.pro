// ISO calendar day, YYYY-MM-DD.
export type IsoDay = string

export type ProjectStatus = 'planned' | 'in-progress' | 'shipped'

// The site is a project too, but it is never what "now building" names.
export type ProjectKind = 'endeavor' | 'site'

export interface Link {
  label: string
  href: string
}

// Width and height reserve the space before it loads, so the page never jumps.
export interface Media {
  kind: 'image' | 'video'
  src: string
  alt: string
  width: number
  height: number
  // Shown under the shot; says what it is and when, since alt is for screen readers.
  caption?: string
}

export interface BriefSection {
  heading: string
  body: string[]
}

export interface Dated {
  status: ProjectStatus
  startsOn: IsoDay
  shippedOn?: IsoDay
}

export interface Project extends Dated {
  slug: string
  kind: ProjectKind
  title: string
  summary: string
  // What it is, in a short paragraph; the only picture when media is absent.
  about: string
  // Shots of the real thing, in reading order; the first one is the book's plate.
  media?: Media[]
  // Season sequence; lower ships first.
  order: number
  role: string
  stack: string[]
  domain: string
  signature: string
  links: Link[]
  brief: BriefSection[]
  // false keeps the entry valid but off the site; omitted means listed.
  listed?: boolean
  // Public GitHub repository as owner/name; registers the project's progress ledger.
  repo?: string
  // Where the project is heading, in one sentence; required with repo.
  goal?: string
  // Place in Selected work; set by hand, never derived.
  rank?: 1 | 2 | 3
}

export type StudyFormat = 'teardown' | 'legacy'

export interface Study extends Dated {
  slug: string
  title: string
  format: StudyFormat
  question: string
  // What it is, in a short paragraph.
  about: string
  builtSlice: string
  kitPiece: string
  // Project slugs this study hands a kit piece to.
  feeds: string[]
  brief: BriefSection[]
}

export interface Catalog {
  projects: Project[]
  studies: Study[]
}
