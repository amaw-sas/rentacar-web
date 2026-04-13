import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpcMock = vi.fn()

vi.mock('../server/utils/supabase', () => ({
  useSupabaseClient: () => ({
    rpc: rpcMock
  })
}))

import { checkBlogRateLimit } from '../server/utils/rate-limit'

describe('checkBlogRateLimit', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('returns allowed=true with correct structure on success', async () => {
    const resetIso = '2026-04-13T12:00:00.000Z'
    rpcMock.mockResolvedValueOnce({
      data: [{ allowed: true, remaining: 99, reset_at: resetIso }],
      error: null
    })

    const result = await checkBlogRateLimit('1.2.3.4')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(99)
    expect(typeof result.resetAt).toBe('number')
    expect(result.resetAt).toBe(new Date(resetIso).getTime())
  })

  it('passes parameters correctly to the RPC', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ allowed: true, remaining: 50, reset_at: '2026-04-13T12:00:00.000Z' }],
      error: null
    })

    await checkBlogRateLimit('9.8.7.6', 50, 600)

    expect(rpcMock).toHaveBeenCalledWith('check_blog_rate_limit', {
      p_ip: '9.8.7.6',
      p_limit: 50,
      p_window_seconds: 600
    })
  })

  it('uses default limit and window when not provided', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ allowed: true, remaining: 100, reset_at: '2026-04-13T12:00:00.000Z' }],
      error: null
    })

    await checkBlogRateLimit('1.1.1.1')

    expect(rpcMock).toHaveBeenCalledWith('check_blog_rate_limit', {
      p_ip: '1.1.1.1',
      p_limit: 100,
      p_window_seconds: 3600
    })
  })

  it('fails open (allowed=true) when RPC returns an error', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'supabase down' }
    })

    const before = Date.now()
    const result = await checkBlogRateLimit('1.2.3.4', 100, 3600)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(100)
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 3600 * 1000 - 10)
  })

  it('fails open when RPC throws', async () => {
    rpcMock.mockRejectedValueOnce(new Error('network error'))

    const result = await checkBlogRateLimit('1.2.3.4')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(100)
  })

  it('fails open when RPC returns empty array', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null })

    const result = await checkBlogRateLimit('1.2.3.4', 100, 3600)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(100)
  })

  it('converts reset_at ISO string to unix ms', async () => {
    const resetIso = '2026-12-31T23:59:59.000Z'
    rpcMock.mockResolvedValueOnce({
      data: [{ allowed: false, remaining: 0, reset_at: resetIso }],
      error: null
    })

    const result = await checkBlogRateLimit('1.2.3.4')

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.resetAt).toBe(new Date(resetIso).getTime())
    expect(Number.isInteger(result.resetAt)).toBe(true)
  })
})
