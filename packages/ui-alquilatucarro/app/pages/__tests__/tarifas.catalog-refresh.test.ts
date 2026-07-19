// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import type ReservasApiData from '@rentacar-main/logic/utils/types/data/ReservasApiData'
import type CategoryData from '@rentacar-main/logic/utils/types/data/CategoryData'
import type { CategoryType } from '@rentacar-main/logic/utils/types/type/CategoryType'
import TarifasPage from '../tarifas.vue'

const ONE_HOUR_MS = 60 * 60 * 1000

function categoryWithMonthlyPrice(monthly: number): CategoryData {
  return {
    id: 'C' as CategoryType,
    identification: 'C' as CategoryType,
    name: 'Gama C',
    category: 'Gama C Económico Mecánico',
    description: '',
    image: '',
    ad: '',
    models: [],
    month_prices: [{
      '1k_kms': monthly,
      '2k_kms': monthly + 100_000,
      '3k_kms': 0,
      init_date: '2026-01-01',
      end_date: '2026-12-31',
      total_insurance_price: 0,
      one_day_price: 0,
      status: 'active',
    }],
    total_coverage_unit_charge: 0,
    extra_km_charge: 700,
  }
}

function catalog(monthly: number, catalogFetchedAt: number): ReservasApiData {
  return {
    catalogFetchedAt,
    categories: [categoryWithMonthlyPrice(monthly)],
    branches: [],
    extras: undefined,
    vehicleCategories: {},
    cities: [],
    franchiseTestimonials: {},
    faqs: [],
  }
}

describe('/tarifas mounted catalog refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-18T20:00:00Z'))
    vi.resetModules()
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('defineNuxtPlugin', (plugin: unknown) => plugin)
    vi.stubGlobal('useAppConfig', () => ({
      franchise: { website: 'https://alquilatucarro.com' },
    }))
    vi.stubGlobal('useHead', vi.fn())
    vi.stubGlobal('useSeoMeta', vi.fn())
  })

  afterEach(() => {
    window.dispatchEvent(new Event('pagehide'))
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('re-renders the visible monthly price when an expired catalog is refreshed', async () => {
    const stale = catalog(3_806_000, Date.now())
    const fresh = catalog(8_765_000, Date.now() + ONE_HOUR_MS)
    const catalogState = ref<ReservasApiData | null>(stale)
    const fetchSpy = vi.fn(async () => fresh)
    vi.stubGlobal('useState', () => catalogState)
    vi.stubGlobal('useAsyncData', vi.fn())
    vi.stubGlobal('$fetch', fetchSpy)

    let mountedHook: (() => void) | undefined
    const nuxtApp = {
      hook: vi.fn((name: string, callback: () => void) => {
        if (name === 'app:mounted') mountedHook = callback
      }),
    }
    const plugin = (await import('../../../../logic/plugins/rentacar-data')).default as unknown as
      (app: typeof nuxtApp) => Promise<void>
    await plugin(nuxtApp)

    const wrapper = mount(TarifasPage, {
      global: {
        stubs: {
          NuxtImg: true,
          SelectBranch: true,
          UAccordion: true,
          UModal: true,
        },
      },
    })

    expect(wrapper.text()).toContain('$ 3.806.000 /mes')
    expect(wrapper.text()).not.toContain('$ 8.765.000 /mes')

    mountedHook?.()
    await vi.advanceTimersByTimeAsync(ONE_HOUR_MS)
    await nextTick()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(catalogState.value).toStrictEqual(fresh)
    expect(wrapper.text()).not.toContain('$ 3.806.000 /mes')
    expect(wrapper.text()).toContain('$ 8.765.000 /mes')

    wrapper.unmount()
  })
})
