import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createAdvisorSession } from '../advisorSession'
import { __resetAdvisorMemoryForTests, type StoredAdvisor } from '../advisorStorage'

// SCEN-001/002/004/005/006/007 (docs/specs/cotizacion-por-asesor) plus
// SCEN-016/017/018/019 (activar-desde-cualquier-pagina): the session logic is
// route-agnostic, driven by the layer plugin on load and on every navigation.

const KEY = 'rentacar:asesor'
const DANIELA = JSON.stringify({ code: 'daniela', name: 'Daniela' })
const NOT_FOUND = 'Código de asesor no encontrado'
const NO_VERIFY = 'No se pudo verificar el código, intenta de nuevo'

function makeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    _store: store,
  }
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const httpError = (statusCode?: number) => Object.assign(new Error('fetch failed'), statusCode ? { statusCode } : {})

function setup(query: Record<string, unknown>, storage: unknown, fetchImpl: (...a: unknown[]) => unknown = vi.fn()) {
  const advisor = ref<StoredAdvisor | null>(null)
  const replace = vi.fn()
  const notify = vi.fn()
  const $fetch = vi.fn(fetchImpl)
  vi.stubGlobal('$fetch', $fetch)
  if (storage === null) delete (globalThis as Record<string, unknown>).localStorage
  else vi.stubGlobal('localStorage', storage)
  const session = createAdvisorSession({
    setAdvisor: (a) => void (advisor.value = a),
    replaceQuery: replace,
    notify,
  })
  const mode = { advisor }
  const mount = async () => {
    session.start(query)
    await flush()
  }
  // Client-side navigation: the plugin forwards `to.query`.
  const navigate = async (next: Record<string, unknown>) => {
    session.onNavigate(next)
    await flush()
  }
  return { mode, mount, navigate, replace, notify, $fetch }
}

afterEach(() => {
  vi.unstubAllGlobals()
  __resetAdvisorMemoryForTests()
})

describe('advisorSession', () => {
  it('race: ?asesor=a pending, then ?asesor=0 -> late 200 is ignored', async () => {
    const storage = makeStorage()
    let resolveA!: (v: { code: string; name: string }) => void
    const { mode, mount, navigate } = setup({ asesor: 'a' }, storage, () => new Promise((r) => { resolveA = r }))
    await mount()
    await navigate({ asesor: '0' })
    resolveA({ code: 'a', name: 'A' })
    await flush()
    expect(mode.advisor.value).toBeNull()
    expect(storage._store.has(KEY)).toBe(false)
  })

  it('race: older response resolving after a newer one does not overwrite it', async () => {
    const storage = makeStorage()
    const resolvers: Array<(v: { code: string; name: string }) => void> = []
    const { mode, mount, navigate } = setup({ asesor: 'a' }, storage, () => new Promise((r) => { resolvers.push(r) }))
    await mount()
    await navigate({ asesor: 'b' })
    resolvers[1]!({ code: 'b', name: 'B' })
    await flush()
    resolvers[0]!({ code: 'a', name: 'A' })
    await flush()
    expect(mode.advisor.value).toEqual({ code: 'b', name: 'B' })
    expect(JSON.parse(storage._store.get(KEY)!)).toEqual({ code: 'b', name: 'B' })
  })

  it('valueless ?asesor (null) counts as present -> not-found toast, no fetch, param stripped', async () => {
    const { mode, mount, $fetch, notify, replace } = setup({ asesor: null, a: 'b' }, makeStorage())
    await mount()
    expect($fetch).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(NOT_FOUND)
    expect(mode.advisor.value).toBeNull()
    expect(replace).toHaveBeenCalledWith({ a: 'b' })
  })

  it('SCEN-001/016: valid code, 200 -> stores {code,name}, sets advisor, strips param keeping others', async () => {
    const storage = makeStorage()
    const { mode, mount, $fetch, replace } = setup(
      { asesor: 'Daniela', utm_source: 'x' },
      storage,
      async () => ({ code: 'daniela', name: 'Daniela' }),
    )
    expect(mode.advisor.value).toBeNull()
    await mount()
    expect($fetch).toHaveBeenCalledTimes(1)
    expect($fetch.mock.calls[0]![0]).toBe('/api/asesor/daniela')
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(JSON.parse(storage._store.get(KEY)!)).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(replace).toHaveBeenCalledWith({ utm_source: 'x' })
  })

  it('encodes the code in the URL and takes the first of repeated values', async () => {
    const { mount, $fetch } = setup({ asesor: ['Old_Code', 'x'] }, makeStorage(), async () => ({ code: 'old_code', name: 'O' }))
    await mount()
    expect($fetch.mock.calls[0]![0]).toBe('/api/asesor/' + encodeURIComponent('old_code'))
  })

  it('creating the session does nothing until start (server render stays null)', () => {
    const { mode, $fetch } = setup({ asesor: 'daniela' }, makeStorage({ [KEY]: DANIELA }))
    expect(mode.advisor.value).toBeNull()
    expect($fetch).not.toHaveBeenCalled()
  })

  it.each(['', 'a b', 'a/b', 'x'.repeat(61)])('SCEN-002/018: invalid code %j -> toast, no fetch, nothing stored, param stripped', async (code) => {
    const storage = makeStorage()
    const { mode, mount, $fetch, notify, replace } = setup({ asesor: code, a: 'b' }, storage)
    await mount()
    expect($fetch).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(NOT_FOUND)
    expect(storage._store.has(KEY)).toBe(false)
    expect(mode.advisor.value).toBeNull()
    expect(replace).toHaveBeenCalledWith({ a: 'b' })
  })

  it('SCEN-002/018: 404 -> not-found toast, nothing stored, no advisor, param stripped', async () => {
    const storage = makeStorage()
    const { mode, mount, notify, replace } = setup({ asesor: 'danela' }, storage, async () => {
      throw httpError(404)
    })
    await mount()
    expect(notify).toHaveBeenCalledWith(NOT_FOUND)
    expect(storage._store.has(KEY)).toBe(false)
    expect(mode.advisor.value).toBeNull()
    expect(replace).toHaveBeenCalledWith({})
  })

  it('a typo in ?asesor never drops an advisor already stored', async () => {
    const storage = makeStorage({ [KEY]: DANIELA })
    const { mode, mount, notify } = setup({ asesor: 'danela' }, storage, async () => {
      throw httpError(404)
    })
    await mount()
    expect(notify).toHaveBeenCalledWith(NOT_FOUND)
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(storage._store.get(KEY)).toBe(DANIELA)
  })

  it.each([[500], [429], [undefined]])('param + error %s -> verify toast, nothing stored, param stripped', async (status) => {
    const storage = makeStorage()
    const { mode, mount, notify, replace } = setup({ asesor: 'daniela' }, storage, async () => {
      throw httpError(status)
    })
    await mount()
    expect(notify).toHaveBeenCalledWith(NO_VERIFY)
    expect(storage._store.has(KEY)).toBe(false)
    expect(mode.advisor.value).toBeNull()
    expect(replace).toHaveBeenCalledWith({})
  })

  it('detects status through error.status too (ofetch FetchError)', async () => {
    const { mount, notify } = setup({ asesor: 'x' }, makeStorage(), async () => {
      throw Object.assign(new Error('x'), { status: 404 })
    })
    await mount()
    expect(notify).toHaveBeenCalledWith(NOT_FOUND)
  })

  it('SCEN-004: legacy "1" is removed, no panel, no fetch', async () => {
    const storage = makeStorage({ [KEY]: '1' })
    const { mode, mount, $fetch } = setup({}, storage)
    await mount()
    expect(mode.advisor.value).toBeNull()
    expect(storage._store.has(KEY)).toBe(false)
    expect($fetch).not.toHaveBeenCalled()
  })

  it('SCEN-004: ?asesor=1 is treated as a code (server decides) -> 404 toast', async () => {
    const { mount, notify, $fetch } = setup({ asesor: '1' }, makeStorage(), async () => {
      throw httpError(404)
    })
    await mount()
    expect($fetch.mock.calls[0]![0]).toBe('/api/asesor/1')
    expect(notify).toHaveBeenCalledWith(NOT_FOUND)
  })

  it('SCEN-005 prelude: stored advisor shows immediately, before revalidation resolves', async () => {
    let release!: (v: unknown) => void
    const { mode, mount } = setup({}, makeStorage({ [KEY]: DANIELA }), () => new Promise((r) => (release = r)))
    await mount()
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
    release({ code: 'daniela', name: 'Daniela' })
  })

  it('revalidation 200 with another name updates stored and advisor', async () => {
    const storage = makeStorage({ [KEY]: DANIELA })
    const { mode, mount, $fetch } = setup({}, storage, async () => ({ code: 'daniela', name: 'Daniela M.' }))
    await mount()
    expect($fetch).toHaveBeenCalledTimes(1)
    expect($fetch.mock.calls[0]![0]).toBe('/api/asesor/daniela')
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela M.' })
    expect(JSON.parse(storage._store.get(KEY)!).name).toBe('Daniela M.')
  })

  it('SCEN-005a: revalidation 404 clears key and advisor', async () => {
    const storage = makeStorage({ [KEY]: DANIELA })
    const { mode, mount } = setup({}, storage, async () => {
      throw httpError(404)
    })
    await mount()
    expect(mode.advisor.value).toBeNull()
    expect(storage._store.has(KEY)).toBe(false)
  })

  it.each([[500], [429], [undefined]])('SCEN-005b: revalidation error %s keeps advisor and key', async (status) => {
    const storage = makeStorage({ [KEY]: DANIELA })
    const { mode, mount, notify } = setup({}, storage, async () => {
      throw httpError(status)
    })
    await mount()
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(storage._store.get(KEY)).toBe(DANIELA)
    expect(notify).not.toHaveBeenCalled()
  })

  it('SCEN-006: ?asesor=0 clears key and advisor, strips param, no fetch', async () => {
    const storage = makeStorage({ [KEY]: DANIELA })
    const { mode, mount, $fetch, replace, notify } = setup({ asesor: '0', a: 'b' }, storage)
    await mount()
    expect(mode.advisor.value).toBeNull()
    expect(storage._store.has(KEY)).toBe(false)
    expect($fetch).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith({ a: 'b' })
  })

  it('SCEN-007/019: no param and nothing stored -> zero $fetch calls, also across navigations', async () => {
    const { mode, mount, navigate, $fetch, replace } = setup({ utm_source: 'fb' }, makeStorage())
    await mount()
    await navigate({ q: '1' })
    await navigate({})
    expect($fetch).not.toHaveBeenCalled()
    expect(mode.advisor.value).toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it('storage that throws: no throw, no fetch without param', async () => {
    const storage = makeStorage()
    storage.getItem = () => {
      throw new Error('private mode')
    }
    const { mode, mount, $fetch } = setup({}, storage)
    await mount()
    expect(mode.advisor.value).toBeNull()
    expect($fetch).not.toHaveBeenCalled()
  })

  it('setItem throwing: advisor still set for the page session on 200', async () => {
    const storage = makeStorage()
    storage.setItem = () => {
      throw new Error('private mode')
    }
    const { mode, mount } = setup({ asesor: 'daniela' }, storage, async () => ({ code: 'daniela', name: 'Daniela' }))
    await mount()
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
  })

  it('reacts to a later client-side navigation with ?asesor=<code>', async () => {
    const storage = makeStorage()
    const { mode, mount, navigate, replace } = setup({}, storage, async () => ({ code: 'daniela', name: 'Daniela' }))
    await mount()
    expect(mode.advisor.value).toBeNull()
    await navigate({ asesor: 'daniela', a: 'b' })
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(replace).toHaveBeenCalledWith({ a: 'b' })
  })

  it('SCEN-017: a navigation with ?asesor on a non-results page activates (no results route involved)', async () => {
    const storage = makeStorage()
    const { mode, mount, navigate } = setup({}, storage, async () => ({ code: 'daniela', name: 'Daniela' }))
    await mount()
    await navigate({ asesor: 'daniela' })
    expect(JSON.parse(storage._store.get(KEY)!)).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(mode.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
  })

  it('the key vanishing from the query does not switch advisor off or refetch', async () => {
    const { mode, mount, navigate, $fetch } = setup({ asesor: 'daniela' }, null, async () => ({ code: 'daniela', name: 'Daniela' }))
    await mount()
    expect(mode.advisor.value).not.toBeNull()
    await navigate({})
    expect(mode.advisor.value).not.toBeNull()
    expect($fetch).toHaveBeenCalledTimes(1)
  })

  it('revalidates a stored advisor only once per start, not on later navigations', async () => {
    const { mount, navigate, $fetch } = setup({}, makeStorage({ [KEY]: DANIELA }), async () => ({ code: 'daniela', name: 'Daniela' }))
    await mount()
    await navigate({ q: '1' })
    await navigate({})
    expect($fetch).toHaveBeenCalledTimes(1)
  })
})
