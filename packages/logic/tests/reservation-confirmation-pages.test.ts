import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const brands = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros']

describe.each(brands)('%s reservation confirmation page', (brand) => {
  const pagePath = `${repoRoot}/packages/${brand}/app/pages/reservado/[reserveCode]/index.vue`
  const source = readFileSync(pagePath, 'utf8')

  it('awaits the shared existence guard before recording a confirmed page view', () => {
    const guardPosition = source.indexOf('await useReservationConfirmation()')
    const analyticsPosition = source.indexOf("useResultPageView('Reserva Confirmada')")

    expect(guardPosition).toBeGreaterThan(-1)
    expect(analyticsPosition).toBeGreaterThan(guardPosition)
    expect(source).not.toContain('route.params.reserveCode')
  })

  it('keeps the existing noindex directive', () => {
    expect(source).toContain("content: 'noindex, nofollow'")
  })
})
