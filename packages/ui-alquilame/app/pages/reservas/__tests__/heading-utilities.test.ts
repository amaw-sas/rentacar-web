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

  it('keeps the reservation code on the hero weight and tracking, token-free', () => {
    // Rediseño tiquete 2026-07-28: el código dejó de ser <h2> (no es un
    // encabezado de sección) y ganó rampa responsive, pero el invariante
    // protegido es el mismo: utilidades explícitas, nunca el token heading-*.
    expect(confirmation).toMatch(
      /<p class="font-heading font-extrabold tracking-tight text-3xl sm:text-4xl text-gray-900">\{\{ reserveCode \}\}<\/p>/,
    )
    expect(confirmation).not.toMatch(
      /<[^>]*\bheading-hero\b[^>]*>\{\{ reserveCode \}\}/,
    )
  })
})
