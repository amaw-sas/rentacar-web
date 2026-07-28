import { describe, expect, it } from 'vitest'
import type { ContentBrand } from '../trailingSlashRedirect'
import { countAuthoringBrandMentions, replaceBrandToken } from '../brandContent'
import { EDITORIAL_REWRITES } from '../../../../../scripts/blogEditorialFixes'

/**
 * Fixtures are the real published sentences that were stored in Supabase
 * `blog_posts` (issue #362). The 16 articles were authored for Alquilatucarro
 * and seeded verbatim to all three brands, so alquicarros and alquilame each
 * published six sentences naming their sister brand.
 *
 * That provenance is asserted below against `EDITORIAL_REWRITES`, not just
 * claimed here — an earlier revision of this file drifted from the stored copy
 * ("las mejores tarifas" for "las mejores opciones") while still advertising
 * itself as the source of truth.
 */
const LEAKED_SENTENCES = [
  'En **Alquilatucarro** tenemos sedes en las tres ciudades principales de la ruta:',
  '**Importante:** Estos precios son referenciales y varían según la ciudad, temporada y empresa de alquiler. En Alquilatucarro comparamos múltiples proveedores para mostrarte las mejores opciones.',
  'No te quedes con la primera cotización. En Alquilatucarro mostramos opciones de múltiples proveedores en una sola búsqueda.',
  'En Alquilatucarro tenemos todos los tipos de vehículos que necesitas, disponibles en **19 ciudades de Colombia**. Sin anticipos, sin trámites complicados, con la mejor atención.',
  'Sí, en Alquilatucarro ofrecemos sillas de bebé como accesorio adicional. Solicítala al momento de reservar para garantizar disponibilidad.',
  '**Multa por kit incompleto:** Hasta $500.000 COP. Todos los vehículos de alquiler de Alquilatucarro incluyen kit de carretera completo.',
] as const

/**
 * "Alquila tu carro" is ordinary Spanish for "rent your car", not a brand
 * mention. These four occurrences are legitimate on every brand and a naive
 * find-and-replace would corrupt them into "Alquicarros hoy."
 */
const GENERIC_PHRASES = [
  'Itinerarios de 3, 5 y 7 días por Pereira, Armenia y Manizales. Alquila tu carro hoy.',
  '## Alquila tu Carro para la Costa Caribe',
  '¿Listo para tu aventura cafetera? Alquila tu carro en [Pereira](/pereira), [Armenia](/armenia) o [Manizales](/manizales).',
  'ALQUILA TU CARRO SIN COMPLICACIONES',
] as const

const SECONDARY_BRANDS = [
  ['alquicarros', 'Alquicarros'],
  ['alquilame', 'Alquilame'],
] as const satisfies ReadonlyArray<readonly [ContentBrand, string]>

describe('fixture provenance', () => {
  it('uses the exact sentences the migration table rewrites', () => {
    expect([...LEAKED_SENTENCES].sort()).toEqual(
      EDITORIAL_REWRITES.map(({ from }) => from).sort(),
    )
  })
})

describe('replaceBrandToken', () => {
  describe.each(SECONDARY_BRANDS)('for brand %s', (brand, displayName) => {
    it.each(LEAKED_SENTENCES)('rewrites the sister-brand token in %#', (sentence) => {
      const result = replaceBrandToken(sentence, brand)

      expect(result).not.toMatch(/Alquilatucarro/i)
      expect(result).toContain(displayName)
    })

    it('changes nothing but the token itself', () => {
      const sentence = LEAKED_SENTENCES[0]

      expect(replaceBrandToken(sentence, brand)).toBe(
        sentence.replace('Alquilatucarro', displayName),
      )
    })

    it('preserves the surrounding markdown bold delimiters', () => {
      expect(replaceBrandToken('En **Alquilatucarro** tenemos sedes', brand)).toBe(
        `En **${displayName}** tenemos sedes`,
      )
    })

    it.each(GENERIC_PHRASES)('leaves the generic phrase untouched in %#', (phrase) => {
      expect(replaceBrandToken(phrase, brand)).toBe(phrase)
    })

    it('does not rewrite the token inside a domain name', () => {
      const withDomain = 'Escríbenos a contacto@alquilatucarro.com o visita https://alquilatucarro.com/blog'

      expect(replaceBrandToken(withDomain, brand)).toBe(withDomain)
    })

    /** Rewriting a path segment turns a working link or asset into a 404. */
    it.each([
      'Mira /img/alquilatucarro/logo.png para el recurso',
      'Perfil en https://www.instagram.com/alquilatucarro/ actualizado',
      'La ruta /blog/alquilatucarro sigue viva',
      'Escribe a soporte@alquilatucarro.co hoy',
    ])('does not rewrite the token inside a URL path or handle: %s', (text) => {
      expect(replaceBrandToken(text, brand)).toBe(text)
    })

    it('is idempotent', () => {
      const once = replaceBrandToken(LEAKED_SENTENCES[1], brand)

      expect(replaceBrandToken(once, brand)).toBe(once)
    })

    it('rewrites every occurrence, not just the first', () => {
      const twice = 'En Alquilatucarro comparamos. En Alquilatucarro mostramos.'

      expect(replaceBrandToken(twice, brand)).toBe(
        `En ${displayName} comparamos. En ${displayName} mostramos.`,
      )
    })

    it('normalizes casing variants to the canonical display name', () => {
      expect(replaceBrandToken('en ALQUILATUCARRO confiamos', brand)).toBe(
        `en ${displayName} confiamos`,
      )
    })

    it('returns an empty string unchanged', () => {
      expect(replaceBrandToken('', brand)).toBe('')
    })
  })

  it('leaves the authoring brand byte-identical', () => {
    for (const sentence of [...LEAKED_SENTENCES, ...GENERIC_PHRASES]) {
      expect(replaceBrandToken(sentence, 'alquilatucarro')).toBe(sentence)
    }
  })
})

describe('countAuthoringBrandMentions', () => {
  it('counts every occurrence of the authoring brand', () => {
    expect(countAuthoringBrandMentions('En Alquilatucarro comparamos. En Alquilatucarro mostramos.')).toBe(2)
  })

  it('reports zero once the text has been rewritten', () => {
    for (const brand of ['alquicarros', 'alquilame'] as const) {
      for (const sentence of LEAKED_SENTENCES) {
        expect(countAuthoringBrandMentions(replaceBrandToken(sentence, brand))).toBe(0)
      }
    }
  })

  it('does not count the generic phrase as a mention', () => {
    for (const phrase of GENERIC_PHRASES) {
      expect(countAuthoringBrandMentions(phrase)).toBe(0)
    }
  })

  it('does not count a domain as a mention', () => {
    expect(countAuthoringBrandMentions('Visita https://alquilatucarro.com/blog')).toBe(0)
  })

  /**
   * Brand-agnostic on purpose: after the neutral rewrites no article names a
   * franchise, so an Alquilatucarro mention is a finding on Alquilatucarro too.
   */
  it('flags the authoring brand against its own name as well', () => {
    expect(countAuthoringBrandMentions(LEAKED_SENTENCES[0])).toBe(1)
  })
})
