import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// SCEN-016/017/018/019 — the layer plugin activates the advisor on any page:
// once Nuxt is ready and the router has resolved the landing route, and on
// every navigation. The start must not depend on the route already being
// resolved at mount time.

afterEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
})

type Nav = (to: { query: Record<string, unknown> }, from: unknown, failure?: unknown) => void
const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const DANIELA = { code: 'daniela', name: 'Daniela' }

async function loadPlugin(
  query: Record<string, unknown> = {},
  fetchImpl: () => unknown = async () => DANIELA,
  opts: { search?: string; resolvedQuery?: Record<string, unknown> } = {},
) {
  let nav: Nav | undefined
  let mounted: (() => void) | undefined
  const currentRoute = { value: { query } }
  const state = ref<unknown>(null)
  const replace = vi.fn()
  const toastAdd = vi.fn()
  const $fetch = vi.fn(fetchImpl)
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  vi.stubGlobal('$fetch', $fetch)
  vi.stubGlobal('defineNuxtPlugin', (p: unknown) => p)
  vi.stubGlobal('useState', () => state)
  vi.stubGlobal('useToast', () => ({ add: toastAdd }))
  vi.stubGlobal('location', { search: opts.search ?? '' })
  vi.stubGlobal('onNuxtReady', (cb: () => void) => void (mounted = cb))
  vi.stubGlobal('useRouter', () => ({
    afterEach: (cb: Nav) => void (nav = cb),
    replace,
    currentRoute,
    // The landing route may only be resolved once the router is ready.
    isReady: async () => {
      if (opts.resolvedQuery) currentRoute.value = { query: opts.resolvedQuery }
    },
  }))
  const nuxtApp = {
    hook: vi.fn(),
    runWithContext: (fn: () => unknown) => fn(),
  }
  const { default: plugin } = await import('../plugins/advisor-mode.client')
  ;(plugin as (n: unknown) => void)(nuxtApp)
  return {
    state, replace, toastAdd, $fetch, store,
    mount: async () => { mounted!(); await flush() },
    navigate: async (q: Record<string, unknown>, failure?: unknown) => { nav!({ query: q }, {}, failure); await flush() },
  }
}

describe('advisor-mode.client plugin', () => {
  it('starts with the landing route resolved after the router is ready', async () => {
    const t = await loadPlugin({}, async () => DANIELA, { resolvedQuery: { asesor: 'daniela' } })
    await t.mount()
    expect(t.$fetch).toHaveBeenCalledTimes(1)
    expect(t.state.value).toEqual(DANIELA)
  })

  it('a navigation that carried ?asesor before Nuxt was ready is still applied', async () => {
    const t = await loadPlugin({})
    await t.navigate({ asesor: 'daniela', utm: 'x' }) // landing with the code
    await t.mount()
    expect(t.$fetch).toHaveBeenCalledTimes(1)
    expect(t.state.value).toEqual(DANIELA)
  })

  it('the carried code never restores an older query on the page the user is on now', async () => {
    const t = await loadPlugin({ page: '2' })
    await t.navigate({ asesor: 'daniela', utm: 'x' })
    await t.mount()
    expect(t.state.value).toEqual(DANIELA)
    expect(t.replace).toHaveBeenCalledWith({ query: { page: '2' } })
  })

  it('SCEN-016: landing on any page with ?asesor stores and strips it, only once Nuxt is ready', async () => {
    const t = await loadPlugin({ asesor: 'daniela', utm: 'x' })
    expect(t.$fetch).not.toHaveBeenCalled()
    await t.mount()
    expect(t.state.value).toEqual(DANIELA)
    expect(JSON.parse(t.store.get('rentacar:asesor')!)).toEqual(DANIELA)
    expect(t.replace).toHaveBeenCalledWith({ query: { utm: 'x' } })
  })

  it('SCEN-018: bad code on the landing page toasts and stores nothing', async () => {
    const t = await loadPlugin({ asesor: 'danela' }, async () => { throw Object.assign(new Error('x'), { statusCode: 404 }) })
    await t.mount()
    expect(t.toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Código de asesor no encontrado', color: 'error' }))
    expect(t.store.size).toBe(0)
  })

  it('the initial-navigation afterEach does not double-apply the landing param', async () => {
    const t = await loadPlugin({ asesor: 'daniela' })
    await t.navigate({ asesor: 'daniela' }) // fires before app:mounted
    await t.mount()
    expect(t.$fetch).toHaveBeenCalledTimes(1)
  })

  it('SCEN-017: a later navigation with ?asesor activates; failures and absent key do nothing', async () => {
    const t = await loadPlugin({})
    await t.mount()
    await t.navigate({ asesor: 'daniela' }, new Error('aborted'))
    await t.navigate({})
    expect(t.$fetch).not.toHaveBeenCalled()
    await t.navigate({ asesor: 'daniela', a: 'b' })
    expect(t.state.value).toEqual(DANIELA)
    expect(t.replace).toHaveBeenCalledWith({ query: { a: 'b' } })
  })

  it('revalidates a stored advisor exactly once per load', async () => {
    const t = await loadPlugin({})
    t.store.set('rentacar:asesor', JSON.stringify(DANIELA))
    await t.mount()
    await t.navigate({ x: '1' })
    expect(t.$fetch).toHaveBeenCalledTimes(1)
    expect(t.state.value).toEqual(DANIELA)
  })

  it('SCEN-019: visitor makes zero $fetch calls on load and navigations', async () => {
    const t = await loadPlugin({})
    await t.mount()
    await t.navigate({ page: '2' })
    expect(t.$fetch).not.toHaveBeenCalled()
    expect(t.state.value).toBeNull()
  })

  it('never throws when the router is broken', async () => {
    vi.stubGlobal('defineNuxtPlugin', (p: unknown) => p)
    vi.stubGlobal('useRouter', () => { throw new Error('no router') })
    const { default: plugin } = await import('../plugins/advisor-mode.client')
    vi.stubGlobal('onNuxtReady', (cb: () => void) => cb())
    expect(() => (plugin as (n: unknown) => void)({ hook: vi.fn(), runWithContext: (f: () => unknown) => f() })).not.toThrow()
  })
})
