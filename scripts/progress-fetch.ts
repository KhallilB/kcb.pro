// Writes build-data/progress/<slug>.json for each registered project; any failure stops the build.
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { content } from '../app/portfolio/content'
import { registered } from '../app/portfolio/domain/catalog'
import { collectProgress } from '../app/portfolio/progress/fetch'
import { buildDay } from './build-day'

const OUT = join('build-data', 'progress')
const FIXTURES = join('app', 'portfolio', 'progress', 'fixtures')
const offline = process.env.PROGRESS_OFFLINE === '1'

async function readFixture(slug: string): Promise<unknown> {
  const file = Bun.file(join(FIXTURES, `${slug}.json`))
  return (await file.exists()) ? file.json() : undefined
}

await rm(OUT, { recursive: true, force: true })
try {
  const day = buildDay()
  const progress = await collectProgress(registered(content.projects), {
    buildDay: day,
    offline,
    fetch,
    token: process.env.GITHUB_TOKEN,
    readFixture,
  })
  await mkdir(OUT, { recursive: true })
  for (const [slug, data] of Object.entries(progress)) {
    await writeFile(
      join(OUT, `${slug}.json`),
      `${JSON.stringify(data, null, 2)}\n`
    )
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
