import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('app.config.ts — no Firebase URLs', () => {
  const brands = ['alquilatucarro', 'alquilame', 'alquicarros']

  for (const brand of brands) {
    it(`${brand} app.config.ts has no Firebase Storage URLs`, () => {
      const filePath = join(__dirname, '..', '..', `ui-${brand}`, 'app', 'app.config.ts')
      const content = readFileSync(filePath, 'utf-8')
      expect(content).not.toContain('firebasestorage.googleapis.com')
    })
  }
})
