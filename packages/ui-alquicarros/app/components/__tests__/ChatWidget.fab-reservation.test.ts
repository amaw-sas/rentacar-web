import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { isReservationFunnelRoute } from '../../../../logic/src/composables/useContactTeaser'

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url))
const brandWidgets = ['ui-alquicarros', 'ui-alquilame', 'ui-alquilatucarro'].map(
  brand => ({
    brand,
    source: readFileSync(
      `${repoRoot}/packages/${brand}/app/components/ChatWidget.vue`,
      'utf8',
    ),
  }),
)
const alquilatucarroFunnelSource = readFileSync(
  `${repoRoot}/packages/ui-alquilatucarro/app/components/CategorySelectionSection.vue`,
  'utf8',
)

describe('FAB de contacto en reservas — Fase 3 E8–E10', () => {
  it('E8 — both funnel route families add the mobile CTA offset', () => {
    const funnelPaths = [
      '/reservas',
      '/reservas/lugar-recogida/bogota/categoria/CCAR',
      '/bogota/buscar-vehiculos/lugar-recogida/aeropuerto/categoria/c',
      '/cali/buscar-vehiculos/referido/aliado/lugar-recogida/norte/categoria/f',
    ]
    for (const path of funnelPaths) {
      expect(isReservationFunnelRoute(path), path).toBe(true)
    }

    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain(
        `:class="{ 'contact-fab-stack--reservation': isReservationRoute }"`,
      )
      expect(source, brand).toMatch(
        /const isReservationRoute = computed\([\s\S]*isReservationFunnelRoute\(route\.path\)/,
      )
      expect(source, brand).toMatch(
        /@media \(max-width: 1023\.98px\) \{[\s\S]*\.contact-fab-stack--reservation \{[\s\S]*--reservation-mobile-cta-height: 4\.5rem;[\s\S]*--reservation-fab-clearance: 0\.75rem;[\s\S]*env\(safe-area-inset-bottom, 0px\)/,
      )
    }

    // Alquilatucarro's anchored slideover action is exactly 4.5rem from the
    // viewport bottom: Nuxt UI footer p-4 (1rem) + CTA py-4/text-base (3.5rem).
    expect(alquilatucarroFunnelSource).toContain("footer: 'bg-white gap-2 border-t-0'")
    expect(alquilatucarroFunnelSource).toMatch(
      /label="Siguiente"[\s\S]*size="xl"[\s\S]*class="flex-1 py-4/,
    )
    expect(alquilatucarroFunnelSource).toMatch(
      /size="xl"[\s\S]*class="flex-1 py-4[^\n]*whitespace-nowrap[\s\S]*Solicitar reserva/,
    )
  })

  it('E8 — the reservation menu is icon-only on mobile and remains accessible', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toMatch(
        /@media \(max-width: 1023\.98px\) \{[\s\S]*\.contact-fab-stack--reservation \.fab-label \{ display: none; \}/,
      )
      expect(source, brand).toContain('aria-label="Abrir Chat 24 horas"')
      expect(source, brand).toContain('aria-label="Abrir WhatsApp"')
      expect(source, brand).toContain(':aria-label="`Llamar al ${franchise.phone}`"')
    }
  })

  it('E10 — normal pages and desktop retain the original bottom-6 position and labels', () => {
    const normalPaths = [
      '/',
      '/bogota',
      '/tarifas',
      '/buscar-vehiculos',
      '/bogota/buscar-vehiculos-extra',
      '/reservado/ABC123',
    ]
    for (const path of normalPaths) {
      expect(isReservationFunnelRoute(path), path).toBe(false)
    }

    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('.contact-fab-stack { bottom: 1.5rem; }')
      expect(source, brand).toContain('<span class="fab-label">Chat 24 horas</span>')
      expect(source, brand).toContain('<span class="fab-label">WhatsApp</span>')
      expect(source, brand).toContain('<span class="fab-label">Llámanos</span>')
    }
  })
})
