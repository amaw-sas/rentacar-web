import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import useAdvisorMode from '../useAdvisorMode'

// SCEN-002 / SCEN-003 (docs/specs/copiar-cotizacion): the advisor-only copy
// button shows when ?asesor=1 was seen on this device. Lifecycle hooks are
// captured so each test decides when "mount" happens (SSR = before mount).
const mountHooks: Array<() => void> = []
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return { ...actual, onMounted: (hook: () => void) => void mountHooks.push(hook) }
})

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

function setup(query: Record<string, unknown>, storage: unknown) {
  const route = reactive({ query })
  vi.stubGlobal('useRoute', () => route)
  if (storage === null) {
    delete (globalThis as Record<string, unknown>).localStorage
  } else {
    vi.stubGlobal('localStorage', storage)
  }
  const mode = useAdvisorMode()
  const mount = () => mountHooks.splice(0).forEach((h) => h())
  return { mode, mount, route }
}

beforeEach(() => {
  mountHooks.length = 0
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAdvisorMode', () => {
  it('?asesor=1 turns advisor mode on and stores it', () => {
    const storage = makeStorage()
    const { mode, mount } = setup({ asesor: '1' }, storage)
    mount()
    expect(mode.isAdvisor.value).toBe(true)
    expect(storage._store.get(KEY)).toBe('1')
  })

  it('takes the first value when asesor is repeated', () => {
    const { mode, mount } = setup({ asesor: ['1', '0'] }, makeStorage())
    mount()
    expect(mode.isAdvisor.value).toBe(true)
  })

  it('a later visit without the param stays advisor when stored', () => {
    const { mode, mount } = setup({}, makeStorage({ [KEY]: '1' }))
    mount()
    expect(mode.isAdvisor.value).toBe(true)
  })

  it('?asesor=0 turns it off and removes the key', () => {
    const storage = makeStorage({ [KEY]: '1' })
    const { mode, mount } = setup({ asesor: '0' }, storage)
    mount()
    expect(mode.isAdvisor.value).toBe(false)
    expect(storage._store.has(KEY)).toBe(false)
  })

  it('no param and nothing stored is false', () => {
    const { mode, mount } = setup({}, makeStorage())
    mount()
    expect(mode.isAdvisor.value).toBe(false)
  })

  it('is false before mount (server render) even with ?asesor=1', () => {
    const { mode } = setup({ asesor: '1' }, makeStorage({ [KEY]: '1' }))
    expect(mode.isAdvisor.value).toBe(false)
  })

  it('null storage: true only with ?asesor=1', () => {
    const on = setup({ asesor: '1' }, null)
    on.mount()
    expect(on.mode.isAdvisor.value).toBe(true)

    const off = setup({}, null)
    off.mount()
    expect(off.mode.isAdvisor.value).toBe(false)
  })

  it('setItem throwing: still true with ?asesor=1, no throw', () => {
    const storage = makeStorage()
    storage.setItem = () => {
      throw new Error('private mode')
    }
    const { mode, mount } = setup({ asesor: '1' }, storage)
    expect(() => mount()).not.toThrow()
    expect(mode.isAdvisor.value).toBe(true)
  })

  it('getItem throwing without param: false, no throw', () => {
    const storage = makeStorage()
    storage.getItem = () => {
      throw new Error('private mode')
    }
    const { mode, mount } = setup({}, storage)
    expect(() => mount()).not.toThrow()
    expect(mode.isAdvisor.value).toBe(false)
  })

  it('removeItem throwing on ?asesor=0: false, no throw', () => {
    const storage = makeStorage({ [KEY]: '1' })
    storage.removeItem = () => {
      throw new Error('private mode')
    }
    const { mode, mount } = setup({ asesor: '0' }, storage)
    expect(() => mount()).not.toThrow()
    expect(mode.isAdvisor.value).toBe(false)
  })

  it('reacts to a later client-side navigation with ?asesor=1', async () => {
    const storage = makeStorage()
    const { mode, mount, route } = setup({}, storage)
    mount()
    expect(mode.isAdvisor.value).toBe(false)
    route.query = { asesor: '1' }
    await Promise.resolve()
    expect(mode.isAdvisor.value).toBe(true)
    expect(storage._store.get(KEY)).toBe('1')
  })

  it('does not rewrite the route query', () => {
    const query = { asesor: '1' }
    const { mount, route } = setup(query, makeStorage())
    mount()
    expect(route.query).toEqual({ asesor: '1' })
  })
})
