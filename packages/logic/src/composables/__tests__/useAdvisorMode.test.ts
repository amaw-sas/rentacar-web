import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import useAdvisorMode from '../useAdvisorMode'

// Thin reader of the shared advisor state: no lifecycle, no fetch, no route.
afterEach(() => vi.unstubAllGlobals())

describe('useAdvisorMode', () => {
  it('returns the shared state under the rentacar:advisor key, read-only, with no network', () => {
    const shared = ref<{ code: string; name: string } | null>(null)
    const useState = vi.fn((_key: string, _init?: () => unknown) => shared)
    const $fetch = vi.fn()
    vi.stubGlobal('useState', useState)
    vi.stubGlobal('$fetch', $fetch)
    const a = useAdvisorMode()
    const b = useAdvisorMode()
    expect(useState.mock.calls[0]![0]).toBe('rentacar:advisor')
    expect(useState.mock.calls[0]![1]!()).toBeNull()
    expect(a.advisor.value).toBeNull()
    shared.value = { code: 'daniela', name: 'Daniela' }
    expect(a.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
    expect(b.advisor.value).toEqual({ code: 'daniela', name: 'Daniela' })
    expect($fetch).not.toHaveBeenCalled()
  })
})
