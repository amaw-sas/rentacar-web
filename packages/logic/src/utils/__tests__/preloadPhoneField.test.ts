// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// preloadPhoneField warms the three loads of the reservation phone field while
// the customer browses the results, so the field is ready when the form opens.

// The spies only count calls. The promises come from plain functions: vi.fn()
// subscribes to the promises it returns (mock.settledResults), which would hide
// an unhandled rejection from the test that looks for one.
const loadPhoneValidator = vi.fn()
const fetchVisitorCountry = vi.fn()
let validatorFailure: Error | null = null
vi.mock('../validation/phoneValidator', () => ({
  loadPhoneValidator: () => {
    loadPhoneValidator()
    return validatorFailure ? Promise.reject(validatorFailure) : Promise.resolve()
  },
}))
vi.mock('../fetchVisitorCountry', () => ({
  fetchVisitorCountry: () => fetchVisitorCountry(),
}))

type Preload = typeof import('../preloadPhoneField')['preloadPhoneField']

// The "once per page" flag lives in the module: a fresh module per test.
async function freshPreload(): Promise<Preload> {
  vi.resetModules()
  return (await import('../preloadPhoneField')).preloadPhoneField
}

describe('preloadPhoneField', () => {
  beforeEach(() => {
    loadPhoneValidator.mockReset()
    validatorFailure = null
    fetchVisitorCountry.mockReset().mockResolvedValue('US')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('schedules the three loads with requestIdleCallback when available', async () => {
    let idle: (() => void) | undefined
    const ric = vi.fn((cb: () => void) => {
      idle = cb
      return 1
    })
    vi.stubGlobal('requestIdleCallback', ric)
    const importComponent = vi.fn().mockResolvedValue({})
    const preload = await freshPreload()

    preload(importComponent)
    expect(ric).toHaveBeenCalledTimes(1)
    expect(importComponent).not.toHaveBeenCalled()

    idle!()
    expect(importComponent).toHaveBeenCalledTimes(1)
    expect(loadPhoneValidator).toHaveBeenCalledTimes(1)
    expect(fetchVisitorCountry).toHaveBeenCalledTimes(1)
  })

  it('falls back to a 1.5 s timeout without requestIdleCallback', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    const importComponent = vi.fn().mockResolvedValue({})
    const preload = await freshPreload()

    preload(importComponent)
    vi.advanceTimersByTime(1499)
    expect(importComponent).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(importComponent).toHaveBeenCalledTimes(1)
    expect(loadPhoneValidator).toHaveBeenCalledTimes(1)
    expect(fetchVisitorCountry).toHaveBeenCalledTimes(1)
  })

  it('runs once per page, however many times it is called', async () => {
    const ric = vi.fn((cb: () => void) => {
      cb()
      return 1
    })
    vi.stubGlobal('requestIdleCallback', ric)
    const importComponent = vi.fn().mockResolvedValue({})
    const preload = await freshPreload()

    preload(importComponent)
    preload(importComponent)
    preload(importComponent)
    expect(ric).toHaveBeenCalledTimes(1)
    expect(importComponent).toHaveBeenCalledTimes(1)
    expect(loadPhoneValidator).toHaveBeenCalledTimes(1)
  })

  it('does nothing without window (server render)', async () => {
    const ric = vi.fn()
    vi.stubGlobal('requestIdleCallback', ric)
    vi.stubGlobal('window', undefined)
    const importComponent = vi.fn().mockResolvedValue({})
    const preload = await freshPreload()

    preload(importComponent)
    expect(ric).not.toHaveBeenCalled()
    expect(importComponent).not.toHaveBeenCalled()
    expect(loadPhoneValidator).not.toHaveBeenCalled()
    expect(fetchVisitorCountry).not.toHaveBeenCalled()
  })

  it('swallows failed loads: no unhandled rejection, no console output', async () => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
        cb()
        return 1
      })
      validatorFailure = new Error('metadata failed')
      let imports = 0
      const importComponent = () => {
        imports++
        return Promise.reject(new Error('chunk failed'))
      }
      const preload = await freshPreload()

      preload(importComponent)
      // Two macrotasks: long enough for Node to flag an unhandled rejection.
      await new Promise((resolve) => setTimeout(resolve, 0))
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(imports).toBe(1)
      expect(loadPhoneValidator).toHaveBeenCalledTimes(1)
      expect(unhandled).toEqual([])
      expect(errorSpy).not.toHaveBeenCalled()
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      process.off('unhandledRejection', onUnhandled)
      errorSpy.mockRestore()
      warnSpy.mockRestore()
    }
  })
})
