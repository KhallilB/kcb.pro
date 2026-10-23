import { isIsoDay } from '../app/portfolio/domain/dates'

type Env = Record<string, string | undefined>

// One build day for the progress fetch and every page; BUILD_DAY=YYYY-MM-DD pins it.
export function buildDay(env: Env = process.env, now = new Date()): string {
  const day = env.BUILD_DAY ?? now.toISOString().slice(0, 10)
  if (!isIsoDay(day)) {
    throw new Error(`BUILD_DAY must be YYYY-MM-DD, got "${day}"`)
  }
  return day
}

// Child steps inherit the pinned day, so a build that crosses midnight UTC keeps one day.
export function pinBuildDay(env: Env = process.env, now = new Date()): string {
  env.BUILD_DAY = buildDay(env, now)
  return env.BUILD_DAY
}
