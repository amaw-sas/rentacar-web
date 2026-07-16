import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Issue #322 SCEN-322-N03 — shared blog cache guard (all 3 brands inherit it
 * from this layer). A /blog/<slug> or /api/blog/post/<slug> response that
 * resolved to an error (404 "Artículo no encontrado", 5xx) must be marked
 * `private, no-cache`; valid posts keep the ISR policy from routeRules.
 */

// Mock Nuxt/Nitro auto-imports — must exist before importing the plugin.
const mockSetResponseHeader = vi.fn()
let responseStatus = 200
const mockGetResponseStatus = vi.fn(() => responseStatus)
const mockDefineNitroPlugin = vi.fn((plugin) => plugin)

;(globalThis as Record<string, unknown>).setResponseHeader = mockSetResponseHeader
;(globalThis as Record<string, unknown>).getResponseStatus = mockGetResponseStatus
;(globalThis as Record<string, unknown>).defineNitroPlugin = mockDefineNitroPlugin

function makeEvent(path: string) {
  return { path } as never
}

describe('blog-cache-guard nitro plugin', () => {
  let hook: (event: unknown) => void

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    responseStatus = 200
    const plugin = (await import('../blog-cache-guard')).default as unknown as (app: {
      hooks: { hook: (name: string, fn: (event: unknown) => void) => void }
    }) => void

    const hooks: Record<string, (event: unknown) => void> = {}
    plugin({ hooks: { hook: (name, fn) => { hooks[name] = fn } } })
    expect(hooks.beforeResponse, 'plugin registers a beforeResponse hook').toBeDefined()
    hook = hooks.beforeResponse!
  })

  it('marks a 404 blog post page private, no-cache', () => {
    responseStatus = 404
    hook(makeEvent('/blog/slug-inexistente'))
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      expect.anything(),
      'Cache-Control',
      'private, no-cache'
    )
  })

  it('marks a 404 blog post API response private, no-cache', () => {
    responseStatus = 404
    hook(makeEvent('/api/blog/post/slug-inexistente'))
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      expect.anything(),
      'Cache-Control',
      'private, no-cache'
    )
  })

  it('marks a 5xx blog post response private, no-cache (cold-start failure)', () => {
    responseStatus = 500
    hook(makeEvent('/blog/algun-post'))
    expect(mockSetResponseHeader).toHaveBeenCalled()
  })

  it('leaves a valid (200) post untouched so ISR applies', () => {
    responseStatus = 200
    hook(makeEvent('/blog/post-valido'))
    expect(mockSetResponseHeader).not.toHaveBeenCalled()
  })

  it('ignores the /blog listing and unrelated routes even on 404', () => {
    responseStatus = 404
    hook(makeEvent('/blog'))
    hook(makeEvent('/'))
    hook(makeEvent('/bogota'))
    hook(makeEvent('/api/blog/posts'))
    hook(makeEvent('/_nuxt/chunks/blog.js'))
    expect(mockSetResponseHeader).not.toHaveBeenCalled()
  })
})
