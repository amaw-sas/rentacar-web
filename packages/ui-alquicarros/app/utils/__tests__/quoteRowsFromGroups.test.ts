import { describe, it, expect } from 'vitest'
import type { CategoryAvailabilityData } from '@rentacar-main/logic/utils'
import { quoteRowsFromGroups } from '../quoteRowsFromGroups'

const row = (categoryCode: string) => ({ categoryCode }) as CategoryAvailabilityData

describe('quoteRowsFromGroups', () => {
  const rowByCode = new Map([
    ['A', row('A')],
    ['B', row('B')],
    ['C', row('C')],
  ])

  it('follows segment order across every group, collapsed ones included', () => {
    const groups = [{ codes: ['B'] }, { codes: ['C', 'A'] }]
    expect(quoteRowsFromGroups(groups, rowByCode).map((r) => r.categoryCode)).toEqual(['B', 'C', 'A'])
  })

  it('never repeats a code', () => {
    const groups = [{ codes: ['A', 'B'] }, { codes: ['B', 'A'] }]
    expect(quoteRowsFromGroups(groups, rowByCode).map((r) => r.categoryCode)).toEqual(['A', 'B'])
  })

  it('skips codes without a row', () => {
    const groups = [{ codes: ['A', 'Z', 'C'] }]
    expect(quoteRowsFromGroups(groups, rowByCode).map((r) => r.categoryCode)).toEqual(['A', 'C'])
  })
})
