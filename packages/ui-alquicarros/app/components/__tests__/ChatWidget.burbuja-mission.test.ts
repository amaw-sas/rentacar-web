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
// SCEN-BC-12 (spec 2026-10-22-barra-contacto-alquilame): alquilame cambió el
// lanzador por su propia barra de contacto y es fork declarado (SCEN-5a de
// ChatWidget.shift.test.ts). Lo que fija marcado SOLO del lanzador (menú, filas
// <li>, pulso) corre sobre las dos marcas que siguen compartiendo widget; sus
// equivalentes sobre la barra viven en
// ui-alquilame/app/components/__tests__/ChatWidget.bar.test.ts.
const launcherWidgets = brandWidgets.filter(({ brand }) => brand !== 'ui-alquilame')
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
  it('E10 — shared widget behavior; tel: is the declared live-brand extra', () => {
    for (const { brand, source } of launcherWidgets) {
      expect(source, brand).toContain(
        'v-if="(chatEnabled || whatsappVisible) && !hideContactButtons"',
      )
      expect(source, brand).toContain('<li v-if="chatEnabled"')
      expect(source, brand).toContain('<li v-if="whatsappVisible"')
      // Invariante intacto (los canales son hermanos de un solo menú, sin
      // ramas por marca): ahora ese menú es el que despliega el lanzador, y
      // todas las marcas lo declaran igual.
      expect(source, brand).toContain('id="contact-fab-menu"')
      expect(source, brand).toContain('aria-controls="contact-fab-menu"')
      // 2026-07-27, decisión del dueño: el canal tel: se queda en las marcas
      // vivas.
      expect(source, brand).toContain('fab-call')
    }
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
      // SCEN-CM-07 (spec 2026-10-22-contactanos-movil-alquilame): alquilame
      // announces its one short mobile bubble instead of line 1 + line 2, so its
      // region reads teaserLiveText, which still derives from teaserAnnounce.
      // The gate on teaserAllowed is the same for the three brands.
      if (brand === 'ui-alquilame') {
        expect(source, brand).toContain("{{ teaserAllowed ? teaserLiveText : '' }}")
        expect(source, brand).toMatch(
          /const teaserLiveText = computed\(\(\) => \{\s*if \(!compactGreeting\.value\) return teaserAnnounce\.value\s*return teaserAnnounce\.value \? mobileLine : ''\s*\}\)/,
        )
      } else {
        expect(source, brand).toContain(
          "{{ teaserAllowed ? teaserAnnounce : '' }}",
        )
      }
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
      /function dismiss\(\) \{[\s\S]*?\n {2}\}/,
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

  it('E4 — ON keeps direct Chat + WhatsApp (one tap from the launcher) and the normal teaser start path', () => {
    for (const { brand, source } of brandWidgets) {
      // Filas, teléfono y menú del lanzador: solo en las marcas que lo
      // conservan. En alquilame los canales son hijos directos del <nav>
      // (ChatWidget.bar.test.ts); lo demás de este caso le sigue aplicando.
      if (brand !== 'ui-alquilame') {
        expect(source, brand).toContain('<li v-if="chatEnabled"')
        expect(source, brand).toContain('<li v-if="whatsappVisible"')
      }
      expect(source, brand).toContain('aria-label="Abrir WhatsApp"')
      if (brand !== 'ui-alquilame') expect(source, brand).toContain('class="fab-circle fab-call"')
      // Invariante intacto: Chat y WhatsApp siguen siendo opciones directas, sin
      // pasos intermedios; el menú es un solo nivel (v-show) y no hay submenús
      // ni role="menu" que la hoja base.css pueda recolorear.
      if (brand !== 'ui-alquilame') expect(source, brand).toMatch(/<ul[^>]*v-show="menuOpen"/)
      expect(source, brand).not.toMatch(/<ul[^>]*role="menu"/)
      expect(source, brand).toMatch(
        /teaser\.start\(\{[\s\S]*allowed: \(\) => teaserAllowed\.value/,
      )
    }
  })

  // Issue #386 — the FAB pulse must not fix one brand's colour on every brand,
  // and must not blink forever (WCAG 2.2.2). Asserted across every copy that
  // keeps the launcher so it rides the E10 byte-identical invariant instead of
  // drifting per brand (alquilame dropped the pulse with it, SCEN-BC-12).
  it('P386 — the FAB attention pulse is brand-tokened and bounded', () => {
    for (const { brand, source } of launcherWidgets) {
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
