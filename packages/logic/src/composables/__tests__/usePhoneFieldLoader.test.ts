// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, watch, type Component } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Scenarios: docs/specs/2026-10-04-telefono-pais-visitante/scenarios/phone-country.scenarios.md
//   SCEN-006 unknown/missing visitor country → CO
//   SCEN-007 the flag stored in the form wins over the visitor country
//   SCEN-008 the field appears only once component, validator and country are
//            all settled, with the country already decided (never changes after)
// Review fixes: a failed load is reported (phoneLoadFailed) so the form can offer
// a reload, and a flag change notifies the form so a stale error is re-checked.

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let validator: Deferred<void>
let visitor: Deferred<string | null>

const setActivePhoneCountry = vi.fn()
vi.mock('../../utils/validation/phoneValidator', () => ({
  loadPhoneValidator: () => validator.promise,
  setActivePhoneCountry: (iso2: string | null) => setActivePhoneCountry(iso2),
}))
vi.mock('../../utils/fetchVisitorCountry', () => ({
  fetchVisitorCountry: () => visitor.promise,
}))

// Imported AFTER vi.mock so the mocked loaders are bound.
import usePhoneFieldLoader from '../usePhoneFieldLoader'
import useStoreReservationForm from '../../stores/useStoreReservationForm'

const FakeTel = {
  name: 'FakeTel',
  props: {
    allCountries: {
      default: () => [{ iso2: 'CO' }, { iso2: 'US' }, { iso2: 'ES' }],
    },
  },
  render: () => null,
} as unknown as Component

type Loader = ReturnType<typeof usePhoneFieldLoader>

function mountHost(
  importComponent: () => Promise<Component>,
  options?: Parameters<typeof usePhoneFieldLoader>[1],
) {
  const out: { api?: Loader; countryWhenShown?: string } = {}
  const Host = defineComponent({
    setup() {
      const api = usePhoneFieldLoader(importComponent, options)
      out.api = api
      watch(api.phoneComponent, (component) => {
        if (component) out.countryWhenShown = api.phoneInitialCountry.value
      }, { flush: 'sync' })
      return () => h('div')
    },
  })
  const wrapper = mount(Host)
  return { wrapper, out }
}

describe('usePhoneFieldLoader', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    validator = deferred()
    visitor = deferred<string | null>()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('starts with no component and CO as the initial country', () => {
    const { out } = mountHost(() => new Promise(() => {}))
    expect(out.api!.phoneComponent.value).toBeNull()
    expect(out.api!.phoneInitialCountry.value).toBe('CO')
  })

  it('stays hidden while the country is pending, even if component and validator resolved (SCEN-008)', async () => {
    const { out } = mountHost(() => Promise.resolve(FakeTel))
    validator.resolve()
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBeNull()

    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBe(FakeTel)
    expect(out.countryWhenShown).toBe('US')
  })

  it('stays hidden while the validator is pending (SCEN-008)', async () => {
    const { out } = mountHost(() => Promise.resolve(FakeTel))
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBeNull()

    validator.resolve()
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBe(FakeTel)
  })

  it('stays hidden while the component import is pending (SCEN-008)', async () => {
    const component = deferred<Component>()
    const { out } = mountHost(() => component.promise)
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBeNull()

    component.resolve(FakeTel)
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBe(FakeTel)
    expect(out.countryWhenShown).toBe('US')
  })

  it('keeps the stored flag over the visitor country (SCEN-007)', async () => {
    useStoreReservationForm().telefonoPais = 'CO'
    const { out } = mountHost(() => Promise.resolve(FakeTel))
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(out.countryWhenShown).toBe('CO')
  })

  it('falls back to CO when the visitor country is unknown (SCEN-006)', async () => {
    const { out } = mountHost(() => Promise.resolve(FakeTel))
    validator.resolve()
    visitor.resolve(null)
    await flushPromises()
    expect(out.countryWhenShown).toBe('CO')
  })

  it('falls back to CO when the visitor country is not offered by the input (SCEN-006)', async () => {
    const { out } = mountHost(() => Promise.resolve(FakeTel))
    validator.resolve()
    visitor.resolve('ZZ')
    await flushPromises()
    expect(out.countryWhenShown).toBe('CO')
  })

  it('falls back to CO when the component exposes no country list', async () => {
    const Bare = { name: 'Bare', render: () => null } as unknown as Component
    const { out } = mountHost(() => Promise.resolve(Bare))
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBe(Bare)
    expect(out.countryWhenShown).toBe('CO')
  })

  it('writes the chosen flag, upper-cased, to the store', () => {
    const { out } = mountHost(() => new Promise(() => {}))
    out.api!.onPhoneCountryChanged({ iso2: 'us' })
    expect(useStoreReservationForm().telefonoPais).toBe('US')
  })

  it('tells the validator which flag is on screen, so raw digits get the right message', () => {
    setActivePhoneCountry.mockClear()
    const { out } = mountHost(() => new Promise(() => {}))
    out.api!.onPhoneCountryChanged({ iso2: 'us' })
    expect(setActivePhoneCountry).toHaveBeenLastCalledWith('US')
  })

  it('ignores a country change without iso2', () => {
    const { out } = mountHost(() => new Promise(() => {}))
    out.api!.onPhoneCountryChanged({})
    expect(useStoreReservationForm().telefonoPais).toBeNull()
  })

  it('stays hidden and silent when the component import fails; a remount retries', async () => {
    const first = mountHost(() => Promise.reject(new Error('chunk failed')))
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(first.out.api!.phoneComponent.value).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    first.wrapper.unmount()

    const second = mountHost(() => Promise.resolve(FakeTel))
    await flushPromises()
    expect(second.out.api!.phoneComponent.value).toBe(FakeTel)
    expect(second.out.countryWhenShown).toBe('US')
  })

  it('stays hidden and silent when the validator fails; a remount retries', async () => {
    const first = mountHost(() => Promise.resolve(FakeTel))
    validator.reject(new Error('metadata failed'))
    visitor.resolve('US')
    await flushPromises()
    expect(first.out.api!.phoneComponent.value).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    first.wrapper.unmount()

    validator = deferred()
    const second = mountHost(() => Promise.resolve(FakeTel))
    validator.resolve()
    await flushPromises()
    expect(second.out.api!.phoneComponent.value).toBe(FakeTel)
  })

  it('reports no load failure while loading or once the field is shown', async () => {
    const { out } = mountHost(() => Promise.resolve(FakeTel))
    expect(out.api!.phoneLoadFailed.value).toBe(false)
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBe(FakeTel)
    expect(out.api!.phoneLoadFailed.value).toBe(false)
  })

  it('reports a load failure, silently, when the component import fails', async () => {
    const { out } = mountHost(() => Promise.reject(new Error('chunk failed')))
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneLoadFailed.value).toBe(true)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('reports a load failure, silently, when the validator fails', async () => {
    const { out } = mountHost(() => Promise.resolve(FakeTel))
    validator.reject(new Error('metadata failed'))
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneLoadFailed.value).toBe(true)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('reports the failure without waiting for the visitor country', async () => {
    const { out } = mountHost(() => Promise.reject(new Error('chunk failed')))
    validator.resolve()
    await flushPromises()
    expect(out.api!.phoneLoadFailed.value).toBe(true)
  })

  it('reports nothing when unmounted before a failure settles', async () => {
    const { wrapper, out } = mountHost(() => Promise.reject(new Error('chunk failed')))
    wrapper.unmount()
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneLoadFailed.value).toBe(false)
  })

  it('calls onCountryChanged after the store and the validator know the new flag', () => {
    setActivePhoneCountry.mockClear()
    const seen: Array<{ stored: string | null; active: unknown }> = []
    const onCountryChanged = vi.fn(() => {
      seen.push({
        stored: useStoreReservationForm().telefonoPais,
        active: setActivePhoneCountry.mock.lastCall?.[0],
      })
    })
    const { out } = mountHost(() => new Promise(() => {}), { onCountryChanged })
    out.api!.onPhoneCountryChanged({ iso2: 'us' })
    expect(onCountryChanged).toHaveBeenCalledTimes(1)
    expect(seen).toEqual([{ stored: 'US', active: 'US' }])
  })

  it('does not call onCountryChanged for a change without iso2', () => {
    const onCountryChanged = vi.fn()
    const { out } = mountHost(() => new Promise(() => {}), { onCountryChanged })
    out.api!.onPhoneCountryChanged({})
    expect(onCountryChanged).not.toHaveBeenCalled()
  })

  it('handles a flag change without an onCountryChanged option', () => {
    const { out } = mountHost(() => new Promise(() => {}))
    expect(() => out.api!.onPhoneCountryChanged({ iso2: 'es' })).not.toThrow()
    expect(useStoreReservationForm().telefonoPais).toBe('ES')
  })

  it('sets nothing when unmounted before everything settles', async () => {
    const { wrapper, out } = mountHost(() => Promise.resolve(FakeTel))
    wrapper.unmount()
    validator.resolve()
    visitor.resolve('US')
    await flushPromises()
    expect(out.api!.phoneComponent.value).toBeNull()
    expect(out.api!.phoneInitialCountry.value).toBe('CO')
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
