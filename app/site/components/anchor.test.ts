import { idFromHash } from './anchor'

describe('idFromHash', () => {
  it.each([
    ['#2026-10-20-pty-throughput', '2026-10-20-pty-throughput'],
    ['#record', 'record'],
    ['#caf%C3%A9', 'café'],
    ['', ''],
    ['#', ''],
    ['#%E0%A4%A', ''],
  ])('reads %j as %j', (hash, id) => {
    expect(idFromHash(hash)).toBe(id)
  })
})
