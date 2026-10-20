import { describe, expect, it } from 'vitest'
import { createIpWindowLimiter } from '../ipWindowLimiter'

describe('createIpWindowLimiter', () => {
  it('allows up to max then blocks, resetting after the window', () => {
    const l = createIpWindowLimiter({ windowMs: 1000, max: 2, maxIps: 10 })
    expect(l.consume('a', 0)).toMatchObject({ allowed: true, remaining: 1, resetAt: 1000 })
    expect(l.consume('a', 1)).toMatchObject({ allowed: true, remaining: 0 })
    expect(l.consume('a', 2)).toMatchObject({ allowed: false, remaining: 0, resetAt: 1000 })
    expect(l.consume('a', 1000)).toMatchObject({ allowed: true, remaining: 1 })
  })

  it('instances own separate state', () => {
    const a = createIpWindowLimiter({ windowMs: 1000, max: 1, maxIps: 10 })
    const b = createIpWindowLimiter({ windowMs: 1000, max: 1, maxIps: 10 })
    a.consume('x', 0)
    expect(a.consume('x', 1).allowed).toBe(false)
    expect(b.consume('x', 1).allowed).toBe(true)
  })

  it('evicts the oldest IP when maxIps is reached', () => {
    const l = createIpWindowLimiter({ windowMs: 1000, max: 1, maxIps: 2 })
    l.consume('a', 0)
    l.consume('b', 0)
    l.consume('c', 0) // evicts a
    expect(l.consume('a', 1).allowed).toBe(true)
  })
})
