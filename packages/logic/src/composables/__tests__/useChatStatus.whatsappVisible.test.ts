import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStatus } from '../useChatStatus'

// Behavioral coverage for the WhatsApp-visibility half of useChatStatus: the
// fail-OPEN error path, the schedule-driven hide, the 60s re-evaluation timer,
// and focus revalidation. The pure predicate is covered separately in
// whatsappVisibility.test.ts; here we drive the composable's runtime wiring.
//
// Lifecycle hooks run synchronously so this stays a Node-only unit test; the
// composable's own focus callback and interval still execute unchanged.
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onMounted: (hook: () => void) => hook(),
    onBeforeUnmount: () => undefined,
  }
})

// Verified Bogota anchors (Colombia is UTC−5, no DST):
//   Tue 10:00 Bogota = 2026-07-21T15:00:00Z (inside 08:00–18:00 → visible)
//   Tue 18:00 Bogota = 2026-07-21T23:00:00Z (exclusive end → hidden)
//   Tue 20:00 Bogota = 2026-07-22T01:00:00Z (after close → hidden)
const TUE_10H = '2026-07-21T15:00:00Z'
const TUE_18H = '2026-07-21T23:00:00Z'
const TUE_20H = '2026-07-22T01:00:00Z'
const STANDARD = { tue: ['08:00-18:00'] }

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

// D7 — mobile throttles background timers and does not reliably fire `focus` on
// tab restore, so the composable also listens to visibilitychange. Returns a
// trigger that sets visibilityState and fires the event.
function stubVisibilityListener() {
  let listener: (() => void) | undefined
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (type: string, l: () => void) => {
      if (type === 'visibilitychange') listener = l
    },
    removeEventListener: () => undefined,
  }
  vi.stubGlobal('document', doc)
  return (state: DocumentVisibilityState) => {
    doc.visibilityState = state
    listener?.()
  }
}

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { rentacarPublicApiBase: 'https://dashboard.test' },
  }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useChatStatus — whatsappVisible is fail-OPEN', () => {
  it('starts visible and stays visible when the very first fetch rejects', async () => {
    vi.setSystemTime(new Date(TUE_20H)) // a time the schedule would hide, if it had one
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('network down')))
    stubFocusListener()

    const status = useChatStatus('alquilatucarro')
    expect(status.whatsappVisible.value).toBe(true) // fail-open default
    await flushMicrotasks()

    // A network error must never hide the WhatsApp button.
    expect(status.whatsappVisible.value).toBe(true)
  })

  it('keeps the last-known schedule (does not resurrect the button) when a refocus rejects', async () => {
    vi.setSystemTime(new Date(TUE_20H)) // outside the window → schedule hides it
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ brand: 'alquilatucarro', enabled: true, whatsappSchedule: STANDARD })
      .mockRejectedValueOnce(new Error('temporary network failure'))
    vi.stubGlobal('$fetch', fetchMock)
    const refocus = stubFocusListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(false) // authoritative hide

    refocus()
    await flushMicrotasks()
    // The error preserves the last authoritative schedule; still hidden, not flipped.
    expect(status.whatsappVisible.value).toBe(false)
  })
})

describe('useChatStatus — schedule drives visibility', () => {
  it('hides WhatsApp when the resolved schedule is closed now (S2)', async () => {
    vi.setSystemTime(new Date(TUE_20H))
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      brand: 'alquilatucarro', enabled: true, whatsappSchedule: STANDARD,
    }))
    stubFocusListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(false)
  })

  it('shows WhatsApp when the resolved schedule is open now (S1)', async () => {
    vi.setSystemTime(new Date(TUE_10H))
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      brand: 'alquilatucarro', enabled: true, whatsappSchedule: STANDARD,
    }))
    stubFocusListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(true)
  })

  it('stays visible when the response carries no schedule (S4 — no windows configured)', async () => {
    vi.setSystemTime(new Date(TUE_20H)) // a time a schedule could hide
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      brand: 'alquilatucarro', enabled: true, // whatsappSchedule absent
    }))
    stubFocusListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(true)
  })
})

describe('useChatStatus — 60s re-evaluation timer', () => {
  it('flips visible → hidden at the window boundary without another fetch', async () => {
    vi.setSystemTime(new Date(TUE_10H)) // inside the window
    const fetchMock = vi.fn().mockResolvedValue({
      brand: 'alquilatucarro', enabled: true, whatsappSchedule: STANDARD,
    })
    vi.stubGlobal('$fetch', fetchMock)
    stubFocusListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(true)

    // The clock crosses 18:00 (exclusive end). The minute tick must close the
    // button with no new network request.
    vi.setSystemTime(new Date(TUE_18H))
    vi.advanceTimersByTime(60_000)
    expect(status.whatsappVisible.value).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1) // no extra fetch
  })
})

describe('useChatStatus — visibilitychange (D7)', () => {
  it('re-evaluates the window when the tab becomes visible again', async () => {
    vi.setSystemTime(new Date(TUE_10H)) // inside the window
    const fetchMock = vi.fn().mockResolvedValue({
      brand: 'alquilatucarro', enabled: true, whatsappSchedule: STANDARD,
    })
    vi.stubGlobal('$fetch', fetchMock)
    stubFocusListener()
    const setVisibility = stubVisibilityListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(true)

    // The tab sat in the background past the close; timers were throttled and
    // `focus` never fired. Returning to the tab must close the button at once.
    vi.setSystemTime(new Date(TUE_20H))
    setVisibility('visible')
    expect(status.whatsappVisible.value).toBe(false)
  })

  it('ignores the event when the tab is being hidden', async () => {
    vi.setSystemTime(new Date(TUE_10H))
    const fetchMock = vi.fn().mockResolvedValue({
      brand: 'alquilatucarro', enabled: true, whatsappSchedule: STANDARD,
    })
    vi.stubGlobal('$fetch', fetchMock)
    stubFocusListener()
    const setVisibility = stubVisibilityListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    setVisibility('hidden')
    // No extra revalidation work while the tab is going away.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(status.whatsappVisible.value).toBe(true)
  })
})

describe('useChatStatus — focus revalidation', () => {
  it('applies a schedule edit picked up on refocus', async () => {
    vi.setSystemTime(new Date(TUE_20H))
    const fetchMock = vi
      .fn()
      // First load: no schedule → visible.
      .mockResolvedValueOnce({ brand: 'alquilatucarro', enabled: true })
      // After an operator narrows the window: 20:00 now falls outside → hidden.
      .mockResolvedValueOnce({ brand: 'alquilatucarro', enabled: true, whatsappSchedule: STANDARD })
    vi.stubGlobal('$fetch', fetchMock)
    const refocus = stubFocusListener()

    const status = useChatStatus('alquilatucarro')
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(true)

    refocus()
    await flushMicrotasks()
    expect(status.whatsappVisible.value).toBe(false)
  })
})
