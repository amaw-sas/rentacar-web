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

// Issue #472 — el Atrás desde la página de gracias dejaba el formulario con los
// datos del cliente anterior y el CTA girando en "Confirmando…".
// Holdout: docs/specs/reset-post-reserva/scenarios/reset-post-reserva.scenarios.md
//
// El arreglo vive en el store compartido, pero solo sirve si CADA página terminal
// lo llama. Este contrato de fuente es el guard contra que una marca nueva —o una
// reescritura de estas páginas— se lo deje. La conducta la cubren los tests de
// `useStoreReservationForm.resetAfterReservation.test.ts`; aquí solo se comprueba
// el cableado, que es lo que se olvida.
const reserveDestination = {
  // alquilatucarro no tiene /reservas: su buscador vive en la home.
  'ui-alquilatucarro': '/',
  'ui-alquilame': '/reservas',
  'ui-alquicarros': '/reservas',
} as const

describe.each(brands)('$name — el siguiente cliente empieza limpio (issue #472)', ({ name, markupIn }) => {
  const read = (p: string) => readFileSync(`${repoRoot}/packages/${name}/${p}`, 'utf8')
  const confirmationPage = read('app/pages/reservado/[reserveCode]/index.vue')
  const pendientePage = read('app/pages/pendiente.vue')
  const sinDisponibilidadPage = read('app/pages/sindisponibilidad.vue')

  it.each([
    ['confirmación', confirmationPage],
    ['pendiente', pendientePage],
  ])('la página de %s borra al cliente anterior al montar', (_label, source) => {
    expect(source).toContain('useStoreReservationForm().resetAfterReservation()')
    // En onMounted, no en el submit: ahí el formulario ya está desmontado y no se
    // reabre la ventana de doble-POST que `releaseSubmit = false` cierra.
    const call = source.indexOf('resetAfterReservation()')
    const mounted = source.lastIndexOf('onMounted', call)
    expect(mounted).toBeGreaterThan(-1)
  })

  it('sin disponibilidad libera el botón pero NO borra los datos del cliente', () => {
    // Sigue el mismo cliente reintentando otras fechas: borrarle la identidad
    // sería hostil. Solo se sueltan las banderas del envío.
    //
    // alquilame queda fuera A PROPÓSITO: su salida es un ancla HTML, no un
    // NuxtLink, y la recarga de documento ya reinicia Pinia entera. Su suite fija
    // ese diseño con un contrato propio que prohíbe escribir en el store desde esa
    // página (app/pages/__tests__/estados-reserva.test.ts, SCEN-E2), para que no
    // vuelva el intento que metía fechas ahí y competía con los watchers del
    // Searcher. Las otras dos marcas salen con NuxtLink y sí necesitan la llamada.
    if (name === 'ui-alquilame') {
      expect(sinDisponibilidadPage).toMatch(/<a[^>]*href="\/reservas"/)
      return
    }
    expect(sinDisponibilidadPage).toContain('useStoreReservationForm().releaseSubmitFlags()')
    expect(sinDisponibilidadPage).not.toContain('resetAfterReservation')
  })

  it.each([
    ['confirmación', markupIn === 'component' ? 'component' : 'page'],
    ['pendiente', 'pendiente'],
  ])('la página de %s ofrece una salida hacia una reserva nueva', (_label, where) => {
    const source =
      where === 'component'
        ? read('app/components/ReservationConfirmation.vue')
        : where === 'pendiente'
          ? pendientePage
          : confirmationPage
    expect(source).toContain('data-testid="nueva-reserva-link"')
    expect(source).toContain('Hacer otra reserva')
    // El destino no es el mismo en las tres marcas.
    expect(source).toContain(`to="${reserveDestination[name]}"`)
  })
})
