import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

// Auto-import mocks
const mockGetRouterParam = vi.fn()
const mockDefineEventHandler = vi.fn((handler) => handler)
const mockUseRuntimeConfig = vi.fn(() => ({
  public: { rentacarFranchise: 'alquilatucarro' }
}))
global.getRouterParam = mockGetRouterParam as any
global.defineEventHandler = mockDefineEventHandler as any
global.useRuntimeConfig = mockUseRuntimeConfig as any

// Mock blob-storage
const mockDownloadFromStorage = vi.fn()
const mockDeleteFromStorage = vi.fn()
vi.mock('../../../../utils/blob-storage', () => ({
  downloadFromStorage: (...args: any[]) => mockDownloadFromStorage(...args),
  deleteFromStorage: (...args: any[]) => mockDeleteFromStorage(...args),
}))

// Mock content-dynamic-loader
const mockInvalidateCache = vi.fn()
vi.mock('../../../../plugins/content-dynamic-loader', () => ({
  invalidateCache: () => mockInvalidateCache()
}))

// Mock logger
vi.mock('../../../../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), metric: vi.fn() }
}))

// Mock error-handler
vi.mock('../../../../utils/error-handler', () => ({
  BlogApiError: class BlogApiError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.statusCode = statusCode
    }
  },
  handleBlogApiError: vi.fn((error) => { throw error })
}))

function makeEvent(slug: string | undefined): H3Event {
  mockGetRouterParam.mockReturnValue(slug)
  return {} as H3Event
}

describe('DELETE /api/blog/post/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteFromStorage.mockResolvedValue(undefined)
    mockInvalidateCache.mockReturnValue(undefined)
  })

  it('should delete post and referenced images, return summary', async () => {
    const heroUrl = 'https://xxx.public.blob.vercel-storage.com/blog-images/featured/123-abc.webp'
    const inlineUrl = 'https://xxx.public.blob.vercel-storage.com/blog-images/content/456-def.webp'
    const markdownWithImages = `---
title: Test Post
---
![hero](${heroUrl})

Some text

![inline](${inlineUrl})
`
    mockDownloadFromStorage.mockResolvedValue(Buffer.from(markdownWithImages))

    const handler = (await import('../[slug].delete')).default
    const result = await handler(makeEvent('my-post'))

    expect(result.success).toBe(true)
    expect(result.deleted.post).toBe('blog-posts/alquilatucarro/my-post.md')
    expect(result.deleted.images).toHaveLength(2)
    expect(result.deleted.images).toContain(heroUrl)
    expect(result.deleted.images).toContain(inlineUrl)
    expect(mockDeleteFromStorage).toHaveBeenCalledTimes(3) // 2 images + 1 post
    expect(mockInvalidateCache).toHaveBeenCalledOnce()
  })

  it('should delete post with no images', async () => {
    mockDownloadFromStorage.mockResolvedValue(Buffer.from('---\ntitle: No images\n---\nJust text.'))

    const handler = (await import('../[slug].delete')).default
    const result = await handler(makeEvent('text-only-post'))

    expect(result.success).toBe(true)
    expect(result.deleted.images).toHaveLength(0)
    expect(mockDeleteFromStorage).toHaveBeenCalledTimes(1) // only the post
    expect(mockInvalidateCache).toHaveBeenCalledOnce()
  })

  it('should return 400 for missing slug', async () => {
    const { BlogApiError } = await import('../../../../utils/error-handler')
    const handler = (await import('../[slug].delete')).default

    await expect(handler(makeEvent(undefined))).rejects.toThrow(BlogApiError)
    expect(mockDeleteFromStorage).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid slug format', async () => {
    const { BlogApiError } = await import('../../../../utils/error-handler')
    const handler = (await import('../[slug].delete')).default

    await expect(handler(makeEvent('../../../etc/passwd'))).rejects.toThrow(BlogApiError)
    expect(mockDeleteFromStorage).not.toHaveBeenCalled()
  })

  it('should return 404 when post does not exist', async () => {
    const { BlogApiError } = await import('../../../../utils/error-handler')
    mockDownloadFromStorage.mockRejectedValue(new BlogApiError('File not found', 404))

    const handler = (await import('../[slug].delete')).default

    await expect(handler(makeEvent('ghost-post'))).rejects.toThrow(BlogApiError)
    expect(mockInvalidateCache).not.toHaveBeenCalled()
  })

  it('should delete post even if some image deletions fail (best-effort)', async () => {
    const markdown = `![img](https://xxx.public.blob.vercel-storage.com/blog-images/featured/fail.webp)`
    mockDownloadFromStorage.mockResolvedValue(Buffer.from(markdown))
    // First call (image) fails, second call (post) succeeds
    mockDeleteFromStorage
      .mockRejectedValueOnce(new Error('Image already gone'))
      .mockResolvedValueOnce(undefined)

    const handler = (await import('../[slug].delete')).default
    const result = await handler(makeEvent('partial-post'))

    expect(result.success).toBe(true)
    expect(result.deleted.images).toHaveLength(0) // failed images not counted
    expect(mockInvalidateCache).toHaveBeenCalledOnce()
  })
})
