/**
 * Cities.vue — mosaico editorial de fotos disponibles + listado de cobertura tipográfico.
 *
 * Codifica docs/specs/cities-masonry/scenarios/cities-section.scenarios.md como aserciones
 * static-source (mismo patrón que presentational.test.ts): se lee el .vue como texto. La
 * verificación visual/runtime se hace en navegador sobre el dev server.
 *
 * Contexto: la marquesina/masonry de 4 lanes se rechazó en review (solo hay 4 fotos reales para
 * 19 ciudades). Este diseño NO simula un tile de imagen por ciudad.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const cities = readFileSync(join(__dirname, '..', 'Cities.vue'), 'utf-8')

describe('Cities — SCEN-CITIES-01: todas las ciudades activas son alcanzables', () => {
  it('el listado itera TODAS las ciudades de useData().cities (sin slice/hardcode)', () => {
    expect(cities).toMatch(/const\s*\{\s*cities\s*\}\s*=\s*useData\(\)/)
    expect(cities).toMatch(/v-for="city in cities"/)
    expect(cities).toMatch(/:to="`\/\$\{city\.id\}`"/)
    expect(cities).not.toMatch(/\.slice\(/)
  })
})

describe('Cities — SCEN-CITIES-02: heading refleja el count vivo', () => {
  it('usa useCityCount() y lo muestra en el heading', () => {
    expect(cities).toMatch(/useCityCount\(\)/)
    expect(cities).toMatch(/Presentes en más de \{\{\s*cityCount\s*\}\} Ciudades/)
  })
})

describe('Cities — SCEN-CITIES-03: mosaico con las fotos disponibles (estático)', () => {
  it('FEATURED define las 4 ciudades con foto real', () => {
    for (const id of ['bogota', 'medellin', 'cali', 'cartagena']) {
      expect(cities).toContain(`'${id}'`)
    }
    expect(cities).toContain('/images/cities/')
  })

  it('el mosaico renderiza un NuxtImg por ciudad featured', () => {
    expect(cities).toMatch(/v-for="\(city, i\) in featuredCities"/)
    expect(cities).toMatch(/<NuxtImg\b/)
  })
})

describe('Cities — SCEN-CITIES-04: listado tipográfico, no bloques de color', () => {
  it('el listado usa un ícono de pin por ciudad', () => {
    expect(cities).toMatch(/i-lucide-map-pin/)
  })

  it('NO reintroduce el tile-nombre naranja rechazado', () => {
    expect(cities).not.toMatch(/bg-linear-to-br from-brand-500 to-brand-700/)
  })
})

describe('Cities — SCEN-CITIES-05: sin marquesina ni auto-scroll', () => {
  it('no hay lanes animadas, keyframes, ni pausa de animación', () => {
    expect(cities).not.toMatch(/cities-lane/)
    expect(cities).not.toMatch(/@keyframes/)
    expect(cities).not.toMatch(/animation-play-state/)
  })

  it('no duplica tiles para un loop (cada ciudad una sola vez)', () => {
    expect(cities).not.toMatch(/\[\.\.\./)
  })
})

describe('Cities — SCEN-CITIES-06: sin ciudades inventadas', () => {
  it('featuredCities es la intersección de FEATURED con las ciudades activas', () => {
    expect(cities).toMatch(/FEATURED\.flatMap/)
    expect(cities).toMatch(/cities\.value\.find/)
  })
})

describe('Cities — SCEN-CITIES-07: invariantes de reskin intactos', () => {
  it('no usa el alias roto v3 bg-gradient-to-', () => {
    expect(cities).not.toMatch(/bg-gradient-to-/)
  })

  it('no contiene el literal "Alquilame"', () => {
    expect(cities).not.toMatch(/Alquilame/i)
  })

  it('no usa clases red-N de Tailwind', () => {
    expect(cities).not.toMatch(/\b(bg|text|border|from|to|via|ring|shadow|fill)-red-\d/)
  })

  it('el heading adopta una utilidad de marca (.heading-* o font-heading)', () => {
    expect(cities).toMatch(/heading-(hero|page|section|card|sub|label)|font-heading/)
  })
})
