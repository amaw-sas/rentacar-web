// @vitest-environment jsdom
/**
 * Issue #406 — the drain point for the middleware's route-correction notices.
 *
 * validateSearchParams corrects a broken deep-link and redirects, carrying the
 * correction as a CODE in the query. This composable is the single place all 13
 * results pages across the three brands go through, so it is where the code
 * turns back into a toast.
 *
 * Two orderings are load-bearing and both are asserted here:
 *   - createMessage must come AFTER doSearch, which opens with flushMessages().
 *     A notice emitted first is wiped ~50 ms later — measured on the real page.
 *   - the URL is stripped BEFORE the toast is created, so that if the replace
 *     ever started remounting the page, the extra doSearch's flush would land
 *     before the toast exists rather than on top of it.
 *
 * Holdout: docs/specs/issue-406-middleware-route-notices/scenarios/middleware-route-notices.scenarios.md
 * Sostiene SCEN-406-02, -03, -04, -05, -07.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const ADMIN_PAYLOAD = {
  categories: [],
  branches: [
    {
      id: 1,
      code: 'AABOT',
      name: 'Bogotá Aeropuerto',
      city: 'bogota',
      slug: 'bogota-aeropuerto',
      schedule: '',
    },
  ],
  extras: undefined,
  vehicleCategories: {},
}

const VALID_PARAMS = {
  lugar_recogida: 'bogota-aeropuerto',
  lugar_devolucion: 'bogota-aeropuerto',
  fecha_recogida: '2099-09-15',
  fecha_devolucion: '2099-09-18',
  hora_recogida: '10:00am',
  hora_devolucion: '10:00am',
}

// Ordered trace of the two effects whose sequence matters.
let calls: string[] = []
// Notices currently ON SCREEN. The real toaster is not append-only: doSearch
// opens with flushMessages() → toast.clear(), which empties it. Asserting that
// createMessage merely RAN is what let #406 ship in the first place, so the
// harness models the clear and the assertions read this array instead.
let live: string[] = []
let createMessage: ReturnType<typeof vi.fn>
let flushMessages: ReturnType<typeof vi.fn>
let replace: ReturnType<typeof vi.fn>
let doSearch: ReturnType<typeof vi.fn>

vi.mock('../useSearch', () => ({
  default: () => ({ doSearch }),
}))

// Mocked at the module path the composable actually imports, not as a global
// auto-import: a broken import surfaces here instead of silently resolving.
vi.mock('../useMessages', () => ({
  default: () => ({ createMessage, flushMessages }),
}))

/** Mounts the composable over a given query and lets the strip promise settle. */
async function run(query: Record<string, unknown>) {
  const { default: useSearchByRouteParams } = await import('../useSearchByRouteParams')

  vi.stubGlobal('useRoute', () => ({ params: { ...VALID_PARAMS }, query }))
  vi.stubGlobal('useRouter', () => ({ replace }))

  const wrapper = mount(
    defineComponent({
      setup() {
        useSearchByRouteParams()
        return () => h('div')
      },
    }),
  )
  await flushPromises()
  return wrapper
}

describe('useSearchByRouteParams — route-correction notices (#406)', () => {
  beforeEach(() => {
    vi.resetModules()
    calls = []
    live = []
    createMessage = vi.fn((m: { message?: string }) => {
      calls.push(`createMessage:${m?.message ?? ''}`)
      live.push(m?.message ?? '')
    })
    flushMessages = vi.fn(() => {
      calls.push('flush')
      live.length = 0
    })
    replace = vi.fn(() => {
      calls.push('replace')
      return Promise.resolve()
    })
    // The real doSearch opens with flushMessages() — that is the whole hazard.
    doSearch = vi.fn(() => {
      flushMessages()
      calls.push('doSearch')
      return true
    })

    vi.stubGlobal('useState', () => ref(ADMIN_PAYLOAD))
    vi.stubGlobal('useToast', () => ({ add: vi.fn(), clear: vi.fn() }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // SCEN-406-02. The whole point of the issue: a notice created before the
  // flush is not a notice, it is 53 ms of nothing. So the assertion is that it
  // is still ON SCREEN once everything settles — not that createMessage ran.
  // Move announceRouteCorrections() above doSearch() (the #406 regression) and
  // this must go red.
  it('the notice survives doSearch — it is still on screen when the dust settles', async () => {
    await run({ aviso: 'sede' })

    expect(calls).toContain('flush')
    expect(live).toEqual(['Ubicación inválida. Se ajustó a la sede por defecto.'])
  })

  it('strips the carrier before creating the toast', async () => {
    await run({ aviso: 'sede' })

    const replaceAt = calls.indexOf('replace')
    const messageAt = calls.findIndex((c) => c.startsWith('createMessage'))

    expect(replaceAt).toBeGreaterThanOrEqual(0)
    expect(messageAt).toBeGreaterThan(replaceAt)
  })

  // SCEN-406-03. Removing the carrier must not take the rest of the query with
  // it — campaign params ride these URLs.
  it('keeps every other query key when stripping the carrier', async () => {
    await run({ aviso: 'sede', utm_source: 'newsletter', fbclid: 'abc123' })

    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace.mock.calls[0]![0]).toEqual({
      query: { utm_source: 'newsletter', fbclid: 'abc123' },
    })
  })

  // SCEN-406-04. `aviso` is user-writable.
  it('ignores a code that is not in the catalog but still cleans the URL', async () => {
    await run({ aviso: '<img src=x onerror=alert(1)>' })

    expect(createMessage).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace.mock.calls[0]![0]).toEqual({ query: {} })
  })

  // SCEN-406-05. Chained corrections each get their own toast, and BOTH have to
  // be on screen at the end — not merely to have been emitted.
  it('leaves one notice per accumulated code on screen, in order', async () => {
    await run({ aviso: 'sede-ciudad,duracion' })

    expect(live).toEqual([
      'La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.',
      'La fecha de devolución ha sido ajustada a 30 días después de la fecha de recogida.',
    ])
  })

  // SCEN-406-07. A guard that blocks the search explains why there is no quote;
  // it does not explain that the URL was rewritten. Both facts are the user's.
  // The guard path still flushes, so survival is the assertion here too.
  it('still announces the correction when doSearch bails', async () => {
    doSearch = vi.fn(() => {
      flushMessages()
      calls.push('doSearch')
      return false
    })

    await run({ aviso: 'sede-ciudad' })

    expect(calls).toContain('flush')
    expect(live).toEqual([
      'La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.',
    ])
  })

  // SCEN-406-06. No correction, no noise: an untouched URL must not be
  // rewritten, because a pointless replace is a real navigation.
  it('leaves a URL without the carrier completely alone', async () => {
    await run({ utm_source: 'newsletter' })

    expect(createMessage).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(doSearch).toHaveBeenCalledTimes(1)
  })
})
