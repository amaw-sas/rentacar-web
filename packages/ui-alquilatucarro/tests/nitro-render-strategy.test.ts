import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Issue #322 SCEN-322-N01/N02 — Nitro render-strategy coherence, 3 brands.
 *
 * N01: every route has ONE render strategy. Home + the 19 city landings must
 * live ONLY under routeRules `isr: 3600` and never in prerender.routes —
 * prerender wins over ISR, freezing prices/schedules at build time.
 *
 * N02: legacy redirects must use the object form `{ redirect: { to,
 * statusCode: 301 } }`. Nitro's NitroRouteConfig (nitropack 2.12.9) does not
 * read a sibling `statusCode` key next to a string `redirect` — that form is
 * silently ignored and serves 307.
 *
 * The configs are imported (not text-matched): routeRules are data.
 */

type RouteRule = Record<string, unknown> & {
  isr?: number | boolean
  redirect?: string | { to: string; statusCode?: number }
}

interface NuxtConfigShape {
  nitro?: {
    routeRules?: Record<string, RouteRule>
    prerender?: { routes?: string[] }
  }
}

const ISR_ONLY_ROUTES = [
  '/',
  '/armenia',
  '/barranquilla',
  '/bogota',
  '/bucaramanga',
  '/cali',
  '/cartagena',
  '/cucuta',
  '/ibague',
  '/manizales',
  '/medellin',
  '/monteria',
  '/neiva',
  '/pereira',
  '/santa-marta',
  '/valledupar',
  '/villavicencio',
  '/floridablanca',
  '/palmira',
  '/soledad',
]

const BRANDS = {
  'ui-alquilatucarro': () => import('../nuxt.config'),
  'ui-alquilame': () => import('../../ui-alquilame/nuxt.config'),
  'ui-alquicarros': () => import('../../ui-alquicarros/nuxt.config'),
} as const

const configs = {} as Record<keyof typeof BRANDS, NuxtConfigShape>

beforeAll(async () => {
  // nuxt.config.ts relies on Nuxt's auto-imported defineNuxtConfig; under
  // plain vitest we provide the identity so the config object can be imported.
  ;(globalThis as Record<string, unknown>).defineNuxtConfig = (c: unknown) => c
  for (const [brand, load] of Object.entries(BRANDS)) {
    configs[brand as keyof typeof BRANDS] = (await load()).default as NuxtConfigShape
  }
})

describe('SCEN-322-N01 — one render strategy per route (3 brands)', () => {
  for (const brand of Object.keys(BRANDS) as (keyof typeof BRANDS)[]) {
    it(`${brand}: home + 19 city landings are ISR-only (not prerendered)`, () => {
      const nitro = configs[brand].nitro
      const prerendered = nitro?.prerender?.routes ?? []
      const rules = nitro?.routeRules ?? {}

      for (const route of ISR_ONLY_ROUTES) {
        expect(prerendered, `${route} must not be prerendered`).not.toContain(route)
        expect(rules[route]?.isr, `${route} must keep isr: 3600`).toBe(3600)
      }
    })

    it(`${brand}: no route is both prerendered and ISR`, () => {
      const nitro = configs[brand].nitro
      const prerendered = new Set(nitro?.prerender?.routes ?? [])
      const overlap = Object.entries(nitro?.routeRules ?? {})
        .filter(([route, rule]) => rule.isr !== undefined && prerendered.has(route))
        .map(([route]) => route)
      expect(overlap).toEqual([])
    })

    it(`${brand}: static pages stay prerendered`, () => {
      const prerendered = configs[brand].nitro?.prerender?.routes ?? []
      expect(prerendered).toContain('/gana')
      expect(prerendered).toContain('/gana/terminos-condiciones')
      expect(prerendered).toContain('/gana/politicas-privacidad')
    })
  }
})

describe('SCEN-322-N02 — legacy redirects use the 301 object form Nitro reads', () => {
  const LEGACY_REDIRECTS: Record<string, string> = {
    '/gana/politicas-privacidad.html': '/gana/politicas-privacidad',
    '/tratamiento-datos-alquilatucarro.pdf': '/politica-privacidad',
    '/images/carros2.png': '/',
    '/imacion/ani2a.png': '/',
    '/-coche-en-espana/': '/',
  }

  it('ui-alquilatucarro: all 5 legacy redirects are { redirect: { to, statusCode: 301 } }', () => {
    const rules = configs['ui-alquilatucarro'].nitro?.routeRules ?? {}
    for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
      const rule = rules[from]
      expect(rule, `${from} rule missing`).toBeDefined()
      expect(rule!.redirect, `${from} must use the object redirect form`).toEqual({
        to,
        statusCode: 301,
      })
      // The old broken form put statusCode as a SIBLING of a string redirect;
      // Nitro ignores it and serves 307. Guard against regression.
      expect(rule!.statusCode, `${from} must not carry a sibling statusCode`).toBeUndefined()
    }
  })

  it('no brand declares a string redirect with a sibling statusCode (silently 307)', () => {
    for (const brand of Object.keys(BRANDS) as (keyof typeof BRANDS)[]) {
      const rules = configs[brand].nitro?.routeRules ?? {}
      const broken = Object.entries(rules)
        .filter(([, rule]) => typeof rule.redirect === 'string' && 'statusCode' in rule)
        .map(([route]) => route)
      expect(broken, `${brand} has sibling-statusCode redirects`).toEqual([])
    }
  })
})
