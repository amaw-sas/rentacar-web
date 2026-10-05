import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Scenarios: docs/specs/2026-10-04-telefono-pais-visitante/scenarios/phone-country.scenarios.md
//
// The full libphonenumber metadata (~40 kB gzip) is loaded on demand through
// ../phoneValidatorMax, the dynamic-import target mocked here. Each test
// gets a fresh copy of the module under test so the memoized state never leaks.

type PhoneValidatorModule = typeof import('../phoneValidator')

const freshModule = async (): Promise<PhoneValidatorModule> => {
  vi.resetModules()
  return import('../phoneValidator')
}

afterEach(() => {
  vi.doUnmock('../phoneValidatorMax')
  vi.resetModules()
})

describe('phoneValidator — before load', () => {
  it('is not ready and rejects every number (fail closed)', async () => {
    const mod = await freshModule()
    expect(mod.isPhoneValidatorReady()).toBe(false)
    expect(mod.isValidPhone('+573001234567')).toBe(false)
  })
})

describe('phoneValidator — loading', () => {
  let importCount: number

  beforeEach(() => {
    importCount = 0
  })

  it('imports the metadata once, whether calls overlap or come after the first finished', async () => {
    vi.doMock('../phoneValidatorMax', async () => {
      importCount++
      const actual = await vi.importActual<typeof import('../phoneValidatorMax')>('../phoneValidatorMax')
      return { ...actual }
    })
    const mod = await freshModule()

    const first = mod.loadPhoneValidator()
    const overlapping = mod.loadPhoneValidator()
    expect(overlapping).toBe(first)
    await first
    expect(mod.loadPhoneValidator()).toBe(first)

    expect(importCount).toBe(1)
    expect(mod.isPhoneValidatorReady()).toBe(true)
    expect(mod.isValidPhone('+573001234567')).toBe(true)
    expect(mod.isValidPhone('+5730012')).toBe(false)
  })

  it('forgets a failed import so the next call retries and succeeds', async () => {
    vi.doMock('../phoneValidatorMax', async () => {
      importCount++
      if (importCount === 1) throw new Error('chunk failed to load')
      const actual = await vi.importActual<typeof import('../phoneValidatorMax')>('../phoneValidatorMax')
      return { ...actual }
    })
    const mod = await freshModule()

    await expect(mod.loadPhoneValidator()).rejects.toThrow()
    expect(mod.isPhoneValidatorReady()).toBe(false)
    expect(mod.isValidPhone('+573001234567')).toBe(false)

    await expect(mod.loadPhoneValidator()).resolves.toBeUndefined()
    expect(importCount).toBe(2)
    expect(mod.isPhoneValidatorReady()).toBe(true)
    expect(mod.isValidPhone('+573001234567')).toBe(true)
  })
})
