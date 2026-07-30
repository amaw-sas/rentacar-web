import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url))
const brands = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros'] as const
const brandWidgets = brands.map(brand => ({
  brand,
  source: readFileSync(
    `${repoRoot}/packages/${brand}/app/components/ChatWidget.vue`,
    'utf8',
  ),
}))

// Medido en producción antes del arreglo (viewport 1487×889): el panel terminaba
// en bottom:745 y la fila `Chat 24 horas` ocupaba 697→745, o sea 185×48px de
// solapamiento, y `elementFromPoint` sobre el borde derecho del input devolvía
// `fab-label` en vez del campo — el clic cerraba el chat. Causa: `bottom: 9rem`
// es la altura de una pila de DOS filas y las marcas vivas rinden TRES.
//
// Estas pruebas fijan el mecanismo en las tres copias. La geometría real se
// verifica en el navegador (getBoundingClientRect + elementFromPoint), no aquí:
// jsdom no tiene motor de maquetación y un test de fuente por sí solo ya dejó
// pasar un bug de render en este repo.
describe('SCEN-001/002 — el panel se ancla sobre la pila medida, no sobre una constante', () => {
  it('deriva el bottom de --panel-lift con el fallback de la pila de 2 filas', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('bottom: var(--panel-lift, 9rem);')
      expect(source, brand).not.toMatch(/^\s*bottom: 9rem;$/m)
    }
  })

  it('mide la lista de canales, no el stack entero', () => {
    for (const { brand, source } of brandWidgets) {
      // El stack incluye el teaser-sizer oculto y su hueco (122px medidos):
      // medirlo sobre-elevaría el panel.
      expect(source, brand).toMatch(/<ul\s+ref="channelsEl"/)
      expect(source, brand).toMatch(/channelsEl\.value\?\.getBoundingClientRect\(\)/)
    }
  })

  it('reutiliza la aritmética compartida de logic en vez de repetir números', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('chatPanelLiftPx')
      expect(source, brand).toMatch(
        /from '@rentacar-main\/logic\/utils\/chatPanelLift'/,
      )
    }
  })

  it('mide antes de abrir para que el panel no nazca en el sitio equivocado', () => {
    for (const { brand, source } of brandWidgets) {
      const openChat = source.slice(source.indexOf('function openChat'))
      const measure = openChat.indexOf('measureChannels()')
      const open = openChat.indexOf('panelOpen.value = true')
      expect(measure, `${brand}: openChat no mide los canales`).toBeGreaterThan(-1)
      expect(open, `${brand}: openChat no abre el panel`).toBeGreaterThan(-1)
      expect(
        measure,
        `${brand}: mide DESPUÉS de abrir → el panel salta un frame`,
      ).toBeLessThan(open)
    }
  })

  // Regresión: la primera versión construía el ResizeObserver sin comprobar que
  // existiera y reventaba en jsdom con `ReferenceError` en cuanto otra suite
  // MONTABA el widget (ChatWidget.whatsappSchedule.test.ts en ui-alquicarros).
  it('no construye el observador donde el entorno no lo tiene', () => {
    for (const { brand, source } of brandWidgets) {
      const guard = source.indexOf("if (typeof ResizeObserver === 'undefined') return")
      const build = source.indexOf('new ResizeObserver(')
      expect(guard, `${brand}: falta la guarda de ResizeObserver`).toBeGreaterThan(-1)
      expect(
        guard,
        `${brand}: la guarda va DESPUÉS de construirlo`,
      ).toBeLessThan(build)
    }
  })

  it('SCEN-006 — reobserva la pila para seguir el horario de WhatsApp', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('ResizeObserver')
      expect(source, brand).toMatch(/channelsObserver\?\.disconnect\(\)/)
      expect(
        source,
        `${brand}: el observer sobrevive al unmount`,
      ).toMatch(/onBeforeUnmount\(\(\) => channelsObserver\?\.disconnect\(\)\)/)
    }
  })
})

describe('SCEN-004/005 — el panel usa el área aprobada y se encoge en pantalla corta', () => {
  it('mide 28rem de ancho acotado al viewport', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('width: min(28rem, calc(100vw - 2rem));')
      expect(source, brand).not.toMatch(/^\s*width: 24rem;$/m)
    }
  })

  it('techo de 40rem que cede al alto disponible en vez de desbordar', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain(
        'height: min(40rem, calc(100dvh - var(--panel-lift, 9rem) - 1.5rem));',
      )
      // El par height:32rem + max-height:min(75dvh,40rem) se contradecía: el
      // techo permitía 640px pero el alto fijo cortaba en 512.
      expect(source, brand).not.toMatch(/^\s*height: 32rem;$/m)
      expect(source, brand).not.toContain('max-height: min(75dvh, 40rem);')
    }
  })
})

describe('SCEN-007 — el cambio no toca lo que otros guardias congelan', () => {
  it('la pila conserva su literal de posición', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('.contact-fab-stack { bottom: 1.5rem; }')
    }
  })

  it('el panel sigue detrás del switch del dashboard', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('v-if="chatEnabled && panelOpen"')
    }
  })
})
