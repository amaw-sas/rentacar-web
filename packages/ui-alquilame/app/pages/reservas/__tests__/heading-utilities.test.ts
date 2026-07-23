import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const results = read('app/components/reservas/Results.vue')
const confirmation = read('app/pages/reservado/[reserveCode]/index.vue')

describe('reservas flow — token-free hero typography', () => {
  it('keeps the Results headline on the written responsive ramp', () => {
    expect(results).toMatch(
      /<h1 class="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-white leading-\[1\.1\]">/,
    )
    expect(results).not.toMatch(/<h1[^>]*\bheading-hero\b/)
  })

  it('keeps the reservation code at text-4xl with the hero weight and tracking', () => {
    expect(confirmation).toMatch(
      /<h2 class="font-heading font-extrabold tracking-tight text-4xl mb-2">\{\{ reserveCode \}\}<\/h2>/,
    )
    expect(confirmation).not.toMatch(
      /<h2[^>]*\bheading-hero\b[^>]*>\{\{ reserveCode \}\}<\/h2>/,
    )
  })
})
