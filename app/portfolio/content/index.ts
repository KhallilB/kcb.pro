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
  // Newest first: what the company does, then my part. The résumé has the rest.
  experience: [
    {
      company: 'Databricks',
      title: 'Member of Technical Staff',
      years: '2026–now',
      about: 'A platform where companies keep their data and build AI on it.',
      summary:
        'I build user-facing features, from the product spec through to release.',
    },
    {
      company: 'Panther',
      title: 'Senior Software Engineer',
      years: '2025–2026',
      about:
        'A security platform that helps teams spot and stop attacks across their cloud and apps.',
      summary:
        'I built the interface for Panther’s AI features and automated the testing of its AI agents.',
    },
    {
      company: 'Datable',
      title: 'Founding Senior Software Engineer',
      years: '2024–2025',
      about:
        'A startup that lets companies clean up their monitoring data before paying to store it.',
      summary:
        'As a founding engineer, I built the frontend from scratch and some of the APIs behind it.',
    },
    {
      company: 'Presidio Identity',
      title: 'Founding Frontend Engineer',
      years: '2020–2023',
      about:
        'A startup that helped banks check who their customers are and stop fraud.',
      summary:
        'As the first engineering hire, I built the web and mobile apps and the tools we shipped them with.',
    },
  ],
}
