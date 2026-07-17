import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url))
const read = (p: string) => readFileSync(`${repoRoot}/${p}`, 'utf8')

const chatWidget = read('packages/ui-alquilatucarro/app/components/ChatWidget.vue')
const brandWidgets = ['ui-alquicarros', 'ui-alquilame', 'ui-alquilatucarro'].map(
  b => read(`packages/${b}/app/components/ChatWidget.vue`),
)
const atcSection = read('packages/ui-alquilatucarro/app/components/CategorySelectionSection.vue')
const alqSection = read('packages/ui-alquilame/app/components/CategorySelectionSection.vue')

// Operador: en escritorio, con el resumen de reserva abierto, el FAB de chat
// (bottom-6 right-6, z-[60]) tapa Volver/Siguiente/Solicitar reserva del
// u-slideover (anclado a la derecha). Fix: el FAB salta a la izquierda SOLO
// mientras ese resumen está abierto Y en viewport ancho (≥1024px). El ChatWidget
// es byte-idéntico entre las 3 marcas (invariante E10/E8 en ui-alquicarros), así
// que el salto se activa por data-shift-left + CSS —NO tocando el `:class` que E8
// congela— y el estado se lee/escribe vía useState 'reservation-slideover-open'.
// Tests source-assertion (convención del repo; evita el guard de *.scenarios.md).
describe('FAB de chat — salta a la izquierda solo con el resumen abierto (escritorio)', () => {
  // SCEN-1: E8 congela el `:class`; el salto NO debe tocarlo. El ancla derecho
  // sigue hardcodeado en la clase base; el salto llega por un atributo aparte.
  it('SCEN-1 — preserva el :class/ancla de E8 y añade data-shift-left', () => {
    expect(chatWidget).toContain(
      `:class="{ 'contact-fab-stack--reservation': isReservationRoute }"`,
    )
    expect(chatWidget).toMatch(
      /class="contact-fab-stack absolute right-6 flex flex-col items-end gap-4/,
    )
    expect(chatWidget).toContain(':data-shift-left="shiftLeft"')
    // El menú conserva su alineación base (items-end); el salto es solo por CSS.
    expect(chatWidget).toContain('class="flex flex-col items-end gap-3 pointer-events-auto"')
    // No debe reintroducirse el enfoque viejo (ancla vía :class dinámico).
    expect(chatWidget).not.toMatch(/shiftLeft \? 'left-6 items-start'/)
    expect(chatWidget).not.toContain(':class="[')
  })

  // SCEN-2: shiftLeft = viewport ancho (≥1024, NO el isDesktop de 768) Y resumen
  // abierto, leído del estado compartido useState 'reservation-slideover-open'.
  it('SCEN-2 — shiftLeft deriva de useState reservation-slideover-open y min-width:1024px', () => {
    expect(chatWidget).toMatch(
      /const reservationSummaryOpen = useState<boolean>\(\s*['"]reservation-slideover-open['"]\s*,\s*\(\)\s*=>\s*false\s*\)/,
    )
    expect(chatWidget).toMatch(/const isWideViewport = useMediaQuery\('\(min-width: 1024px\)'\)/)
    expect(chatWidget).toMatch(
      /const shiftLeft = computed\(\(\)\s*=>\s*isWideViewport\.value\s*&&\s*reservationSummaryOpen\.value\)/,
    )
    // El gate NO reutiliza el isDesktop de 768px de main para shiftLeft.
    expect(chatWidget).not.toMatch(/shiftLeft[^\n]*isDesktop/)
  })

  // SCEN-3: el CSS activado por data-shift-left ancla a la izquierda (stack y
  // menú a items-start) e invierte las filas para alinear los círculos.
  it('SCEN-3 — CSS de data-shift-left ancla a la izquierda y realinea el menú', () => {
    expect(chatWidget).toMatch(
      /\.contact-fab-stack\[data-shift-left='true'\]\s*\{[^}]*right:\s*auto;[^}]*left:\s*1\.5rem;[^}]*align-items:\s*flex-start/,
    )
    expect(chatWidget).toMatch(
      /\.contact-fab-stack\[data-shift-left='true'\]\s*#contact-fab-menu\s*\{[^}]*align-items:\s*flex-start/,
    )
    expect(chatWidget).toMatch(
      /\.contact-fab-stack\[data-shift-left='true'\]\s*\.fab-item\s*\{[^}]*flex-direction:\s*row-reverse/,
    )
  })

  // SCEN-4: el lift móvil de main se conserva intacto (no lo pisa el rework).
  it('SCEN-4 — conserva contact-fab-stack--reservation (lift móvil de main)', () => {
    expect(chatWidget).toContain('.contact-fab-stack { bottom: 1.5rem; }')
    expect(chatWidget).toMatch(/@media \(max-width: 1023\.98px\)/)
    expect(chatWidget).toMatch(
      /const isReservationRoute = computed\([\s\S]*isReservationFunnelRoute\(route\.path\)/,
    )
  })

  // SCEN-5: las 3 copias del widget siguen byte-idénticas (mismo invariante que
  // E10 en ui-alquicarros, pero con feedback local rápido) y sin dejar rastro
  // del composable eliminado.
  it('SCEN-5 — las 3 copias del ChatWidget son byte-idénticas', () => {
    expect(brandWidgets[1]).toBe(brandWidgets[0])
    expect(brandWidgets[2]).toBe(brandWidgets[0])
  })
  it('SCEN-5b — el composable useReservationSlideover fue eliminado (inline useState)', () => {
    expect(chatWidget).not.toContain('useReservationSlideover')
    expect(atcSection).not.toContain('useReservationSlideover')
    expect(alqSection).not.toContain('useReservationSlideover')
    expect(
      existsSync(`${repoRoot}/packages/ui-alquilatucarro/app/composables/useReservationSlideover.ts`),
    ).toBe(false)
  })
})

describe('CategorySelectionSection — publica el estado del resumen (ambas marcas con slideover)', () => {
  // SCEN-6: cada marca con slideover escribe la MISMA clave useState que lee el
  // ChatWidget, la sincroniza con slideoverOpen y la resetea al desmontar.
  it.each([
    ['alquilatucarro', atcSection],
    ['alquilame', alqSection],
  ])('SCEN-6 — %s sincroniza y resetea reservation-slideover-open', (_brand, source) => {
    expect(source).toMatch(
      /const chatShouldShiftLeft = useState<boolean>\(\s*['"]reservation-slideover-open['"]\s*,\s*\(\)\s*=>\s*false\s*\)/,
    )
    expect(source).toMatch(/watch\(slideoverOpen,\s*\(open\)\s*=>\s*\{[^}]*chatShouldShiftLeft\.value = open/)
    expect(source).toMatch(/onBeforeUnmount\([\s\S]*?chatShouldShiftLeft\.value = false/)
  })
})
