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

// Mock firebase-storage (avoids #imports Nuxt virtual module not available in tests)
vi.mock('../../utils/firebase-storage', () => ({
  getFirebaseApp: vi.fn(() => ({}))
}))

// Mock Firebase Realtime Database - state storage per IP
const rateLimitState: Record<string, { count: number; resetAt: number } | null> = {}

const mockRef = vi.fn((path: string) => {
  // Extract IP from path: blog-api/rate-limits/{ip}
  const ip = path.split('/').pop() || 'unknown'

  return {
    transaction: vi.fn(async (updateFn) => {
      const current = rateLimitState[ip] || null
      const updated = updateFn(current)
      rateLimitState[ip] = updated
      return Promise.resolve({
        snapshot: {
          val: () => updated
        }
      })
    })
  }
})
const mockGetDatabase = vi.fn(() => ({
  ref: mockRef
}))

vi.mock('firebase-admin/database', () => ({
  getDatabase: mockGetDatabase
}))

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

    // Clear rate limit state
    Object.keys(rateLimitState).forEach(key => delete rateLimitState[key])

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

  describe('Rate limiting', () => {
    it('should allow requests under limit (100/hour)', async () => {
      // Make 50 requests
      for (let i = 0; i < 50; i++) {
        const result = await middleware(mockEvent as H3Event)
        expect(result).toBeUndefined()
      }

      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should reject request exceeding 100 requests/hour', async () => {
      // Make 100 requests (should all pass)
      for (let i = 0; i < 100; i++) {
        await middleware(mockEvent as H3Event)
      }

      // 101st request should fail
      await expect(middleware(mockEvent as H3Event)).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        'blog-api-auth-rate-limit',
        expect.any(Error),
        expect.objectContaining({
          limit: 100
        })
      )
    })

    it('should track rate limits per IP separately', async () => {
      const ip1Event = { ...mockEvent }
      const ip2Event = {
        ...mockEvent,
        node: {
          req: {
            headers: { 'x-api-key': 'test-key-abc' },
            socket: { remoteAddress: '9.8.7.6' }
          },
          res: {
            setHeader: vi.fn()
          }
        }
      }

      // Make 100 requests from IP1
      for (let i = 0; i < 100; i++) {
        await middleware(ip1Event as H3Event)
      }

      // IP2 should still be able to make requests
      const result = await middleware(ip2Event as H3Event)
      expect(result).toBeUndefined()
    })

    it('should reset rate limit after 1 hour', async () => {
      vi.useFakeTimers()
      const now = Date.now()
      vi.setSystemTime(now)

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await middleware(mockEvent as H3Event)
      }

      // 101st should fail
      await expect(middleware(mockEvent as H3Event)).rejects.toThrow()

      // Advance time by 1 hour + 1ms
      vi.setSystemTime(now + 60 * 60 * 1000 + 1)

      // Should allow requests again
      const result = await middleware(mockEvent as H3Event)
      expect(result).toBeUndefined()

      vi.useRealTimers()
    })

    it('should set rate limit headers on success', async () => {
      await middleware(mockEvent as H3Event)

      const mockSetHeader = mockEvent.node!.res.setHeader as any
      expect(mockSetHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '100'
      )
      expect(mockSetHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        expect.stringMatching(/^\d+$/)
      )
      expect(mockSetHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.stringMatching(/^\d+$/)
      )
    })

    it('should set rate limit headers on 429 error', async () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await middleware(mockEvent as H3Event)
      }

      // 101st request should fail but should have headers
      try {
        await middleware(mockEvent as H3Event)
        expect.fail('Should have thrown 429 error')
      } catch (error: any) {
        expect(error.statusCode).toBe(429)
      }

      const mockSetHeader = mockEvent.node!.res.setHeader as any
      expect(mockSetHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100')
      expect(mockSetHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0')
      expect(mockSetHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.stringMatching(/^\d+$/))
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

    it('should return 429 for rate limit exceeded', async () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await middleware(mockEvent as H3Event)
      }

      // 101st request
      try {
        await middleware(mockEvent as H3Event)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.statusCode).toBe(429)
        expect(error.message).toContain('Too many requests')
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
