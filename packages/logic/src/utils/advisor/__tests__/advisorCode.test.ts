import { describe, expect, it } from 'vitest'
import { normalizeAdvisorCode } from '../advisorCode'

describe('normalizeAdvisorCode', () => {
  it('trims and lowercases', () => {
    expect(normalizeAdvisorCode('  Daniela ')).toBe('daniela')
    expect(normalizeAdvisorCode('CAMILA-BOT')).toBe('camila-bot')
  })
  it('takes the first element of an array', () => {
    expect(normalizeAdvisorCode(['Dani', 'x'])).toBe('dani')
  })
  it('keeps legacy underscores', () => {
    expect(normalizeAdvisorCode('old_code')).toBe('old_code')
  })
  it('rejects non-strings, empty and blank', () => {
    expect(normalizeAdvisorCode(undefined)).toBeNull()
    expect(normalizeAdvisorCode(null)).toBeNull()
    expect(normalizeAdvisorCode(5)).toBeNull()
    expect(normalizeAdvisorCode('')).toBeNull()
    expect(normalizeAdvisorCode('   ')).toBeNull()
    expect(normalizeAdvisorCode([])).toBeNull()
  })
  it('rejects more than 60 chars, accepts exactly 60', () => {
    expect(normalizeAdvisorCode('a'.repeat(61))).toBeNull()
    expect(normalizeAdvisorCode('a'.repeat(60))).toBe('a'.repeat(60))
  })
  it.each(['a b', 'a/b', 'a?b', 'a#b', 'a\tb'])('rejects %j', (v) => {
    expect(normalizeAdvisorCode(v)).toBeNull()
  })
})
