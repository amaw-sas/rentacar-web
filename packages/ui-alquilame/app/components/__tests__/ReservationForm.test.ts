import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ReservationForm.vue', import.meta.url)),
  'utf8',
)

describe('ReservationForm — label contrast on white form background', () => {
  const uFormOpenTag = source.match(/<u-form\b[\s\S]*?>/)

  it('does not apply scheme-dark to the <u-form>', () => {
    expect(uFormOpenTag).not.toBeNull()
    expect(uFormOpenTag![0]).not.toMatch(/\bscheme-dark\b/)
  })

  it('applies class="light" to the <u-form> so Nuxt UI tokens resolve to neutral-700 even when the page uses colorMode dark', () => {
    expect(uFormOpenTag).not.toBeNull()
    expect(uFormOpenTag![0]).toMatch(/class="[^"]*\blight\b[^"]*"/)
  })
})

describe('ReservationForm — Tus datos heading', () => {
  it('uses Plus Jakarta while allowing the explicit red utility to win', () => {
    expect(source).toMatch(
      /<h3 class="font-heading text-red-700">Tus datos<\/h3>/,
    )
    expect(source).not.toMatch(/<h3[^>]*\bheading-card\b[^>]*>Tus datos<\/h3>/)
  })
})
