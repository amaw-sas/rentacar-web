import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('SEO schema composables — no Firebase URLs', () => {
  const composablesDir = join(__dirname, '..', 'src', 'composables')

  it('useCityProductSchema has no Firebase Storage URLs', () => {
    const content = readFileSync(join(composablesDir, 'useCityProductSchema.ts'), 'utf-8')
    expect(content).not.toContain('firebasestorage.googleapis.com')
  })

  it('useVideoSchema has no Firebase Storage URLs', () => {
    const content = readFileSync(join(composablesDir, 'useVideoSchema.ts'), 'utf-8')
    expect(content).not.toContain('firebasestorage.googleapis.com')
  })
})
