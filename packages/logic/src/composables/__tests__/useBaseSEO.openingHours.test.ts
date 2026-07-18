import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBaseSEO } from '../useBaseSEO'

// Issue #315 — the site-wide intermediary Service must NOT publish a hardcoded
// openingHoursSpecification. A single global business hours block (Mon–Fri
// 07:00–17:00, Sat 07:00–12:00) contradicts the real per-branch schedules
// (airports 06:00–22:00 + Sundays, 24h branches, branches closed some days),
// so Google was shown incorrect hours. The honest fix is to publish NO hours
// at the org level. The real per-branch source of truth lives in Supabase
// `locations.schedule` (contract v2, issue #47) and is NOT modeled here.
//
// Output-level assertion (not source): run useBaseSEO with Nuxt auto-imports
// stubbed and inspect the graph handed to useSchemaOrg — same convention as
// useBaseSEO.reserveAction.test.ts / seo-reserve-action.test.ts.

const FRANCHISE = {
  name: 'Marca Test',
  title: 'Marca Test — alquiler',
  shortname: 'MT',
  description: 'desc',
  website: 'https://marca.test',
  logo: 'https://marca.test/logo.png',
  phone: '+57 300',
  email: 'a@b.co',
  socialmedia: ['https://x.com/mt'],
}
const ORGANIZATION = { name: 'AMAW SAS', logo: 'l', brand: 'B', otherbrands: ['C'] }

let captured: any[] = []

beforeEach(() => {
  captured = []
  vi.stubGlobal('useAppConfig', () => ({ franchise: FRANCHISE, organization: ORGANIZATION }))
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { rentacarPublicApiBase: 'https://api.test' } }))
  vi.stubGlobal('useRoute', () => ({ path: '/' }))
  vi.stubGlobal('useSeoMeta', () => {})
  vi.stubGlobal('useHead', () => {})
  vi.stubGlobal('defineWebSite', (x: any) => ({ '@type': 'WebSite', ...x }))
  vi.stubGlobal('defineWebPage', (x: any) => ({ '@type': 'WebPage', ...x }))
  vi.stubGlobal('defineOrganization', (x: any) => ({ '@type': 'Organization', ...x }))
  vi.stubGlobal('useSchemaOrg', (graph: any[]) => { captured = graph })
})

afterEach(() => vi.unstubAllGlobals())

const serviceOf = (schemas: any[]) => schemas.find((s) => s?.['@type'] === 'Service')

describe('useBaseSEO opening hours (issue #315)', () => {
  // SCEN-315-001: the Service carries no hardcoded opening hours.
  it('emits a Service with no openingHoursSpecification', () => {
    useBaseSEO()
    const service = serviceOf(captured)
    expect(service).toBeTruthy()
    expect('openingHoursSpecification' in service).toBe(false)
    expect('hoursAvailable' in service).toBe(false)
  })

  // SCEN-315-001 (guard): the rest of the Service — identity + the #116
  // reserve action — must survive the hours removal untouched.
  it('keeps the Service identity and ReserveAction intact', () => {
    useBaseSEO()
    const service = serviceOf(captured)
    expect(service.url).toBe(FRANCHISE.website)
    expect(service.serviceType).toContain('Intermediación digital')
    expect(service.availableChannel.servicePhone.telephone).toBe(FRANCHISE.phone)
    expect(service.potentialAction?.['@type']).toBe('ReserveAction')
    expect(captured.some((node) => node?.['@type'] === 'AutoRental')).toBe(false)
  })
})
