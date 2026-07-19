import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const brands = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros']

describe.each(brands)('%s reservation confirmation page', (brand) => {
  const pagePath = `${repoRoot}/packages/${brand}/app/pages/reservado/[reserveCode]/index.vue`
  const source = readFileSync(pagePath, 'utf8')

  it('awaits the shared existence guard without restoring the obsolete result-page sender', () => {
    const guardPosition = source.indexOf('await useReservationConfirmation()')
    const reserveCodePosition = source.indexOf('const reserveCode = validation.reserveCode')
    const statusPosition = source.indexOf("title: validation.status === 'found'")

    expect(guardPosition).toBeGreaterThan(-1)
    expect(reserveCodePosition).toBeGreaterThan(guardPosition)
    expect(statusPosition).toBeGreaterThan(reserveCodePosition)
    expect(source).not.toContain('route.params.reserveCode')
    expect(source).not.toContain('useResultPageView')
  })

  it('renders a neutral unavailable state instead of confirmation content', () => {
    expect(source).toContain("v-if=\"validation.status === 'unavailable'\"")
    expect(source).toContain('data-reservation-state="unavailable"')
    expect(source).toContain('Estamos verificando tu reserva')
    expect(source).toContain('Intenta en unos minutos.')
    expect(source).toContain('data-reservation-state="confirmed"')
    expect(source).toContain('if (validation.status !== \'found\') return')
  })

  it('keeps the unavailable and confirmation states noindexed', () => {
    expect(source).toContain("content: 'noindex, nofollow'")
  })
})
