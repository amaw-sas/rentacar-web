import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { H3Event } from 'h3'

// Mock Nuxt auto-imports
const mockUseRuntimeConfig = vi.fn()
const mockCreateError = vi.fn((options) => {
  const error = new Error(options.message) as any
  error.statusCode = options.statusCode
  error.data = options.data
  return error
})
const mockDefineEventHandler = vi.fn((handler) => handler)

// Mock getRequestIP (H3 auto-import not available in test environment)
const mockGetRequestIP = vi.fn((event: any) => event?.node?.req?.socket?.remoteAddress || null)

// Setup global mocks
global.useRuntimeConfig = mockUseRuntimeConfig as any
global.createError = mockCreateError as any
global.defineEventHandler = mockDefineEventHandler as any
global.getRequestIP = mockGetRequestIP as any

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Import after mocks
const { logger } = await import('../../utils/logger')

describe('blog-api-auth middleware', () => {
  let middleware: any
  let mockEvent: Partial<H3Event>

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock runtime config
    mockUseRuntimeConfig.mockReturnValue({
      blogApiKey: 'test-key-abc',
    })

    // Import middleware fresh for each test
    const module = await import('../blog-api-auth')
    middleware = module.default

    // Create mock event — remoteAddress can be any IP (no whitelist)
    mockEvent = {
      path: '/api/blog/upload',
      node: {
        req: {
          headers: {
            'x-api-key': 'test-key-abc'
          },
          socket: {
            remoteAddress: '1.2.3.4'
          }
        },
        res: {
          setHeader: vi.fn()
        }
      }
    }
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Path filtering', () => {
    it('should skip non-blog API paths', async () => {
      mockEvent.path = '/api/other'

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.info).not.toHaveBeenCalled()
    })

    it('should skip posts-dynamic endpoint (public)', async () => {
      mockEvent.path = '/api/blog/posts-dynamic'

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.info).not.toHaveBeenCalled()
    })

    it('should skip posts endpoint (public)', async () => {
      mockEvent.path = '/api/blog/posts'

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.info).not.toHaveBeenCalled()
    })

    it('should skip dynamic post endpoint for GET (public read)', async () => {
      mockEvent.path = '/api/blog/post/my-slug'
      mockEvent.method = 'GET'

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.info).not.toHaveBeenCalled()
    })

    it('should NOT bypass auth for DELETE /api/blog/post/:slug', async () => {
      mockUseRuntimeConfig.mockReturnValue({ blogApiKey: 'test-key-abc' })

      const mockEvent = {
        path: '/api/blog/post/my-post',
        method: 'DELETE',
        node: {
          req: {
            headers: {}, // No X-Api-Key header
            socket: { remoteAddress: '127.0.0.1' }
          },
          res: { setHeader: vi.fn() }
        }
      }

      const freshMiddleware = (await import('../../middleware/blog-api-auth')).default
      await expect(freshMiddleware(mockEvent as H3Event)).rejects.toThrow()
    })

    it('should apply security to /api/blog/* endpoints', async () => {
      mockEvent.path = '/api/blog/upload'

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined() // Should pass all checks
      expect(logger.info).toHaveBeenCalledWith(
        'blog-api-auth',
        expect.objectContaining({
          path: '/api/blog/upload'
        })
      )
    })
  })

  describe('IP extraction (for rate limiting and logging)', () => {
    it('should allow requests from any IP with valid API key', async () => {
      mockEvent.node!.req.socket.remoteAddress = '1.2.3.4'

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should extract IP from x-forwarded-for header when behind trusted proxy', async () => {
      mockEvent.node!.req.headers['x-forwarded-for'] = '203.0.113.42'
      mockEvent.node!.req.socket.remoteAddress = '10.1.2.3' // Trusted proxy (private network)

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.info).toHaveBeenCalledWith(
        'blog-api-auth',
        expect.objectContaining({
          ip: '203.0.113.42'
        })
      )
    })

    it('should handle multiple IPs in x-forwarded-for (use last/rightmost)', async () => {
      // GCP LB appends the real client IP at the rightmost position; leftmost is attacker-controlled
      mockEvent.node!.req.headers['x-forwarded-for'] = '10.0.0.2, 127.0.0.1, 203.0.113.42'
      mockEvent.node!.req.socket.remoteAddress = '172.16.0.1' // Trusted proxy

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.info).toHaveBeenCalledWith(
        'blog-api-auth',
        expect.objectContaining({
          ip: '203.0.113.42'  // rightmost = real client IP as appended by GCP load balancer
        })
      )
    })

    it('should NOT trust x-forwarded-for from untrusted IP', async () => {
      mockEvent.node!.req.headers['x-forwarded-for'] = '203.0.113.99'
      mockEvent.node!.req.socket.remoteAddress = '5.6.7.8' // Untrusted public IP

      const result = await middleware(mockEvent as H3Event)

      // Still passes (no whitelist), but uses socket IP for logging
      expect(result).toBeUndefined()
      expect(logger.info).toHaveBeenCalledWith(
        'blog-api-auth',
        expect.objectContaining({
          ip: '5.6.7.8', // Should use socket IP, not x-forwarded-for
        })
      )
    })
  })

  describe('API key validation', () => {
    it('should accept valid API key', async () => {
      mockEvent.node!.req.headers['x-api-key'] = 'test-key-abc'

      const result = await middleware(mockEvent as H3Event)

      expect(result).toBeUndefined()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should reject invalid API key', async () => {
      mockEvent.node!.req.headers['x-api-key'] = 'wrong-key'

      await expect(middleware(mockEvent as H3Event)).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        'blog-api-auth',
        expect.any(Error),
        expect.objectContaining({
          reason: 'Invalid API key'
        })
      )
    })

    it('should reject missing API key', async () => {
      delete mockEvent.node!.req.headers['x-api-key']

      await expect(middleware(mockEvent as H3Event)).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        'blog-api-auth',
        expect.any(Error),
        expect.objectContaining({
          reason: 'Invalid API key'
        })
      )
    })
  })

  // Rate limiting tests removed — the rate limiter is currently stubbed
  // (always returns allowed: true). When Phase 3 reimplements rate limiting
  // (Firebase RTDB → Supabase), these tests should be rewritten against
  // the new storage backend.

  describe('Rate limit headers (stub always allows)', () => {
    it('sets rate limit headers on successful request', async () => {
      await middleware(mockEvent as H3Event)

      const mockSetHeader = mockEvent.node!.res.setHeader as any
      expect(mockSetHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
      expect(mockSetHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '100')
      expect(mockSetHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.stringMatching(/^\d+$/)
      )
    })
  })

  describe('Error responses', () => {
    it('should return 401 for invalid API key', async () => {
      mockEvent.node!.req.headers['x-api-key'] = 'wrong-key'

      try {
        await middleware(mockEvent as H3Event)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.statusCode).toBe(401)
        expect(error.message).toContain('Unauthorized')
      }
    })
  })

  describe('Configuration validation', () => {
    it('should throw 500 if API key not configured', async () => {
      mockUseRuntimeConfig.mockReturnValue({
        blogApiKey: '',
      })

      // Re-import middleware with new config
      vi.resetModules()
      const module = await import('../blog-api-auth')
      const freshMiddleware = module.default

      try {
        await freshMiddleware(mockEvent as H3Event)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.statusCode).toBe(500)
        expect(error.message).toContain('not configured')
      }
    })

    it('should succeed even if blogApiAllowedIps is not configured (no longer required)', async () => {
      mockUseRuntimeConfig.mockReturnValue({
        blogApiKey: 'test-key-abc',
        blogApiAllowedIps: '' // not required anymore
      })

      // Re-import middleware with new config
      vi.resetModules()
      const module = await import('../blog-api-auth')
      const freshMiddleware = module.default

      const result = await freshMiddleware(mockEvent as H3Event)
      expect(result).toBeUndefined() // Should pass — no IP whitelist
    })
  })
})
