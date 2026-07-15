/**
 * Chrome parity phase — header + footer aligned to the GOLDEN Astro design
 * (astro-alquilame/index.html), superseding the F0-interim red-on-red chrome.
 *
 * Golden contract (observable, static-source assertions; runtime/visual diff
 * deferred to the dogfood/screenshot pass):
 *   - header: WHITE sticky surface, RED (color-variant) logo, dark nav links,
 *             a brand-red "Reserva Ahora" pill + a bg-whatsapp WhatsApp button.
 *   - footer: dark navy (#1A1A2E) 4-column grid + black bottom bar. The 19 city
 *             links stay INTERNAL via getCityReservationURL with :external +
 *             target=_blank; the #109 hydration guard (onMounted-only date calc,
 *             null-initial refs) is preserved untouched. Legal links still derive
 *             from franchise data.
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

describe('chrome — footer navy golden (default.vue)', () => {
  const layout = read('app/layouts/default.vue')

  it('renders a single <footer> with the dark navy surface (#1A1A2E)', () => {
    const footers = layout.match(/<footer\b[^>]*>/g) ?? []
    expect(footers).toHaveLength(1)
    expect(footers[0]).toMatch(/bg-\[#1A1A2E\]/)
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

  it('renders the Google 5,0 / 43 reseñas trust badge', () => {
    const footer = layout.slice(layout.indexOf('<footer'))
    expect(footer).toContain('5,0')
    expect(footer).toContain('43 reseñas en Google')
  })

  it('still derives legal links from franchise data', () => {
    const footer = layout.slice(layout.indexOf('<footer'))
    expect(footer).toMatch(/legalLinks|franchise\.footerLinks/)
  })
})

describe('chrome — city links + #109 hydration guard (default.vue)', () => {
  const layout = read('app/layouts/default.vue')

  it('keeps the city links INTERNAL via getCityReservationURL (not wa.me)', () => {
    expect(layout).toMatch(/:to="getCityReservationURL\(city\)"/)
    expect(layout).not.toContain('wa.me')
  })

  it('preserves the v-for over cities with :external + target=_blank', () => {
    expect(layout).toMatch(/v-for="city in cities"/)
    expect(layout).toMatch(/:external="true"/)
    expect(layout).toMatch(/target="_blank"/)
  })

  it('#109 guard: dates are computed ONLY in onMounted from null-initial refs', () => {
    expect(layout).toMatch(/const reservationInitDay = ref<string \| null>\(null\)/)
    expect(layout).toMatch(/const reservationEndDay = ref<string \| null>\(null\)/)
    expect(layout).toMatch(/onMounted\(\(\) => {[\s\S]*reservationInitDay\.value =/)
    expect(layout).toMatch(/onMounted\(\(\) => {[\s\S]*reservationEndDay\.value =/)
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
