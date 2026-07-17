import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useBaseSEO } from '../useBaseSEO'

// Issue #315 — the org-level AutoRental must NOT publish a hardcoded
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

const autoRentalOf = (schemas: any[]) => schemas.find((s) => s?.['@type'] === 'AutoRental')

describe('useBaseSEO opening hours (issue #315)', () => {
  // SCEN-315-001: the AutoRental carries no hardcoded opening hours.
  it('emits an AutoRental with no openingHoursSpecification', () => {
    useBaseSEO()
    const autoRental = autoRentalOf(captured)
    expect(autoRental).toBeTruthy()
    expect('openingHoursSpecification' in autoRental).toBe(false)
  })

  // SCEN-315-001 (guard): the rest of the AutoRental — identity + the #116
  // reserve action — must survive the hours removal untouched.
  it('keeps the AutoRental identity and ReserveAction intact', () => {
    useBaseSEO()
    const autoRental = autoRentalOf(captured)
    expect(autoRental.url).toBe(FRANCHISE.website)
    expect(autoRental.name).toBe(FRANCHISE.name)
    expect(autoRental.telephone).toBe(FRANCHISE.phone)
    expect(autoRental.potentialAction?.['@type']).toBe('ReserveAction')
  })
})
