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

import { getCityPageTitle, truncateForSEO, useCityPageSEO } from '../useCityPageSEO'

let seoMeta: Record<string, unknown> = {}
let head: Record<string, unknown> = {}

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
  vi.stubGlobal('useHead', (value: Record<string, unknown>) => {
    head = { ...head, ...value }
  })
}

beforeEach(() => {
  seoMeta = {}
  head = {}
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

describe('useCityPageSEO content hygiene (F5/F9)', () => {
  it('uses a short bare city title without an unsupported numeric price', () => {
    stub()
    useCityPageSEO()

    expect(head.title).toBe('Alquiler de carros en Bogotá')
    expect(String(head.title)).not.toMatch(/\$|\|\s*Alquilatucarro/i)
    expect(`${head.title} | Alquilatucarro`).toHaveLength(45)
  })

  it('keeps the complete description, including ellipsis, within its budget', () => {
    const input = 'Una descripción factual de ciudad '.repeat(10)
    const description = truncateForSEO(input, 155)

    expect(description.length).toBeLessThanOrEqual(155)
    expect(description).toMatch(/\.\.\.$/)
    expect(description.at(-4)).not.toBe(' ')
  })

  it('keeps every city title within 60 characters after the longest brand suffix', () => {
    const cityNames = [
      'Armenia', 'Barranquilla', 'Bogotá', 'Bucaramanga', 'Cali', 'Cartagena',
      'Cúcuta', 'Floridablanca', 'Ibagué', 'Manizales', 'Medellín', 'Montería',
      'Neiva', 'Palmira', 'Pereira', 'Santa Marta', 'Soledad', 'Valledupar',
      'Villavicencio',
    ]

    for (const cityName of cityNames) {
      expect(`${getCityPageTitle(cityName)} | Alquilatucarro`.length).toBeLessThanOrEqual(60)
    }
  })
})
