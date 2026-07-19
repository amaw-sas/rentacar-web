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
    expect(searchHydratorSource).toMatch(
      /if \(canReuseExistingSearch\) return;\s*doSearch\(\);/,
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
})
