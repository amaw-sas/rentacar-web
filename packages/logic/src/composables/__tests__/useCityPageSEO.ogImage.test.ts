import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Issue #49 holdout (SCEN-001 / SCEN-002): city landing pages were rendered
// with NO og:image / twitter:image — shared image-less on social. useCityPageSEO
// must emit a social share image pointing to the STABLE per-brand asset
// (franchise.ogImage), never a volatile Vercel Blob model image.
//
// Sub-composables are mocked to no-ops so we observe ONLY the og/twitter image
// meta this composable is responsible for. Auto-imported Nuxt globals are stubbed.

vi.mock('../useBaseSEO', () => ({ useBaseSEO: () => {} }))
vi.mock('../useBreadcrumbs', () => ({ useCityBreadcrumbs: () => {} }))
vi.mock('../useCityFAQs', () => ({ useCityFAQSchema: () => {} }))
vi.mock('../useData', () => ({
  useData: () => ({
    getCityById: (slug: string) => ({ name: 'Bogotá', description: `Alquiler en ${slug}` }),
  }),
}))

import { useCityPageSEO } from '../useCityPageSEO'

let seoMeta: Record<string, unknown> = {}

const stub = (ogImage = '/img/og-alquilatucarro.jpg') => {
  vi.stubGlobal('useAppConfig', () => ({
    franchise: {
      website: 'https://alquilatucarro.com',
      description: 'Alquiler de carros en Colombia',
      title: 'Alquilatucarro',
      ogImage,
    },
    organization: { brand: 'Alquilatucarro' },
  }))
  vi.stubGlobal('useRoute', () => ({ params: { city: 'bogota' }, path: '/bogota' }))
  vi.stubGlobal('useSeoMeta', (meta: Record<string, unknown>) => {
    seoMeta = { ...seoMeta, ...meta }
  })
  vi.stubGlobal('useHead', () => {})
}

beforeEach(() => {
  seoMeta = {}
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useCityPageSEO og:image (issue #49)', () => {
  // SCEN-001: city page emits a social share image
  it('sets both ogImage and twitterImage so the page is not shared image-less', () => {
    stub('/img/og-alquilatucarro.jpg')
    useCityPageSEO()
    expect(seoMeta.ogImage).toBe('/img/og-alquilatucarro.jpg')
    expect(seoMeta.twitterImage).toBe('/img/og-alquilatucarro.jpg')
  })

  // SCEN-002: the share image is the stable brand asset, never a Blob model image
  it('uses the per-brand franchise.ogImage, never a volatile Blob model image', () => {
    stub('/img/og-alquilame.jpg')
    useCityPageSEO()
    expect(seoMeta.ogImage).toBe('/img/og-alquilame.jpg')
    expect(seoMeta.twitterImage).toBe('/img/og-alquilame.jpg')
    expect(String(seoMeta.ogImage)).not.toContain('blob.vercel-storage.com')
    expect(String(seoMeta.twitterImage)).not.toContain('blob.vercel-storage.com')
  })
})
