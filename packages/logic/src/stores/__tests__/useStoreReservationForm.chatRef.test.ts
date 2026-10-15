import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { CHAT_REF_STORAGE_KEY } from '@rentacar-main/logic/utils'

// Holdout: docs/specs/chat-ref-reserva/scenarios/chat-ref-reserva.scenarios.md
// SCEN-004 (later chat replaces), SCEN-005 (no chat keeps the stored one),
// SCEN-006 (blank = absent, previous kept), SCEN-008 (blocked storage still
// keeps the value in memory), SCEN-010 (resetAfterReservation keeps it).

const UUID = '4f2a91ce-1234-4abc-9def-0123456789ab'

// resetAfterReservation reaches useStoreSearchData, whose setup calls useMessages
// (a Nuxt UI toast). Same stub as the resetAfterReservation suite.
vi.mock('../../composables/useMessages', () => ({
  default: () => ({
    createErrorMessage: vi.fn(),
    createReservationTechnicalErrorMessage: vi.fn(),
    createReservationUnknownStatusMessage: vi.fn(),
  }),
}))

function createStorageMock(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  } as Storage
}

const storedValue = () => {
  const raw = localStorage.getItem(CHAT_REF_STORAGE_KEY)
  return raw ? (JSON.parse(raw) as { value: string }).value : null
}

async function bootStore() {
  const { default: useStoreReservationForm } = await import('../useStoreReservationForm')
  return useStoreReservationForm()
}

describe('useStoreReservationForm.captureChatRef', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('useState', () => ref({ categories: [], branches: [] }))
    vi.stubGlobal('navigateTo', vi.fn())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('SCEN-001: a chat in the URL lands in the store and in localStorage', async () => {
    const store = await bootStore()
    store.captureChatRef(UUID)
    expect(store.chatRef).toBe(UUID)
    expect(storedValue()).toBe(UUID)
  })

  it('SCEN-004: a later chat replaces the previous one, in memory and in storage', async () => {
    const store = await bootStore()
    store.captureChatRef('aaaa-1111')
    store.captureChatRef('bbbb-2222')
    expect(store.chatRef).toBe('bbbb-2222')
    expect(storedValue()).toBe('bbbb-2222')
  })

  it('SCEN-005: a navigation without chat keeps the stored one', async () => {
    const store = await bootStore()
    store.captureChatRef(UUID)
    store.captureChatRef(undefined)
    store.captureChatRef(null)
    expect(store.chatRef).toBe(UUID)
    expect(storedValue()).toBe(UUID)
  })

  it('SCEN-003: a fresh store (reload) seeds itself from storage when the URL has no chat', async () => {
    localStorage.setItem(CHAT_REF_STORAGE_KEY, JSON.stringify({ value: UUID, ts: Date.now() }))
    const store = await bootStore()
    expect(store.chatRef).toBeNull()
    store.captureChatRef(undefined)
    expect(store.chatRef).toBe(UUID)
  })

  it('SCEN-006: blank values are ignored and the previous one survives', async () => {
    const store = await bootStore()
    store.captureChatRef(UUID)
    store.captureChatRef('')
    store.captureChatRef('   ')
    expect(store.chatRef).toBe(UUID)
    expect(storedValue()).toBe(UUID)
  })

  it('SCEN-006: with nothing previous, a blank value stores nothing', async () => {
    const store = await bootStore()
    store.captureChatRef('   ')
    expect(store.chatRef).toBeNull()
    expect(localStorage.getItem(CHAT_REF_STORAGE_KEY)).toBeNull()
  })

  it('SCEN-008: blocked storage still keeps the value in memory and never throws', async () => {
    vi.unstubAllGlobals()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError')
      },
    })
    vi.stubGlobal('useState', () => ref({ categories: [], branches: [] }))
    vi.stubGlobal('navigateTo', vi.fn())
    try {
      const store = await bootStore()
      expect(() => store.captureChatRef(UUID)).not.toThrow()
      expect(store.chatRef).toBe(UUID)
    } finally {
      delete (globalThis as Record<string, unknown>).localStorage
    }
  })

  it('SCEN-010: resetAfterReservation leaves chatRef intact', async () => {
    const store = await bootStore()
    store.captureChatRef(UUID)
    store.referido = 'valeria-bot'
    store.resetAfterReservation()
    expect(store.referido).toBeNull() // the existing contract for referido
    expect(store.chatRef).toBe(UUID)
    expect(storedValue()).toBe(UUID)
  })
})
