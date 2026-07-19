import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../useBaseSEO', () => ({ useBaseSEO: () => {} }))
vi.mock('../useBreadcrumbs', () => ({ useSearchBreadcrumbs: () => {} }))
vi.mock('../useData', () => ({
  useData: () => ({
    getCityById: () => ({ name: 'Bogotá', description: 'Capital de Colombia' }),
  }),
}))

import { useSearchPageSEO } from '../useSearchPageSEO'

let head: Record<string, unknown> = {}
let seoMeta: Record<string, unknown> = {}

beforeEach(() => {
  head = {}
  seoMeta = {}
  vi.stubGlobal('useAppConfig', () => ({
    franchise: {
      website: 'https://alquilatucarro.com',
      title: 'Alquiler de carros en Colombia',
    },
  }))
  vi.stubGlobal('useRoute', () => ({ params: { city: 'bogota' }, path: '/bogota/buscar-vehiculos' }))
  vi.stubGlobal('useHead', (value: Record<string, unknown>) => {
    head = { ...head, ...value }
  })
  vi.stubGlobal('useSeoMeta', (value: Record<string, unknown>) => {
    seoMeta = { ...seoMeta, ...value }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSearchPageSEO content hygiene (F5/F9)', () => {
  it('uses a bare title and a city-specific factual description', () => {
    useSearchPageSEO()

    expect(head.title).toBe('Buscar vehículos en Bogotá')
    expect(seoMeta.description).toContain('Bogotá')
    expect(String(seoMeta.description)).not.toMatch(/\$|USD|COP|desde\s+\d/i)
  })
})
