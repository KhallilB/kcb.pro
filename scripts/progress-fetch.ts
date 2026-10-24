// Writes each registered project's public progress to build-data/progress/<slug>.json; any failure stops the build.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { content } from '../app/portfolio/content'
import { registered } from '../app/portfolio/domain/catalog'
import { toPublic, type PublicProgress } from '../app/portfolio/domain/progress'
import type { IsoDay } from '../app/portfolio/domain/types'
import { chooseToken, collectProgress } from '../app/portfolio/progress/fetch'
import { loadProgress } from '../app/portfolio/progress/load'
import { buildDay } from './build-day'

const OUT = join('build-data', 'progress')
const FIXTURES = join('app', 'portfolio', 'progress', 'fixtures')

async function readFixture(slug: string): Promise<unknown> {
  const file = Bun.file(join(FIXTURES, `${slug}.json`))
  return (await file.exists()) ? file.json() : undefined
}

// Reads the file back through the site's loader, so a bad file stops the build before vite.
export async function writePublic(
  file: string,
  data: PublicProgress,
  day: IsoDay
): Promise<void> {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`)
  loadProgress({ [file]: JSON.parse(await readFile(file, 'utf8')) }, day)
}

async function main() {
  const offline = process.env.PROGRESS_OFFLINE === '1'
  await rm(OUT, { recursive: true, force: true })
  try {
    const day = buildDay()
    const progress = await collectProgress(registered(content.projects), {
      buildDay: day,
      offline,
      fetch,
      token: chooseToken(process.env),
      readFixture,
    })
    await mkdir(OUT, { recursive: true })
    for (const [slug, data] of Object.entries(progress)) {
      await writePublic(join(OUT, `${slug}.json`), toPublic(data, day), day)
    }
    const slugs = Object.keys(progress).join(', ') || 'no projects'
    console.log(
      `Progress from ${offline ? 'fixtures' : 'GitHub'} for ${slugs} as of ${day}`
    )
  } catch (error) {
    // A partial write must not survive into the build.
    await rm(OUT, { recursive: true, force: true })
    console.error(
      `Progress failed; nothing was written:\n${(error as Error).message}`
    )
    process.exit(1)
  }
}

// Imported by its test; runs only as the build step.
if (import.meta.main) await main()
