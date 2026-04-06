import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Nuxt auto-imports — must be set before dynamic import of the middleware
const mockSetResponseHeader = vi.fn()
const mockDefineEventHandler = vi.fn((handler) => handler)

global.setResponseHeader = mockSetResponseHeader as any
global.defineEventHandler = mockDefineEventHandler as any

function makeEvent(path: string) {
  return { path, node: {} } as any
}

describe('blog-cache-control middleware', () => {
  let handler: (event: any) => void

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const module = await import('../blog-cache-control')
    handler = module.default
  })

  it('sets private, no-cache for /blog/* individual post pages', async () => {
    handler(makeEvent('/blog/some-post-slug'))
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      expect.anything(),
      'Cache-Control',
      'private, no-cache'
    )
  })

  it('sets private, no-cache for /api/blog/post/* endpoints', async () => {
    handler(makeEvent('/api/blog/post/some-post-slug'))
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      expect.anything(),
      'Cache-Control',
      'private, no-cache'
    )
  })

  it('does not override Cache-Control for /blog listing page', () => {
    handler(makeEvent('/blog'))
    expect(mockSetResponseHeader).not.toHaveBeenCalled()
  })

  it('does not override Cache-Control for other routes', () => {
    handler(makeEvent('/'))
    handler(makeEvent('/api/blog/posts'))
    handler(makeEvent('/bogota'))
    expect(mockSetResponseHeader).not.toHaveBeenCalled()
  })

  it('does not override Cache-Control for static assets under /_nuxt', () => {
    handler(makeEvent('/_nuxt/chunks/blog.js'))
    expect(mockSetResponseHeader).not.toHaveBeenCalled()
  })
})
