import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

// alquilatucarro y alquilame renderizan los estados inline en la página.
// alquicarros (issue #368 hallazgo 1) enriqueció la confirmación —recap efímero,
// checklist, contactos reales, copiar código, reintento— y extrajo el markup a un
// componente brand-local `ReservationConfirmation.vue`. La página quedó como
// envoltura fina que conserva el guard SEO, el noindex y el gate del confetti.
// El invariante que este test protege (estado "verificando" neutral separado del
// contenido de confirmación, gateado por el status, y página noindex) se mantiene:
// solo cambia DÓNDE vive el markup en alquicarros.
const brands = [
  { name: 'ui-alquilatucarro', markupIn: 'page' },
  { name: 'ui-alquilame', markupIn: 'page' },
  { name: 'ui-alquicarros', markupIn: 'component' },
] as const

describe.each(brands)('$name reservation confirmation page', ({ name, markupIn }) => {
  const pagePath = `${repoRoot}/packages/${name}/app/pages/reservado/[reserveCode]/index.vue`
  const pageSource = readFileSync(pagePath, 'utf8')
  // El markup de los estados vive inline en la página, o en el componente
  // brand-local cuando la marca lo extrajo.
  const markupPath = markupIn === 'component'
    ? `${repoRoot}/packages/${name}/app/components/ReservationConfirmation.vue`
    : pagePath
  const markupSource = readFileSync(markupPath, 'utf8')

  it('awaits the shared existence guard without restoring the obsolete result-page sender', () => {
    const guardPosition = pageSource.indexOf('await useReservationConfirmation()')
    const reserveCodePosition = pageSource.indexOf('const reserveCode = validation.reserveCode')
    const statusPosition = pageSource.indexOf("title: validation.status === 'found'")

    expect(guardPosition).toBeGreaterThan(-1)
    expect(reserveCodePosition).toBeGreaterThan(guardPosition)
    expect(statusPosition).toBeGreaterThan(reserveCodePosition)
    expect(pageSource).not.toContain('route.params.reserveCode')
    expect(pageSource).not.toContain('useResultPageView')
  })

  it('renders a neutral unavailable state instead of confirmation content', () => {
    // El estado se gatea por el status —`validation.status` inline en la página,
    // o el prop `status` en el componente— pero en ambos casos hay una rama
    // "unavailable" neutral separada de la rama "confirmed".
    const unavailableGate = markupIn === 'component'
      ? 'v-if="status === \'unavailable\'"'
      : 'v-if="validation.status === \'unavailable\'"'
    expect(markupSource).toContain(unavailableGate)
    expect(markupSource).toContain('data-reservation-state="unavailable"')
    expect(markupSource).toContain('Estamos verificando tu reserva')
    expect(markupSource).toContain('data-reservation-state="confirmed"')
    // Copy neutral exacta solo donde el estado sigue siendo el mínimo inline;
    // alquicarros lo mejoró con reintento + contacto (SCEN-368A-08).
    if (markupIn === 'page') {
      expect(markupSource).toContain('Intenta en unos minutos.')
    }
    // La página siempre gatea el confetti tras el guard, viva donde viva el markup.
    expect(pageSource).toContain('if (validation.status !== \'found\') return')
  })

  it('keeps the unavailable and confirmation states noindexed', () => {
    expect(pageSource).toContain("content: 'noindex, nofollow'")
  })
})
