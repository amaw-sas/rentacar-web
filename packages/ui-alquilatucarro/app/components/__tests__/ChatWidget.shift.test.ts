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
  // SCEN-1: el ancla derecho sigue hardcodeado en la clase base y el salto llega
  // por un atributo aparte, nunca por un `:class` dinámico.
  //
  // El `:class="{ 'contact-fab-stack--reservation': isReservationRoute }"` que
  // esta prueba congelaba desapareció al integrar el rediseño de alquilame: ese
  // lift móvil por RUTA fue sustituido por ocultar el stack entero mientras el
  // resumen está abierto (`hideContactButtons`). El invariante de fondo
  // —el FAB no puede tapar Volver/Siguiente/Solicitar reserva en móvil— lo
  // cubre ahora SCEN-4 sobre el mecanismo nuevo.
  it('SCEN-1 — mantiene el ancla derecho de base y añade data-shift-left', () => {
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
    // El rediseño eliminó el menú desplegable y con él el id #contact-fab-menu:
    // los dos canales cuelgan de un <ul> directo, que es lo que hay que realinear.
    expect(chatWidget).toMatch(
      /\.contact-fab-stack\[data-shift-left='true'\]\s*ul\s*\{[^}]*align-items:\s*flex-start/,
    )
    expect(chatWidget).toMatch(
      /\.contact-fab-stack\[data-shift-left='true'\]\s*\.fab-item\s*\{[^}]*flex-direction:\s*row-reverse/,
    )
  })

  // SCEN-4: en móvil el FAB no puede tapar los CTA del resumen. El mecanismo
  // cambió al integrar el rediseño —antes se ELEVABA el stack en toda la ruta
  // del funnel (`contact-fab-stack--reservation`), ahora se OCULTA entero
  // mientras el resumen está abierto—, pero el invariante es el mismo y sigue
  // vigilado. El stack conserva su posición de reposo abajo.
  it('SCEN-4 — en móvil el stack se oculta con el resumen abierto', () => {
    expect(chatWidget).toContain('.contact-fab-stack { bottom: 1.5rem; }')
    expect(chatWidget).toContain(
      'v-if="(chatEnabled || whatsappVisible) && !hideContactButtons"',
    )
    // Se oculta en TODO viewport mientras el overlay está abierto: el pie del
    // slideover ya trae su propio CTA de WhatsApp. Sin condición de viewport no
    // puede quedar ninguna banda con el FAB encima del CTA.
    expect(chatWidget).toMatch(
      /const hideContactButtons = computed\(\(\) => reservationOverlayOpen\.value\)/,
    )
    // El puente lo publica el store compartido, no una ruta.
    expect(chatWidget).toMatch(
      /const \{ reservationOverlayOpen \} = storeToRefs\(useStoreSearchData\(\)\)/,
    )
  })

  // SCEN-5: las 3 copias del widget siguen byte-idénticas (mismo invariante que
  // E10 en ui-alquicarros, pero con feedback local rápido) y sin dejar rastro
  // del composable eliminado.
  //
  // El rediseño de alquilame ancla su burbuja y su panel al lado contrario, así
  // que la identidad byte a byte dejó de ser cierta para esa marca. En vez de
  // borrar la guardia se ENUMERA la excepción: alquicarros y alquilatucarro
  // siguen idénticos, y alquilame sólo puede diferir en estas líneas. Cualquier
  // deriva nueva —un arreglo que aterrice en una copia y no en las otras, que es
  // lo que E10 existe para atrapar— sigue enrojeciendo.
  const DELTA_ALQUILAME: ReadonlyArray<readonly [string, string]> = [
    // PageSpeed wave 4: ancla el CSS crítico del FAB desde el primer paint y
    // elimina el desplazamiento de 226 px medido en producción.
    [
      '    <div class="contact-fab-layer fixed inset-0 pointer-events-none z-[60]">',
      '    <div class="fixed inset-0 pointer-events-none z-[60]">',
    ],
    ['  left: 0;', '  right: 0;'],
    [
      '  border-radius: 1rem 1rem 1rem 0.25rem; /* esquina hacia el FAB (abajo-izq) */',
      '  border-radius: 1rem 1rem 0.25rem 1rem; /* esquina hacia el FAB */',
    ],
    ['  transform-origin: bottom left;', '  transform-origin: bottom right;'],
    ['  left: 1.5rem;', '  right: 1.5rem;'],
  ]

  it('SCEN-5 — alquicarros y alquilatucarro siguen byte-idénticos', () => {
    expect(brandWidgets[2]).toBe(brandWidgets[0])
  })

  // 2026-07-27, decisión del dueño: el acceso tel: 'Llámanos' SE QUEDA en las
  // dos marcas vivas y alquilame es la única sin él. El <li> del teléfono es un
  // delta ESTRUCTURAL declarado: se retira de la copia base antes de comparar
  // línea a línea, así cualquier OTRA deriva sigue enrojeciendo esta prueba.
  const stripPhoneEntry = (src: string): string => {
    const tel = src.indexOf(':href="`tel:')
    if (tel === -1) return src
    const start = src.lastIndexOf('<li class="flex">', tel)
    const end = src.indexOf('</li>', tel) + '</li>'.length
    return src.slice(0, src.lastIndexOf('\n', start)) + src.slice(end)
  }

  it('SCEN-5a — alquilame sólo difiere en el delta de marca declarado', () => {
    // La parte estructural del delta: las vivas llevan tel:, alquilame no.
    expect(brandWidgets[0]).toContain(':href="`tel:')
    expect(brandWidgets[1]).not.toContain(':href="`tel:')

    const base = stripPhoneEntry(brandWidgets[0] ?? '').split('\n')
    const alq = (brandWidgets[1] ?? '').split('\n')
    expect(alq.length, 'alquilame cambió el número de líneas del widget').toBe(base.length)

    const differing = base
      .map((line, i) => [alq[i] as string, line] as const)
      .filter(([a, b]) => a !== b)

    expect(
      differing,
      'divergencia NO declarada entre las copias del ChatWidget: un arreglo '
      + 'aterrizó en una marca y no en las otras, o el delta de marca cambió. '
      + 'Si es intencional, decláralo en DELTA_ALQUILAME.',
    ).toEqual(DELTA_ALQUILAME.map(pair => [pair[0], pair[1]]))
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
