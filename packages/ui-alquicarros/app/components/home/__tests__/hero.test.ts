/**
 * Hero split del index de alquicarros — guardas del contrato en
 * docs/specs/alquicarros-hero-split/scenarios/.
 *
 * El hero es estático por decisión del dueño (2026-08-11): sin consultas a
 * Supabase, con el precio y el conteo de ciudades escritos en el código. Eso
 * traslada el riesgo del runtime al mantenimiento, así que lo que guardan estos
 * tests es justo eso:
 *
 *   - que el precio mostrado siga siendo la mensualidad / 30 (SCEN-002),
 *   - que nadie reintroduzca un composable de datos en el hero (SCEN-003),
 *   - que los chips sean los cuatro aprobados y "Km ilimitado" no vuelva,
 *     porque contradice al plan mensual que se está cotizando (SCEN-005),
 *   - que el fondo siga siendo la foto y no el degradado naranja (SCEN-001).
 *
 * La deriva contra los datos REALES no se puede comprobar sin red, así que no
 * vive aquí: `node scripts/check-hero-pricing.mjs` la comprueba a mano.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquicarros
const hero = readFileSync(join(ROOT, 'app/components/home/Hero.vue'), 'utf-8')

/**
 * El mismo source sin comentarios. Las guardas en negativo ("no invoca X", "no
 * promete Y") tienen que mirar el código: el comentario que explica POR QUÉ no
 * se usa `useCityCount()` no es una llamada a `useCityCount()`.
 */
const heroCode = hero
  .replace(/<!--[\s\S]*?-->/g, '') // comentarios de plantilla
  .replace(/\/\*[\s\S]*?\*\//g, '') // bloques JSDoc
  .replace(/^\s*\/\/.*$/gm, '') // líneas //

/** Lee una constante numérica declarada con separadores `_` en el <script setup>. */
function readNumericConst(name: string): number {
  const digits = hero.match(new RegExp(`const ${name} = ([\\d_]+)`))?.[1]
  if (!digits) throw new Error(`Hero.vue ya no declara la constante ${name}`)
  return Number(digits.replace(/_/g, ''))
}

describe('SCEN-002 — el precio del hero es la mensualidad más barata dividida entre 30', () => {
  const monthly = readNumericConst('MONTHLY_1K_KMS_COP')
  const planDays = readNumericConst('MONTHLY_PLAN_DAYS')

  it('congela la mensualidad leída de category_pricing el 2026-08-11', () => {
    // Regla de Fleet.vue (pickRepresentativeMonthlyPrice): la 1k_kms activa
    // positiva más barata de la Gama C.
    expect(monthly).toBe(3_806_000)
  })

  it('el plan mensual son 30 días', () => {
    expect(planDays).toBe(30)
  })

  it('renderiza $126.867/día — redondeado al alza para no anunciar de menos', () => {
    const expected = Math.ceil(monthly / planDays) // 126.866,67 → 126.867
    expect(expected).toBe(126_867)
    expect(hero).toMatch(/Math\.ceil\(MONTHLY_1K_KMS_COP \/ MONTHLY_PLAN_DAYS\)/)
    expect(hero).toContain('{{ dailyPriceLabel }}/día')
  })

  it('deja visible que la tarifa diaria pertenece a un plan de 30 días', () => {
    expect(hero).toContain('tarifa diaria en plan de 30 días')
  })

  it('formatea los miles sin Intl, para que SSR y cliente coincidan', () => {
    expect(hero).not.toMatch(/Intl\.NumberFormat/)
  })
})

describe('SCEN-003 — el hero no consulta datos', () => {
  it('no invoca ningún composable de datos', () => {
    expect(heroCode).not.toMatch(/useCityCount\(/)
    expect(heroCode).not.toMatch(/useFetchRentacarData\(/)
    expect(heroCode).not.toMatch(/\$fetch|useFetch\(|useAsyncData\(/)
  })

  it('lleva el conteo de ciudades escrito en el código', () => {
    expect(readNumericConst('CITY_COUNT')).toBe(19)
  })
})

describe('SCEN-005 — los cuatro chips aprobados, sin "Km ilimitado"', () => {
  it('muestra exactamente los cuatro aprobados', () => {
    for (const chip of [
      'Paga al recoger',
      'Sin pago anticipado',
      'Cancelación gratis',
      'Vehículos nuevos',
    ]) {
      expect(hero).toContain(chip)
    }
  })

  it('no promete km ilimitado junto a un precio de plan mensual', () => {
    // El plan mensual trae 1.000 km/mes (FleetCard.vue). El satélite del que se
    // portó este hero pone el chip igualmente y se contradice.
    expect(heroCode).not.toMatch(/[Kk]m ilimitado|[Kk]ilometraje ilimitado/)
  })
})

describe('SCEN-001 — el fondo es la fotografía, no el degradado naranja', () => {
  it('pinta la foto de fondo a sangre', () => {
    expect(hero).toContain('/images/hero/carretera.webp')
    expect(hero).toMatch(/absolute inset-0[^"]*object-cover/)
  })

  it('ya no usa los tokens del degradado de marca como fondo del hero', () => {
    expect(hero).not.toMatch(/from-hero-from\s+to-hero-to/)
  })

  it('mantiene la foto de fondo como LCP', () => {
    expect(hero).toContain('preload')
    expect(hero).toContain('fetchpriority="high"')
  })

  it('sostiene el contraste con un overlay opaco, no con la suerte de la foto', () => {
    expect(hero).toMatch(/bg-linear-to-r from-black\/\d+/)
  })
})
