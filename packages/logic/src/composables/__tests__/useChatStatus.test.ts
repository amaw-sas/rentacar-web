import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  evaluateWhatsappVisibility,
  useChatStatus,
} from '../useChatStatus'

// Run lifecycle hooks synchronously so this stays a Node-only unit test. The
// composable itself and its real focus callback still execute unchanged.
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onMounted: (hook: () => void) => hook(),
    onBeforeUnmount: () => undefined,
  }
})

function stubFocusListener() {
  let focusListener: (() => void) | undefined
  vi.stubGlobal('window', {
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'focus') focusListener = listener
    },
    removeEventListener: () => undefined,
    setInterval: () => 1,
    clearInterval: () => undefined,
  })
  return () => focusListener?.()
}

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useChatStatus — focus revalidation keeps last-known-good state', () => {
  it('keeps a resolved ON status when the refocus request rejects', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ brand: 'alquilatucarro', enabled: true })
      .mockRejectedValueOnce(new Error('temporary network failure'))
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { rentacarPublicApiBase: 'https://dashboard.test' },
    }))
    const refocus = stubFocusListener()
    const status = useChatStatus('alquilatucarro')
    await vi.waitFor(() => expect(status.resolved.value).toBe(true))

    expect(status.resolved.value).toBe(true)
    expect(status.enabled.value).toBe(true)
    expect(status.whatsappVisible.value).toBe(true)

    refocus()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await flushMicrotasks()

    expect(status.resolved.value).toBe(true)
    expect(status.enabled.value).toBe(true)
    expect(status.whatsappVisible.value).toBe(true)
  })

  it('keeps a resolved OFF status when the refocus request rejects', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ brand: 'alquilatucarro', enabled: false })
      .mockRejectedValueOnce(new Error('temporary network failure'))
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { rentacarPublicApiBase: 'https://dashboard.test' },
    }))
    const refocus = stubFocusListener()
    const status = useChatStatus('alquilatucarro')
    await vi.waitFor(() => expect(status.resolved.value).toBe(true))

    expect(status.resolved.value).toBe(true)
    expect(status.enabled.value).toBe(false)
    expect(status.whatsappVisible.value).toBe(true)

    refocus()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await flushMicrotasks()

    expect(status.resolved.value).toBe(true)
    expect(status.enabled.value).toBe(false)
    expect(status.whatsappVisible.value).toBe(true)
  })

  it('keeps WhatsApp hidden when its independent dashboard switch is OFF', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      brand: 'alquilatucarro',
      enabled: true,
      whatsappEnabled: false,
      whatsappSchedule: null,
    }))
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { rentacarPublicApiBase: 'https://dashboard.test' },
    }))
    stubFocusListener()
    const status = useChatStatus('alquilatucarro')
    await vi.waitFor(() => expect(status.resolved.value).toBe(true))

    expect(status.enabled.value).toBe(true)
    expect(status.whatsappEnabled.value).toBe(false)
    expect(status.whatsappVisible.value).toBe(false)
  })
})

describe('evaluateWhatsappVisibility — Bogotá schedule gate', () => {
  it('treats no schedule as always visible and {} as always hidden', () => {
    const noonBogota = new Date('2026-07-27T17:00:00.000Z')
    expect(evaluateWhatsappVisibility(null, noonBogota)).toBe(true)
    expect(evaluateWhatsappVisibility({}, noonBogota)).toBe(false)
  })

  it('uses a half-open interval in Colombia time', () => {
    const schedule = { mon: ['07:00-19:00'] }
    expect(evaluateWhatsappVisibility(schedule, new Date('2026-07-27T12:00:00.000Z'))).toBe(true)
    expect(evaluateWhatsappVisibility(schedule, new Date('2026-07-28T00:00:00.000Z'))).toBe(false)
  })
})
