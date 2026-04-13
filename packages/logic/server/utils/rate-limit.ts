/**
 * Blog API rate limiter backed by Supabase RPC `check_blog_rate_limit`.
 *
 * Fail-open design: when the RPC errors (Supabase down, network issue),
 * requests are allowed through. Auth via API key remains the primary defense;
 * rate limiting is a secondary layer and must not take down the blog API
 * on a Supabase outage.
 */

import { useSupabaseClient } from './supabase'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Unix timestamp in milliseconds when the current window resets */
  resetAt: number
}

interface RpcRow {
  allowed: boolean
  remaining: number
  reset_at: string
}

export async function checkBlogRateLimit(
  ip: string,
  limit = 100,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.rpc('check_blog_rate_limit', {
      p_ip: ip,
      p_limit: limit,
      p_window_seconds: windowSeconds
    })

    if (error || !data) {
      return failOpen(limit, windowSeconds)
    }

    const row: RpcRow | undefined = Array.isArray(data) ? data[0] : data
    if (!row) {
      return failOpen(limit, windowSeconds)
    }

    return {
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at).getTime()
    }
  } catch {
    return failOpen(limit, windowSeconds)
  }
}

function failOpen(limit: number, windowSeconds: number): RateLimitResult {
  return {
    allowed: true,
    remaining: limit,
    resetAt: Date.now() + windowSeconds * 1000
  }
}
