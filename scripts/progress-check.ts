// Run in a project repository: bun progress-check.ts --slug <slug> [--base <git ref>]. Exits 1 on any problem.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { validateProgress } from '../app/portfolio/domain/progress'
import {
  appendOnlyErrors,
  missingEvidence,
} from '../app/portfolio/domain/progress-change'
import { buildDay } from './build-day'

const git = (...args: string[]) => spawnSync('git', args, { encoding: 'utf8' })

// No file at the base means nothing was published yet.
function published(base: string | undefined): unknown {
  if (!base) return undefined
  const shown = git('show', `${base}:progress.json`)
  return shown.status === 0 ? JSON.parse(shown.stdout) : undefined
}

function main() {
  const { values } = parseArgs({
    options: { slug: { type: 'string' }, base: { type: 'string' } },
  })
  const slug = values.slug
  if (!slug) {
    console.error('Pass --slug, the project slug kcb.pro lists.')
    process.exit(2)
  }
  let file: unknown
  try {
    file = JSON.parse(readFileSync('progress.json', 'utf8'))
  } catch (error) {
    console.error(`progress.json cannot be read: ${(error as Error).message}`)
    process.exit(1)
  }
  const before = published(values.base)
  const errors = [
    ...validateProgress(file, { slug, buildDay: buildDay() }),
    ...appendOnlyErrors(before, file, slug),
    ...missingEvidence(
      before,
      file,
      (commit, path) => git('cat-file', '-e', `${commit}:${path}`).status === 0,
      slug
    ),
  ]
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    process.exit(1)
  }
  console.log(`"${slug}" progress.json is valid`)
}

main()
