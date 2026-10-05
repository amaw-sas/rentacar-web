import { describe, it, expect, beforeAll, vi } from 'vitest'
import { shouldHintColombianMobile } from '../colombianMobileHint'
import { loadPhoneValidator } from '../validation/phoneValidator'

// SCEN-016..018 (colombian-mobile-hint.scenarios.md): a Colombian mobile typed
// under a foreign flag gets a non-blocking hint; nothing else does.
describe('shouldHintColombianMobile', () => {
  beforeAll(async () => {
    await loadPhoneValidator()
  })

  it('SCEN-016: hints a Colombian mobile saved under the US flag', () => {
    expect(shouldHintColombianMobile('+1 315 888 9999', 'US')).toBe(true)
  })

  it('hints it under the Canadian flag too (same +1 plan)', () => {
    expect(shouldHintColombianMobile('+1 315 888 9999', 'CA')).toBe(true)
  })

  it('accepts a lower-case flag', () => {
    expect(shouldHintColombianMobile('+1 315 888 9999', 'us')).toBe(true)
  })

  it('SCEN-018: no hint for a US number that is not a Colombian mobile', () => {
    expect(shouldHintColombianMobile('+1 817 522 8026', 'US')).toBe(false)
  })

  it('SCEN-018: no hint under the Colombian flag', () => {
    expect(shouldHintColombianMobile('+57 315 8889999', 'CO')).toBe(false)
  })

  it('no hint for a Spanish mobile under the Spanish flag', () => {
    expect(shouldHintColombianMobile('+34 612 345 678', 'ES')).toBe(false)
  })

  it('no hint without a value or a flag', () => {
    expect(shouldHintColombianMobile(null, 'US')).toBe(false)
    expect(shouldHintColombianMobile(undefined, 'US')).toBe(false)
    expect(shouldHintColombianMobile('', 'US')).toBe(false)
    expect(shouldHintColombianMobile('+1 315 888 9999', null)).toBe(false)
    expect(shouldHintColombianMobile('+1 315 888 9999', undefined)).toBe(false)
  })

  it('no hint for a number invalid under its flag (the error covers it)', () => {
    expect(shouldHintColombianMobile('300 123 4567', 'US')).toBe(false)
  })
})

describe('shouldHintColombianMobile — validator not loaded', () => {
  it('never hints before the metadata is loaded', async () => {
    vi.resetModules()
    const fresh = await import('../colombianMobileHint')
    expect(fresh.shouldHintColombianMobile('+1 315 888 9999', 'US')).toBe(false)
  })
})
