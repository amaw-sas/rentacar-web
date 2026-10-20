// In-memory, per-instance fixed-window limiter keyed by IP. Each call owns its
// own Map. Unrelated to utils/rate-limit.ts (Supabase-backed).
export interface IpWindowLimiterOptions {
  windowMs: number
  max: number
  maxIps: number
}

export interface IpWindowLimiterResult {
  allowed: boolean
  remaining: number
  count: number
  resetAt: number
}

export function createIpWindowLimiter({ windowMs, max, maxIps }: IpWindowLimiterOptions) {
  const requestsByIp = new Map<string, { count: number; resetAt: number }>()

  function prune(now: number) {
    for (const [ip, entry] of requestsByIp) {
      if (entry.resetAt <= now) requestsByIp.delete(ip)
    }

    if (requestsByIp.size >= maxIps) {
      const oldestIp = requestsByIp.keys().next().value
      if (typeof oldestIp === 'string') requestsByIp.delete(oldestIp)
    }
  }

  function consume(ip: string, now = Date.now()): IpWindowLimiterResult {
    const current = requestsByIp.get(ip)

    if (!current || current.resetAt <= now) {
      prune(now)
      const entry = { count: 1, resetAt: now + windowMs }
      requestsByIp.set(ip, entry)
      return { allowed: true, remaining: max - 1, ...entry }
    }

    if (current.count >= max) {
      return { allowed: false, remaining: 0, ...current }
    }

    current.count += 1
    return { allowed: true, remaining: max - current.count, ...current }
  }

  return { consume }
}
