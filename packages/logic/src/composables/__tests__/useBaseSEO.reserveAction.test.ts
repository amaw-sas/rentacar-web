import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBaseSEO } from '../useBaseSEO'

// Holdout for issue #116: the AutoRental's ReserveAction must expose, alongside
// the existing web EntryPoint (#64), a PROGRAMMATIC EntryPoint pointing at the
// dashboard's public reservations API plus an actionApplication resolvable to
// the public OpenAPI (D2). schema.org/JSON-LD is observed via the useSchemaOrg
// emitter; auto-imported Nuxt globals are stubbed. See
// docs/specs/2026-06-16-issue-116-reserveaction-actionapplication/scenarios.

const API_BASE = 'https://api.example.test'

let capturedSchemas: any[] = []

const stub = (website: string, apiBase: string = API_BASE) => {
  vi.stubGlobal('useAppConfig', () => ({
    franchise: {
      name: 'Brand A',
      title: 'Brand A',
      shortname: 'A',
      description: 'desc',
      logo: '/logo.png',
      phone: '123',
      email: 'a@a.co',
      website,
      socialmedia: [],
    },
    organization: { name: 'AMAW SAS', logo: '/o.png', brand: 'Brand A', otherbrands: [] },
  }))
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { rentacarPublicApiBase: apiBase } }))
  vi.stubGlobal('useRoute', () => ({ path: '/' }))
  vi.stubGlobal('useSeoMeta', () => {})
  vi.stubGlobal('useHead', () => {})
  // nuxt-schema-org define* helpers: pass-through so the AutoRental literal is
  // captured intact alongside them.
  vi.stubGlobal('defineWebSite', (o: any) => ({ '@type': 'WebSite', ...o }))
  vi.stubGlobal('defineWebPage', (o: any) => ({ '@type': 'WebPage', ...o }))
  vi.stubGlobal('defineOrganization', (o: any) => ({ '@type': 'Organization', ...o }))
  vi.stubGlobal('useSchemaOrg', (schemas: any[]) => {
    capturedSchemas = schemas
  })
}

const autoRentalOf = (schemas: any[]) =>
  schemas.find((s) => s?.['@type'] === 'AutoRental')

const entryPoints = (schemas: any[]): any[] => {
  const target = autoRentalOf(schemas)?.potentialAction?.target
  return Array.isArray(target) ? target : [target]
}

beforeEach(() => {
  capturedSchemas = []
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useBaseSEO ReserveAction (issue #116)', () => {
  // SCEN-116-001: the #64 web EntryPoint survives, result preserved
  it('keeps the web EntryPoint (franchise.website + desktop/mobile) and RentalCarReservation result', () => {
    stub('https://brand-a.example')
    useBaseSEO()
    const action = autoRentalOf(capturedSchemas)?.potentialAction
    const web = entryPoints(capturedSchemas).find(
      (e) => e.urlTemplate === 'https://brand-a.example',
    )
    expect(web).toBeTruthy()
    expect(web.actionPlatform).toContain('https://schema.org/DesktopWebPlatform')
    expect(web.actionPlatform).toContain('https://schema.org/MobileWebPlatform')
    expect(action.result['@type']).toBe('RentalCarReservation')
  })

  // SCEN-116-002: a second, programmatic EntryPoint with HTTP method + JSON
  it('adds a programmatic POST EntryPoint to the public reservations API', () => {
    stub('https://brand-a.example')
    useBaseSEO()
    const eps = entryPoints(capturedSchemas)
    expect(eps).toHaveLength(2)
    const api = eps.find((e) => e.httpMethod === 'POST')
    expect(api).toBeTruthy()
    expect(api.urlTemplate).toBe(`${API_BASE}/api/reservations`)
    expect(api.contentType).toBe('application/json')
    expect(api.encodingType).toBe('application/json')
  })

  // SCEN-116-003: actionApplication resolves to the public OpenAPI
  it('exposes an actionApplication SoftwareApplication pointing at the OpenAPI', () => {
    stub('https://brand-a.example')
    useBaseSEO()
    const api = entryPoints(capturedSchemas).find((e) => e.httpMethod === 'POST')
    const app = api.actionApplication
    expect(app['@type']).toBe('SoftwareApplication')
    expect(app.url).toBe(`${API_BASE}/api/openapi`)
    expect(app.name).toBeTruthy()
    expect(app.applicationCategory).toBeTruthy()
    // honest modeling: actionApplication is a SoftwareApplication, never a WebAPI
    expect(app['@type']).not.toBe('WebAPI')
  })

  // Hardening (edge-case-detector): a trailing slash in the configured base must
  // not produce double-slash URLs in the emitted JSON-LD.
  it('normalizes a trailing slash in the API base (no // in URLs)', () => {
    stub('https://brand-a.example', 'https://api.example.test/')
    useBaseSEO()
    const api = entryPoints(capturedSchemas).find((e) => e.httpMethod === 'POST')
    expect(api.urlTemplate).toBe('https://api.example.test/api/reservations')
    expect(api.actionApplication.url).toBe('https://api.example.test/api/openapi')
  })

  // Hardening (edge-case-detector): a missing/empty API base (e.g. a brand that
  // doesn't inherit the layer default, or an empty NUXT_PUBLIC_* override) must
  // fail soft — emit ONLY the web EntryPoint (#64 behavior), never a URL with the
  // literal "undefined" or a host-less root-relative path.
  it('fails soft to web-only EntryPoint when the API base is empty', () => {
    stub('https://brand-a.example', '')
    useBaseSEO()
    const eps = entryPoints(capturedSchemas)
    expect(eps).toHaveLength(1)
    expect(eps[0].urlTemplate).toBe('https://brand-a.example')
    expect(eps.some((e) => e.httpMethod === 'POST')).toBe(false)
    expect(JSON.stringify(capturedSchemas)).not.toContain('undefined/api')
  })

  // SCEN-116-005: brand-agnostic — API base is identical regardless of brand,
  // while the web EntryPoint stays the brand's own domain
  it('uses the same API base across brands while the web EntryPoint differs', () => {
    stub('https://brand-a.example')
    useBaseSEO()
    const apiA = entryPoints(capturedSchemas).find((e) => e.httpMethod === 'POST')
    const webA = entryPoints(capturedSchemas).find((e) => e.urlTemplate === 'https://brand-a.example')

    vi.unstubAllGlobals()
    stub('https://brand-b.example')
    useBaseSEO()
    const apiB = entryPoints(capturedSchemas).find((e) => e.httpMethod === 'POST')
    const webB = entryPoints(capturedSchemas).find((e) => e.urlTemplate === 'https://brand-b.example')

    expect(apiA.urlTemplate).toBe(apiB.urlTemplate)
    expect(apiA.actionApplication.url).toBe(apiB.actionApplication.url)
    expect(webA).toBeTruthy()
    expect(webB).toBeTruthy()
    expect(webA.urlTemplate).not.toBe(webB.urlTemplate)
  })
})
