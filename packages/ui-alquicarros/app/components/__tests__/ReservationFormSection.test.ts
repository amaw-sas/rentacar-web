import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ReservationFormSection.vue', import.meta.url)),
  'utf8',
)

const submitButtonBlock = (() => {
  const start = source.indexOf('>Solicitar reserva')
  const before = source.lastIndexOf('<u-button', start)
  const after = source.indexOf('</u-button>', start) + '</u-button>'.length
  return source.slice(before, after)
})()

describe('ReservationFormSection — Solicitar reserva button loading state', () => {
  beforeAll(() => {
    expect(submitButtonBlock).toContain('Solicitar reserva')
  })

  it('hides the trailing chevron during loading so the label has room on a single line', () => {
    expect(submitButtonBlock).toMatch(/<ChevronRightIcon[^>]*v-if="!isSubmittingForm"[^>]*\/>/)
    expect(submitButtonBlock).toMatch(/cls="size-5"/)
    expect(submitButtonBlock).not.toMatch(/animate-spin/)
  })
})
