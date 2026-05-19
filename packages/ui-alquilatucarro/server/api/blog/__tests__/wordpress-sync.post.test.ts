import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WordPressPost } from '~/server/utils/wordpress-to-nuxt'

// Mock h3
vi.mock('h3', () => ({
  defineEventHandler: vi.fn((handler) => handler),
  readBody: vi.fn(),
  createError: vi.fn((error) => {
    const err = new Error(error.message) as any
    err.statusCode = error.statusCode
    err.data = error.data
    return err
  })
}))

// Mock all utilities
vi.mock('~/server/utils/wordpress-to-nuxt', () => ({
  transformWordPressToNuxt: vi.fn()
}))

vi.mock('~/server/utils/blob-storage', () => ({
  uploadToStorage: vi.fn()
}))

vi.mock('~/server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    metric: vi.fn()
  }
}))

vi.mock('~/server/utils/error-handler', () => {
  const createError = (error: { statusCode: number; message: string; data?: any }) => {
    const err = new Error(error.message) as any
    err.statusCode = error.statusCode
    err.data = error.data
    return err
  }
  return {
    BlogApiError: class BlogApiError extends Error {
      statusCode: number
      context?: any

      constructor(message: string, statusCode: number, context?: any) {
        super(message)
        this.statusCode = statusCode
        this.context = context
        this.name = 'BlogApiError'
      }
    },
    handleBlogApiError: vi.fn((error: any) => {
      if (error.name === 'BlogApiError') {
        throw createError({
          statusCode: error.statusCode,
          message: error.message,
          data: error.context
        })
      }
      throw createError({
        statusCode: 500,
        message: 'Internal server error'
      })
    })
  }
})

// Stub Nitro auto-imports not available in test environment
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
  public: { rentacarFranchise: 'alquilatucarro' }
})))

// Import handler after mocks
import handler from '../wordpress-sync.post'
import { transformWordPressToNuxt } from '~/server/utils/wordpress-to-nuxt'
import { uploadToStorage } from '~/server/utils/blob-storage'
import { logger } from '~/server/utils/logger'
import { handleBlogApiError } from '~/server/utils/error-handler'
import { readBody } from 'h3'

describe('POST /api/blog/wordpress-sync', () => {
  const mockWordPressPost: WordPressPost = {
    id: 123,
    title: { rendered: 'Test Post Title' },
    content: { rendered: '<p>This is test content</p>' },
    excerpt: { rendered: '<p>This is excerpt</p>' },
    date: '2026-02-13T10:30:00',
    modified: '2026-02-13T12:00:00',
    slug: 'test-post-title',
    _embedded: {
      'wp:featuredmedia': [{
        source_url: 'https://example.com/image.jpg',
        alt_text: 'Test Image'
      }],
      'wp:term': [
        [{ name: 'Guías' }],
        [{ name: 'requisitos' }, { name: 'colombia' }]
      ]
    }
  }

  const mockNuxtPost = {
    slug: 'test-post-title',
    frontmatter: '---\ntitle: "Test Post Title"\n---',
    body: 'This is test content'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully sync WordPress post', async () => {
    // Arrange
    vi.mocked(transformWordPressToNuxt).mockReturnValue(mockNuxtPost)
    vi.mocked(uploadToStorage).mockResolvedValue('https://storage.googleapis.com/bucket/blog-posts/test-post-title.md')
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act
    const result = await handler(event)

    // Assert
    expect(readBody).toHaveBeenCalledWith(event)
    expect(transformWordPressToNuxt).toHaveBeenCalledWith(mockWordPressPost)
    expect(uploadToStorage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'blog-posts/alquilatucarro/test-post-title.md',
      'text/markdown'
    )
    expect(logger.info).toHaveBeenCalledWith('wordpress-sync-start', {
      slug: 'test-post-title',
      id: 123
    })
    expect(logger.metric).toHaveBeenCalledWith('wordpress-sync', expect.any(Number), {
      slug: 'test-post-title',
      size: expect.any(Number)
    })
    expect(result).toEqual({
      success: true,
      filename: 'test-post-title.md',
      path: 'blog-posts/alquilatucarro/test-post-title.md',
      size: expect.any(Number)
    })
  })

  it('should reject request with missing title', async () => {
    // Arrange
    const invalidPost = {
      ...mockWordPressPost,
      title: undefined
    } as any

    vi.mocked(readBody).mockResolvedValue(invalidPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act & Assert
    await expect(handler(event)).rejects.toThrow()
    expect(handleBlogApiError).toHaveBeenCalled()
  })

  it('should reject request with missing content', async () => {
    // Arrange
    const invalidPost = {
      ...mockWordPressPost,
      content: undefined
    } as any

    vi.mocked(readBody).mockResolvedValue(invalidPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act & Assert
    await expect(handler(event)).rejects.toThrow()
    expect(handleBlogApiError).toHaveBeenCalled()
  })

  it('should reject request with missing slug', async () => {
    // Arrange
    const invalidPost = {
      ...mockWordPressPost,
      slug: undefined
    } as any

    vi.mocked(readBody).mockResolvedValue(invalidPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act & Assert
    await expect(handler(event)).rejects.toThrow()
    expect(handleBlogApiError).toHaveBeenCalled()
  })

  it('should reject request with null body', async () => {
    // Arrange
    vi.mocked(readBody).mockResolvedValue(null)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act & Assert
    await expect(handler(event)).rejects.toThrow()
    expect(handleBlogApiError).toHaveBeenCalled()
  })

  it('should transform WordPress post correctly', async () => {
    // Arrange
    vi.mocked(transformWordPressToNuxt).mockReturnValue(mockNuxtPost)
    vi.mocked(uploadToStorage).mockResolvedValue('https://storage.googleapis.com/bucket/blog-posts/test-post-title.md')
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act
    await handler(event)

    // Assert
    expect(transformWordPressToNuxt).toHaveBeenCalledTimes(1)
    expect(transformWordPressToNuxt).toHaveBeenCalledWith(mockWordPressPost)
  })

  it('should upload markdown to correct Firebase path', async () => {
    // Arrange
    vi.mocked(transformWordPressToNuxt).mockReturnValue(mockNuxtPost)
    vi.mocked(uploadToStorage).mockResolvedValue('https://storage.googleapis.com/bucket/blog-posts/test-post-title.md')
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act
    await handler(event)

    // Assert
    const uploadCall = vi.mocked(uploadToStorage).mock.calls[0]
    expect(uploadCall[1]).toBe('blog-posts/alquilatucarro/test-post-title.md')
    expect(uploadCall[2]).toBe('text/markdown')
  })

  it('should upload .md WITHOUT any cacheControlMaxAge (SCEN-004 regression)', async () => {
    // Arrange
    vi.mocked(transformWordPressToNuxt).mockReturnValue(mockNuxtPost)
    vi.mocked(uploadToStorage).mockResolvedValue('https://storage.googleapis.com/bucket/blog-posts/test-post-title.md')
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act
    await handler(event)

    // Assert: storage call must carry no TTL arg (Blob default preserved for .md)
    const uploadCall = vi.mocked(uploadToStorage).mock.calls[0]
    expect(uploadCall[3]).toBeUndefined()
  })

  it('should generate markdown with frontmatter and body', async () => {
    // Arrange
    vi.mocked(transformWordPressToNuxt).mockReturnValue(mockNuxtPost)
    vi.mocked(uploadToStorage).mockResolvedValue('https://storage.googleapis.com/bucket/blog-posts/test-post-title.md')
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act
    await handler(event)

    // Assert
    const uploadCall = vi.mocked(uploadToStorage).mock.calls[0]
    const buffer = uploadCall[0] as Buffer
    const content = buffer.toString('utf-8')
    expect(content).toContain('---\ntitle: "Test Post Title"\n---')
    expect(content).toContain('This is test content')
  })

  it('should return response with correct format', async () => {
    // Arrange
    vi.mocked(transformWordPressToNuxt).mockReturnValue(mockNuxtPost)
    vi.mocked(uploadToStorage).mockResolvedValue('https://storage.googleapis.com/bucket/blog-posts/test-post-title.md')
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act
    const result = await handler(event)

    // Assert
    expect(result).toHaveProperty('success', true)
    expect(result).toHaveProperty('filename', 'test-post-title.md')
    expect(result).toHaveProperty('path', 'blog-posts/alquilatucarro/test-post-title.md')
    expect(result).toHaveProperty('size')
    expect(typeof result.size).toBe('number')
  })

  it('should handle transformation errors gracefully', async () => {
    // Arrange
    const transformError = new Error('Transformation failed')
    vi.mocked(transformWordPressToNuxt).mockImplementation(() => {
      throw transformError
    })
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act & Assert
    await expect(handler(event)).rejects.toThrow()
    expect(handleBlogApiError).toHaveBeenCalledWith(transformError, 'wordpress-sync')
  })

  it('should handle Firebase upload errors gracefully', async () => {
    // Arrange
    vi.mocked(transformWordPressToNuxt).mockReturnValue(mockNuxtPost)
    const uploadError = new Error('Upload failed')
    vi.mocked(uploadToStorage).mockRejectedValue(uploadError)
    vi.mocked(readBody).mockResolvedValue(mockWordPressPost)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act & Assert
    await expect(handler(event)).rejects.toThrow()
    expect(handleBlogApiError).toHaveBeenCalledWith(uploadError, 'wordpress-sync')
  })

  it('should handle WordPress posts without _embedded data', async () => {
    // Arrange
    const postWithoutEmbedded: WordPressPost = {
      id: 456,
      title: { rendered: 'Simple Post' },
      content: { rendered: '<p>Simple content</p>' },
      excerpt: { rendered: '<p>Simple excerpt</p>' },
      date: '2026-02-15T10:00:00',
      modified: '2026-02-15T11:00:00',
      slug: 'simple-post'
      // No _embedded field
    }

    vi.mocked(transformWordPressToNuxt).mockReturnValue({
      slug: 'simple-post',
      frontmatter: '---\ntitle: "Simple Post"\n---',
      body: 'Simple content'
    })
    vi.mocked(uploadToStorage).mockResolvedValue('https://storage.googleapis.com/bucket/blog-posts/simple-post.md')
    vi.mocked(readBody).mockResolvedValue(postWithoutEmbedded)

    const event = {
      node: { req: {}, res: {} }
    } as any

    // Act
    const result = await handler(event)

    // Assert
    expect(result.success).toBe(true)
    expect(result.filename).toBe('simple-post.md')
  })
})
