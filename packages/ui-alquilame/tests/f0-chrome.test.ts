/**
 * Chrome parity phase — header + footer aligned to the GOLDEN Astro design
 * (astro-alquilame/index.html), superseding the F0-interim red-on-red chrome.
 *
 * Golden contract (observable, static-source assertions; runtime/visual diff
 * deferred to the dogfood/screenshot pass):
 *   - header: WHITE sticky surface, RED (color-variant) logo, dark nav links,
 *             a brand-red "Reserva Ahora" pill + a bg-whatsapp WhatsApp button.
 *   - footer: dark navy (#1A1A2E) 4-column grid + black bottom bar. The 19 city
 *             links stay internal and use the compact public-city list, keeping
 *             reservation dates and the full catalog out of global chrome.
 *             Legal links still derive from franchise data.
 *   - SCEN-CHROME-NOBLUE: the chrome surfaces yield zero legacy blue.
 *   - SCEN-CHROME-NOGREEN: the only green in the chrome is the WhatsApp token.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

const BLUE = /#000073|#0891b2|blue-[0-9]/

describe('chrome — header blanco golden (default.vue)', () => {
  const layout = read('app/layouts/default.vue')
  // Slice the header region: from <UHeader to the first <main>.
  const header = layout.slice(layout.indexOf('<UHeader'), layout.indexOf('<main'))

  it('header background is WHITE, not the red hero gradient nor legacy blue', () => {
    expect(header).toMatch(/<UHeader[\s\S]*?class="[^"]*\bbg-white\b/)
    expect(header).not.toMatch(/from-hero-from\s+to-hero-to/)
    expect(header).not.toContain('bg-[#000073]')
  })

  it('header is sticky to the top like the design', () => {
    expect(header).toMatch(/sticky\s+top-0/)
  })

  it('root keeps a dark brand backdrop so white-text pages stay legible', () => {
    const rootLine = layout.split('\n').find((l) => l.includes('min-h-screen')) ?? ''
    expect(rootLine).toMatch(/from-brand-9\d0\s+to-brand-950/)
    expect(rootLine).not.toMatch(/bg-surface/)
  })

  it('logo uses the RED color variant in the header (no variant="white")', () => {
    const logoTag = header.match(/<Logo\b[^>]*>/)?.[0] ?? ''
    expect(logoTag).not.toMatch(/variant="white"/)
  })

  it('desktop nav links are dark, not white', () => {
    // The active-link helper paints dark text; no white-text default on the nav.
    expect(layout).toMatch(/text-gray-(800|900)/)
  })
})

describe('chrome — CTA "Reserva Ahora" + WhatsApp (default.vue)', () => {
  const layout = read('app/layouts/default.vue')
  const header = layout.slice(layout.indexOf('<UHeader'), layout.indexOf('<main'))

  it('renders a brand-red "Reserva Ahora" CTA to /reservas in desktop AND mobile', () => {
    const reservar = (header.match(/<NuxtLink[\s\S]*?<\/NuxtLink>/g) ?? []).filter(
      (l) => /to="\/reservas"/.test(l) && /Reserva Ahora/.test(l),
    )
    expect(reservar.length).toBeGreaterThanOrEqual(2)
    for (const cta of reservar) {
      expect(cta).toMatch(/bg-brand-\d/)
      expect(cta).not.toMatch(BLUE)
      expect(cta).not.toMatch(/bg-gradient-to-/)
    }
  })

  it('renders a WhatsApp button using the shared bg-whatsapp token + black text', () => {
    const waButtons = (header.match(/<a[\s\S]*?<\/a>/g) ?? []).filter((a) =>
      /franchise\.whatsapp/.test(a),
    )
    expect(waButtons.length).toBeGreaterThanOrEqual(2) // desktop circle + mobile pill
    for (const wa of waButtons) {
      expect(wa).toMatch(/\bbg-whatsapp\b/)
      expect(wa).toMatch(/\btext-black\b/)
      expect(wa).not.toMatch(/bg-\[#090\]/)
    }
  })
})

describe('chrome — footer surface (default.vue)', () => {
  const layout = read('app/layouts/default.vue')

  it('renders a single <footer> on the reference surface (#231015)', () => {
    // Colour updated from the ported #1A1A2E navy to the reference's deep warm
    // brown. The "exactly one <footer>" invariant is unchanged.
    const footers = layout.match(/<footer\b[^>]*>/g) ?? []
    expect(footers).toHaveLength(1)
    expect(footers[0]).toMatch(/bg-\[#231015\]/)
    expect(footers[0]).not.toMatch(/bg-\[#1A1A2E\]/i)
  })

  it('has a black bottom bar inside the footer', () => {
    const footer = layout.slice(layout.indexOf('<footer'))
    expect(footer).toMatch(/bg-black/)
  })

  it('renders the four golden section headings', () => {
    const footer = layout.slice(layout.indexOf('<footer'))
    for (const heading of ['Quiénes somos', 'Ciudades', 'Enlaces', 'Contacto']) {
      expect(footer).toContain(heading)
    }
  })

  it('renders the Google 5,0 trust badge WITHOUT a review count', () => {
    // The count is gone from the badge for the same reason it left the Reviews
    // heading: a hardcoded total only ages downward in credibility. The rating
    // and the "verificadas" wording carry the trust signal.
    const footer = layout.slice(layout.indexOf('<footer'))
    expect(footer).toContain('5,0')
    expect(footer).toContain('Verificadas en Google')
    expect(footer).not.toMatch(/\d+\s+reseñas/)
    // The accessible name must not announce a count the badge no longer shows.
    expect(footer).not.toMatch(/aria-label="[^"]*\d+ reseñas/)
  })

  it('still derives legal links from franchise data', () => {
    const footer = layout.slice(layout.indexOf('<footer'))
    expect(footer).toMatch(/legalLinks|franchise\.footerLinks/)
  })
})

describe('chrome — compact internal city links (default.vue)', () => {
  const layout = read('app/layouts/default.vue')

  it('keeps city links internal without reservation URL construction', () => {
    expect(layout).toContain(':to="`/${city.id}`"')
    expect(layout).not.toContain('wa.me')
    expect(layout).not.toContain('getCityReservationURL')
  })

  it('preserves the v-for over all public cities in the same tab', () => {
    const cityLinks = layout.slice(
      layout.indexOf('v-for="city in cities"') - 100,
      layout.indexOf('v-for="city in cities"') + 400,
    )
    expect(cityLinks).toMatch(/v-for="city in cities"/)
    expect(layout).toContain('usePublicCities()')
    expect(cityLinks).not.toMatch(/:external="true"/)
    expect(cityLinks).not.toMatch(/target="_blank"/)
  })

  it('does not pull reservation dates into the global layout', () => {
    expect(layout).not.toContain('reservationInitDay')
    expect(layout).not.toContain('reservationEndDay')
    expect(layout).not.toContain('@internationalized/date')
  })
})

describe('chrome — de-blue error.vue + typography .link-*', () => {
  const error = read('app/error.vue')
  const typography = read('app/assets/css/rentacar-main/typography.css')

  it('error boundary background is brand red, not blue', () => {
    expect(error).toMatch(/from-hero-from\s+to-brand-950/)
    expect(error).not.toMatch(/from-blue-900/)
    expect(error).not.toMatch(/to-blue-950/)
  })

  it('.link-light / .link-dark use brand tokens, not text-blue-*', () => {
    expect(typography).toMatch(/\.link-light\s*{[\s\S]*text-brand-600/)
    expect(typography).toMatch(/\.link-dark\s*{[\s\S]*text-brand-200/)
    const linkBlock = typography.slice(
      typography.indexOf('.link-light'),
      typography.indexOf('Form Text'),
    )
    expect(linkBlock).not.toMatch(/blue-[0-9]/)
  })
})

// Regression guard: any gradient in the chrome MUST use the v4 canonical
// `bg-linear-to-*` utility, NOT the v3 alias `bg-gradient-to-*` (which renders
// transparent against custom @theme tokens in this Tailwind 4.1 build).
describe('chrome gradients use v4 bg-linear-* (render), not v3 bg-gradient-* (transparent)', () => {
  for (const rel of ['app/layouts/default.vue', 'app/error.vue']) {
    it(`${rel} never uses the broken bg-gradient-to-*`, () => {
      expect(read(rel)).not.toMatch(/bg-gradient-to-/)
    })
  }
})

describe('SCEN-CHROME-NOBLUE — chrome surfaces have zero blue', () => {
  const surfaces = [
    'app/layouts/default.vue',
    'app/error.vue',
    'app/assets/css/rentacar-main/typography.css',
  ]

  for (const rel of surfaces) {
    it(`${rel} contains no #000073 / #0891b2 / blue-N`, () => {
      expect(read(rel)).not.toMatch(BLUE)
    })
  }
})

describe('SCEN-CHROME-NOGREEN — the only green in default.vue is WhatsApp token', () => {
  const layout = read('app/layouts/default.vue')

  it('uses no Tailwind green-N utility classes', () => {
    expect(layout).not.toMatch(/\bbg-green-\d/)
    expect(layout).not.toMatch(/\btext-green-\d/)
  })

  it('the WhatsApp surface is the shared bg-whatsapp token (not free-form hex)', () => {
    expect(layout).toMatch(/\bbg-whatsapp\b/)
    expect(layout).not.toMatch(/bg-\[#090\]/)
  })
})

/**
 * Header spacing — the three chrome blocks span the container edge to edge:
 *   GIVEN a desktop viewport (>= lg)
 *   WHEN  the header renders logo | nav | "Reserva Ahora"
 *   THEN  the logo sits flush against the container's left padding and the CTA
 *         against its right, with the nav floating between them.
 * A local `!important` override used to force `justify-content: center` and
 * `flex: none` on the left/right slots, which collapsed the row into a centered
 * cluster with ~270px of dead space on each side at 1280px. Nuxt UI's own theme
 * already ships `justify-between` + `lg:flex-1`; the fix is to stop fighting it.
 */
describe('header — logo and CTA reach the container edges', () => {
  const css = read('app/assets/css/rentacar-main/base.css')

  it('does not force the header container to centre its blocks', () => {
    const containerRule = css.match(
      /header \[data-slot="container"\]\s*\{[^}]*\}/g,
    ) ?? []
    for (const rule of containerRule) {
      expect(rule, 'header container must not be centred').not.toMatch(
        /justify-content:\s*center/,
      )
    }
  })

  it('does not cancel the flex-1 growth on the left/right slots', () => {
    const slotRules = css.match(
      /header \[data-slot="(left|right)"\]\s*\{[^}]*\}/g,
    ) ?? []
    for (const rule of slotRules) {
      expect(rule, 'header side slots must keep their flex growth').not.toMatch(
        /flex:\s*none/,
      )
    }
  })
})

/**
 * Footer surface + links, aligned with the reference design:
 *   - the footer body sits on #231015 (deep warm brown), not the #1A1A2E navy
 *     the port shipped. The black bottom bar is unchanged.
 *   - "Registra tu Flota" joins the Enlaces column; it had no counterpart in
 *     franchise.footerLinks, so the section silently lacked it.
 */
describe('footer — reference surface colour and link set', () => {
  const layout = read('app/layouts/default.vue')
  const config = read('app/app.config.ts')

  it('uses the reference footer background, not the navy', () => {
    expect(layout).toMatch(/<footer[^>]*bg-\[#231015\]/)
    expect(layout).not.toMatch(/bg-\[#1A1A2E\]/i)
  })

  it('keeps the black bottom bar', () => {
    expect(layout).toMatch(/\bbg-black\b/)
  })

  it('carries a "Registra tu Flota" footer link', () => {
    expect(config).toContain('Registra tu Flota')
  })
})

/**
 * Nav anchors must exist on the page they point at:
 *   GIVEN a city landing (e.g. /armenia)
 *   WHEN  the user clicks "Ciudades" in the header
 *   THEN  it scrolls to that page's nearby-cities section.
 * The link pointed at #cities, which only exists on the home — the city page's
 * section is #ciudades-cercanas (city/SeoContent.vue), so the button did
 * nothing. Every other nav anchor (#hero #fleet #requisitos #faqs #contact)
 * does resolve on a city page; only this one was broken.
 */
describe('header nav — the Ciudades anchor resolves on city pages', () => {
  const layout = read('app/layouts/default.vue')
  const seo = read('app/components/city/SeoContent.vue')

  it('targets the nearby-cities section when on a city route', () => {
    // Assert the BEHAVIOUR of the citiesTo computed, not one particular syntax:
    // whatever shape it takes, it must branch on the city route param and yield
    // the #ciudades-cercanas anchor.
    const start = layout.indexOf('const citiesTo')
    expect(start, 'citiesTo computed not found').toBeGreaterThan(-1)
    const block = layout.slice(start, start + 400)
    expect(block).toMatch(/route\.params\.city/)
    expect(block).toMatch(/'#ciudades-cercanas'/)
  })

  it('still targets #cities on the home and /#cities elsewhere', () => {
    expect(layout).toMatch(/'#cities'/)
    expect(layout).toMatch(/'\/#cities'/)
  })

  it('the id it points at actually exists in the city page markup', () => {
    expect(seo).toMatch(/id="ciudades-cercanas"/)
  })
})
