/**
 * F1 step03 — presentational home sections (issue #112).
 *
 * Encodes SCEN-F1-03 (partial) as static-source assertions; full runtime/visual
 * verification is deferred to the Vercel-preview pass:
 *   - The 3 new presentational components exist with their design copy:
 *       HowItWorks.vue  → 3 steps (Elige tu Ciudad y Vehículo · Reserva con
 *                         anticipación · Recoge y Disfruta).
 *       ValueProps.vue  → 4 props (Sin Anticipos · Flota Nueva · Asistencia 24/7
 *                         · Cobertura Nacional).
 *       Stats.vue       → stats band copy verbatim from the design (incl.
 *                         "desde 2015"), the one named hardcoded-copy exception.
 *   - ValueProps headline derives the brand name from `organization.brand`
 *     (no literal "Alquilame", no `franchise.shortname` lowercase usage).
 *   - No `bg-gradient-to-` anywhere (v4 lesson — must be `bg-linear-to-*`).
 *   - Headings adopt the `.heading-*` utilities (→ Plus Jakarta, closes F0-03).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const HOME = join(__dirname, '..')

function read(rel: string): string {
  return readFileSync(join(HOME, rel), 'utf-8')
}

const howItWorks = read('HowItWorks.vue')
const valueProps = read('ValueProps.vue')
const stats = read('Stats.vue')

const ALL = [howItWorks, valueProps, stats]

describe('home section order — stats sit high, matching the reference', () => {
  const index = readFileSync(join(HOME, '..', '..', 'pages/index.vue'), 'utf-8')
  const pos = (tag: string) => index.indexOf(tag)

  it('places HomeStats right after HowItWorks and before the ¿por qué? block', () => {
    // Reference order: Hero → Fleet → Cómo funciona → ESTADÍSTICAS → ¿Por qué? →
    // Ciudades. The stats band used to sit far down (below Reviews).
    const how = pos('<HomeHowItWorks')
    const st = pos('<HomeStats')
    const why = pos('<HomeValueProps')
    const cities = pos('<HomeCities')
    expect(how).toBeGreaterThan(-1)
    expect(st).toBeGreaterThan(how)
    expect(why).toBeGreaterThan(st)
    expect(cities).toBeGreaterThan(why)
  })
})

describe('F1 step03 — HowItWorks.vue (3 steps)', () => {
  it('renders the 3 design steps with their titles', () => {
    expect(howItWorks).toContain('Elige tu Ciudad y Vehículo')
    expect(howItWorks).toContain('Reserva con anticipación')
    expect(howItWorks).toContain('Recoge y Disfruta')
  })

  it('is the #how-it-works section with the design header', () => {
    expect(howItWorks).toMatch(/id="how-it-works"/)
    expect(howItWorks).toContain('Cómo Funciona')
  })

  it('ValueProps is anchorable as the #por-que section', () => {
    // The "¿Por qué…?" title was the only section without an in-page anchor.
    expect(valueProps).toMatch(/<section id="por-que"/)
  })

  it('renders each step illustration via <NuxtImg> (not a raw <img>)', () => {
    // The raw <img loading="lazy"> with no intrinsic size collapsed/blew up
    // the aspect-[4/3] box inside the flex-stretch row → empty giant cards.
    expect(howItWorks).toMatch(/<NuxtImg\b/)
    expect(howItWorks).not.toMatch(/<img\b/)
  })

  it('locks the image aspect with explicit width/height (CLS + no collapse)', () => {
    // Intrinsic 508×391 matches the real assets so the box reserves space.
    expect(howItWorks).toMatch(/width="508"/)
    expect(howItWorks).toMatch(/height="391"/)
    // The illustration box keeps the design aspect ratio.
    expect(howItWorks).toMatch(/aspect-\[4\/3\]/)
  })

  it('wires the 3 real step assets', () => {
    expect(howItWorks).toContain('/images/howitworks/paso-escoge.jpg')
    expect(howItWorks).toContain('/images/howitworks/paso-reserva.jpg')
    expect(howItWorks).toContain('/images/howitworks/paso-recoge.jpg')
  })
})

describe('ValueProps.vue — "¿Por qué alquilar con …?" photo cards', () => {
  // Adopted verbatim from the reference design's VentajasCity: four framed
  // PHOTO cards replacing the old flat text-only props. Copy is the reference's.
  it('renders the 4 reference advantage titles', () => {
    expect(valueProps).toContain('Sin anticipos para reservar')
    expect(valueProps).toContain('Plan diario con kilometraje ilimitado')
    expect(valueProps).toContain('Entrega en aeropuertos y puntos físicos')
    expect(valueProps).toContain('Pico y placa controlado')
  })

  it('drops the old flat props copy', () => {
    expect(valueProps).not.toContain('Flota Nueva')
    expect(valueProps).not.toContain('Asistencia 24/7')
    expect(valueProps).not.toContain('Cobertura Nacional')
  })

  it('wires the 4 ported ventaja photos', () => {
    expect(valueProps).toContain('/images/ventajas/sin-anticipos-foto.webp')
    expect(valueProps).toContain('/images/ventajas/kilometraje-ilimitado-foto.webp')
    expect(valueProps).toContain('/images/ventajas/aeropuerto-eldorado-foto.webp')
    expect(valueProps).toContain('/images/ventajas/pico-y-placa-foto.webp')
  })

  it('uses the framed-card treatment (thick white border on the lightest surface)', () => {
    expect(valueProps).toMatch(/\bborder-\[7px\]/)
    expect(valueProps).toMatch(/\bborder-white\b/)
    expect(valueProps).toMatch(/\bbg-surface-softest\b/)
  })

  it('headline derives the brand name from organization.brand — never hardcoded', () => {
    expect(valueProps).toMatch(/organization\.brand/)
    // The headline now takes an optional city suffix on city landings, so the
    // interpolation is `{{ brand }}{{ citySuffix }}` — citySuffix is '' on the home.
    expect(valueProps).toMatch(/¿Por qué alquilar con \{\{\s*brand\s*\}\}\{\{\s*citySuffix\s*\}\}\?/)
    expect(valueProps).not.toContain('alquilar con Alquilame')
    expect(valueProps).not.toContain('shortname')
    expect(valueProps).not.toContain('franchise')
  })
})

describe('F1 step03 — Stats.vue (stats band, hardcoded-copy exception)', () => {
  it('renders the design stats labels', () => {
    expect(stats).toContain('Vehículos disponibles')
    expect(stats).toContain('Ciudades en Colombia')
    expect(stats).toContain('Años de experiencia')
  })

  it('carries the design copy verbatim, including "desde 2015"', () => {
    expect(stats).toContain('desde 2015')
  })
})

describe('F1 step03 — shared invariants', () => {
  it('no section uses the v3 bg-gradient-to- alias (must be bg-linear-to-*)', () => {
    for (const src of ALL) {
      expect(src).not.toMatch(/bg-gradient-to-/)
    }
  })

  it('every section headline adopts a brand heading utility (.heading-* or font-heading)', () => {
    // Golden parity: section headings moved off the .heading-section token
    // (text-2xl/md:text-3xl = wrong golden size) to `font-heading` + the
    // golden size ramp (text-3xl md:text-4xl). Both encode Plus Jakarta.
    for (const src of ALL) {
      expect(src).toMatch(/heading-(hero|page|section|card|sub|label)|font-heading/)
    }
  })
})
