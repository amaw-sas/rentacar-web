import { afterEach, describe, expect, it, vi } from 'vitest'
import { useChatStatus } from '../useChatStatus'

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

    refocus()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await flushMicrotasks()

    expect(status.resolved.value).toBe(true)
    expect(status.enabled.value).toBe(true)
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

    refocus()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await flushMicrotasks()

    expect(status.resolved.value).toBe(true)
    expect(status.enabled.value).toBe(false)
  })
})
