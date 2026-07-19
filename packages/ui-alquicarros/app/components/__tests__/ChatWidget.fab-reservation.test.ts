import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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

describe('FAB de contacto en reservas — Fase 2 E5–E7', () => {
  it('E5 — /reservas adds a mobile-only CTA-height offset and safe-area clearance', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain(
        `:class="{ 'contact-fab-stack--reservation': isReservationRoute }"`,
      )
      expect(source, brand).toMatch(
        /const isReservationRoute = computed\([\s\S]*isContactTeaserRouteExcluded\(route\.path\)/,
      )
      expect(source, brand).toMatch(
        /@media \(max-width: 1023\.98px\) \{[\s\S]*\.contact-fab-stack--reservation \{[\s\S]*--reservation-mobile-cta-height: 4\.5rem;[\s\S]*--reservation-fab-clearance: 0\.75rem;[\s\S]*env\(safe-area-inset-bottom, 0px\)/,
      )
    }
  })

  it('E6 — the reservation menu is icon-only on mobile and remains accessible', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toMatch(
        /@media \(max-width: 1023\.98px\) \{[\s\S]*\.contact-fab-stack--reservation \.fab-label \{ display: none; \}/,
      )
      expect(source, brand).toContain('aria-label="Abrir Chat 24 horas"')
      expect(source, brand).toContain('aria-label="Abrir WhatsApp"')
      expect(source, brand).toContain(':aria-label="`Llamar al ${franchise.phone}`"')
    }
  })

  it('E7 — normal pages and desktop retain the original bottom-6 position and labels', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('.contact-fab-stack { bottom: 1.5rem; }')
      expect(source, brand).toContain('<span class="fab-label">Chat 24 horas</span>')
      expect(source, brand).toContain('<span class="fab-label">WhatsApp</span>')
      expect(source, brand).toContain('<span class="fab-label">Llámanos</span>')
    }
  })
})
