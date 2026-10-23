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
  headline: 'Frontend engineer who makes complicated products simple.',
  email: 'hi@kcb.pro',
  linkedin: 'https://www.linkedin.com/in/khallilbailey',
  github: 'https://github.com/KhallilB',
  resume: '/khallil-bailey-resume.pdf',
  // Newest first; the résumé holds the full version.
  experience: [
    {
      company: 'Databricks',
      title: 'Member of Technical Staff',
      years: '2026–now',
      summary:
        'User-facing frontend features, from product requirements through to release, working with design and backend engineers.',
    },
    {
      company: 'Panther',
      title: 'Senior Software Engineer',
      years: '2025–2026',
      summary:
        'Built Panther’s AI interface and the automated UI generation behind it, automated testing for AI agent workflows, and kept the design system.',
    },
    {
      company: 'Datable',
      title: 'Founding Senior Software Engineer',
      years: '2024–2025',
      summary:
        'Set up the frontend architecture from nothing and built the product in React, TypeScript and Tailwind, plus the GraphQL and Rails APIs behind it.',
    },
    {
      company: 'Presidio Identity',
      title: 'Founding Frontend Engineer',
      years: '2020–2023',
      summary:
        'First engineering hire. Built the web and mobile apps in React, React Native and Vue, the shared component library, and the CI and mock-API tooling.',
    },
  ],
}
