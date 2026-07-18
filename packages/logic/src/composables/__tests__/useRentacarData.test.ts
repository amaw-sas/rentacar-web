import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRentacarData } from '../useRentacarData'

const catalogPayload = {
  categories: [{ id: 'B' }],
  branches: [{ code: 'BOG-01' }],
  extras: { extraDriverDayPrice: 12_000 },
  vehicleCategories: { B: { modelos: [] } },
  cities: [{ id: 'bogota', name: 'Bogotá', description: '' }],
  franchiseTestimonials: { atc: [] },
  faqs: [{ label: 'Pregunta', content: 'Respuesta' }],
}

describe('useRentacarData', () => {
  const states = new Map<string, ReturnType<typeof ref>>()

  beforeEach(() => {
    states.clear()
    vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
      if (!states.has(key)) states.set(key, ref(init?.()))
      return states.get(key)
    })
    vi.stubGlobal('$fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses lazy SSR async data and fills the stable catalog state', async () => {
    let capturedOptions: Record<string, unknown> | undefined
    vi.stubGlobal('useAsyncData', vi.fn(async (_key, _handler, options) => {
      capturedOptions = options
      return { data: ref(catalogPayload), error: ref(null) }
    }))

    await useRentacarData()

    expect(capturedOptions).toMatchObject({ lazy: true, server: true, immediate: true })
    expect(states.get('rentacar-data')?.value).toEqual(catalogPayload)
    expect(states.get('rentacar-data-loaded')?.value).toBe(true)
  })

  it('does not schedule another request after the route catalog is loaded', async () => {
    states.set('rentacar-data-loaded', ref(true))
    const useAsyncData = vi.fn(async (_key, _handler, options) => ({
      data: ref(null),
      error: ref(null),
      options,
    }))
    vi.stubGlobal('useAsyncData', useAsyncData)

    await useRentacarData()

    expect(useAsyncData.mock.calls[0]?.[2]).toMatchObject({ immediate: false })
  })

  it('preserves the original fetch error as the thrown cause', async () => {
    const original = new Error('Supabase down')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('useAsyncData', vi.fn(async () => ({
      data: ref(null),
      error: ref(original),
    })))

    let captured: Error | undefined
    try {
      await useRentacarData()
    } catch (error) {
      captured = error as Error
    }

    expect(captured?.message).toMatch(/Failed to load reservation data/)
    expect(captured?.cause).toBe(original)
    expect(consoleSpy).toHaveBeenCalledWith('[rentacar-data] fetch failed:', original)
  })
})
