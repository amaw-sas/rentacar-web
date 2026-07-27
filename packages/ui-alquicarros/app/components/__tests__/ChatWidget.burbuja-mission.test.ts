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
const teaserSource = readFileSync(
  `${repoRoot}/packages/logic/src/composables/useContactTeaser.ts`,
  'utf8',
)
const searchHydratorSource = readFileSync(
  fileURLToPath(
    new URL('../../composables/useSearchByQueryParams.ts', import.meta.url),
  ),
  'utf8',
)

describe('Burbuja chat mission E1–E4 — widget integration', () => {
  it('E10 — all three widget copies remain byte-identical', () => {
    expect(brandWidgets[1]?.source).toBe(brandWidgets[0]?.source)
    expect(brandWidgets[2]?.source).toBe(brandWidgets[0]?.source)
  })

  it('E1 — OFF gates timers, announcements, badges, panel and typing surface', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toMatch(
        /const teaserAllowed = computed\([\s\S]*chatEnabled\.value/,
      )
      expect(source, brand).toMatch(
        /\[chatStatusResolved, teaserAllowed\][\s\S]*if \(!resolved\) return[\s\S]*if \(allowed\)[\s\S]*teaser\.start/,
      )
      expect(source, brand).toContain('v-if="chatEnabled && panelOpen"')
      expect(source, brand).toContain("{{ chatEnabled ? announce : '' }}")
      expect(source, brand).toContain(
        "{{ teaserAllowed ? teaserAnnounce : '' }}",
      )
      expect(source, brand).not.toMatch(
        /!chatEnabled\s*&&\s*unread\s*===\s*0\s*&&\s*syntheticCount/,
      )
    }
  })

  it('E2/E9 — every widget suppresses teasers on both reservation funnels', () => {
    expect(teaserSource).toMatch(
      /path === '\/reservas'[\s\S]*path\.startsWith\('\/reservas\/'\)[\s\S]*buscar-vehiculos/,
    )
    expect(teaserSource).toMatch(
      /function isContactTeaserRouteExcluded\(path: string\)[\s\S]*return isReservationFunnelRoute\(path\)/,
    )
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toMatch(
        /const isReservationRoute = computed\([\s\S]*isReservationFunnelRoute\(route\.path\)/,
      )
      expect(source, brand).toMatch(
        /chatEnabled\.value && !isContactTeaserRouteExcluded\(route\.path\)/,
      )
      expect(source, brand).toMatch(
        /teaserAllowed\.value\s*&&\s*teaserVisible\.value/,
      )
    }
  })

  it('E3 — teaser X is local, and same-search remount skips the reset-triggering fetch', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('@click.stop="teaser.dismiss()"')
    }

    const dismissBody = teaserSource.match(
      /function dismiss\(\) \{[\s\S]*?\n  \}/,
    )?.[0]
    expect(dismissBody).toBeTruthy()
    expect(dismissBody).not.toMatch(/navigateTo|router|history|location/)

    expect(searchHydratorSource).toMatch(
      /const canReuseExistingSearch =[\s\S]*hasAvailableCategories\.value[\s\S]*selectedCategory\.value !== null[\s\S]*reservationSearchSignature/,
    )
    // #402 reescribió esta línea: doSearch pasó a devolver si la búsqueda salió,
    // así que su llamada vive en el lado falso de un ternario. Lo que este test
    // fija no cambia — con una búsqueda reusable, doSearch NO se llama.
    expect(searchHydratorSource).toMatch(
      /canReuseExistingSearch \? false : doSearch\(\);/,
    )
  })

  it('E4 — ON keeps Chat, WhatsApp, call and the normal teaser start path', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain('<li v-if="chatEnabled"')
      expect(source, brand).toContain('aria-label="Abrir WhatsApp"')
      expect(source, brand).toContain('class="fab-circle fab-call"')
      expect(source, brand).toMatch(
        /teaser\.start\(\{[\s\S]*allowed: \(\) => teaserAllowed\.value/,
      )
    }
  })

  // Issue #386 — the FAB pulse must not fix one brand's colour on every brand,
  // and must not blink forever (WCAG 2.2.2). Asserted across all three copies so
  // it rides the E10 byte-identical invariant instead of drifting per brand.
  it('P386 — the FAB attention pulse is brand-tokened and bounded', () => {
    for (const { brand, source } of brandWidgets) {
      const keyframe = source.match(/@keyframes pulse-attention \{[\s\S]*?\n\}/)?.[0] ?? ''
      // Colour resolves from the per-brand primary token, never the hardcoded
      // alquilame red (rgba(204, 2, 43) === #cc022b).
      expect(keyframe, brand).toContain('var(--ui-primary')
      expect(keyframe, brand).not.toMatch(/rgba\(204, 2, 43/)
      // Bounded to a finite run under 5s (2 × 2.4s = 4.8s), never infinite.
      expect(source, brand).toMatch(
        /\.animate-pulse-attention \{ animation: pulse-attention 2\.4s ease-in-out 2 forwards; \}/,
      )
      expect(source, brand).not.toMatch(/\.animate-pulse-attention \{ animation:[^}]*infinite/)
      // Reduced-motion still disables it entirely.
      expect(source, brand).toMatch(
        /prefers-reduced-motion: reduce\) \{ \.animate-pulse-attention \{ animation: none; \} \}/,
      )
    }
  })
})
