import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  __resetAdvisorMemoryForTests,
  clearStoredAdvisor,
  readStoredAdvisor,
  writeStoredAdvisor,
} from '../advisorStorage'

const KEY = 'rentacar:asesor'

function makeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    _store: store,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  __resetAdvisorMemoryForTests()
})

describe('advisorStorage', () => {
  it('round-trips {code,name}', () => {
    const s = makeStorage()
    vi.stubGlobal('localStorage', s)
    writeStoredAdvisor({ code: 'daniela', name: 'Daniela' })
    expect(JSON.parse(s._store.get(KEY)!)).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(readStoredAdvisor()).toEqual({ code: 'daniela', name: 'Daniela' })
  })
  it('nothing stored -> null', () => {
    vi.stubGlobal('localStorage', makeStorage())
    expect(readStoredAdvisor()).toBeNull()
  })
  it.each(['1', '{bad', '[]', '{"code":"a"}', '{"code":1,"name":"x"}', 'null', '{"code":"","name":"x"}'])(
    'invalid/legacy value %j is removed and returns null',
    (raw) => {
      const s = makeStorage({ [KEY]: raw })
      vi.stubGlobal('localStorage', s)
      expect(readStoredAdvisor()).toBeNull()
      expect(s._store.has(KEY)).toBe(false)
    },
  )
  it('clear removes the key', () => {
    const s = makeStorage({ [KEY]: '{"code":"a","name":"A"}' })
    vi.stubGlobal('localStorage', s)
    clearStoredAdvisor()
    expect(s._store.has(KEY)).toBe(false)
  })
  it('throwing storage never throws', () => {
    const boom = () => { throw new Error('private') }
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom })
    expect(readStoredAdvisor()).toBeNull()
    expect(() => writeStoredAdvisor({ code: 'a', name: 'A' })).not.toThrow()
    expect(() => clearStoredAdvisor()).not.toThrow()
  })
  it('missing storage never throws', () => {
    delete (globalThis as Record<string, unknown>).localStorage
    expect(readStoredAdvisor()).toBeNull()
    expect(() => writeStoredAdvisor({ code: 'a', name: 'A' })).not.toThrow()
    expect(() => clearStoredAdvisor()).not.toThrow()
  })
  it('throwing storage keeps the advisor in memory; clear forgets it', () => {
    const boom = () => { throw new Error('private') }
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom })
    writeStoredAdvisor({ code: 'daniela', name: 'Daniela' })
    expect(readStoredAdvisor()).toEqual({ code: 'daniela', name: 'Daniela' })
    clearStoredAdvisor()
    expect(readStoredAdvisor()).toBeNull()
  })
  it('missing storage keeps the advisor in memory; clear forgets it', () => {
    delete (globalThis as Record<string, unknown>).localStorage
    writeStoredAdvisor({ code: 'daniela', name: 'Daniela' })
    expect(readStoredAdvisor()).toEqual({ code: 'daniela', name: 'Daniela' })
    clearStoredAdvisor()
    expect(readStoredAdvisor()).toBeNull()
  })
  it('valid stored value wins over memory; legacy value is removed and falls back to memory', () => {
    vi.stubGlobal('localStorage', makeStorage())
    writeStoredAdvisor({ code: 'a', name: 'A' })
    const s = makeStorage({ [KEY]: '{"code":"b","name":"B"}' })
    vi.stubGlobal('localStorage', s)
    expect(readStoredAdvisor()).toEqual({ code: 'b', name: 'B' })
    const legacy = makeStorage({ [KEY]: '1' })
    vi.stubGlobal('localStorage', legacy)
    expect(readStoredAdvisor()).toEqual({ code: 'a', name: 'A' })
    expect(legacy._store.has(KEY)).toBe(false)
  })
})
