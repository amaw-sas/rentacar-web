/**
 * Verifies that nuxt.config.ts files across the 3 brands don't reference
 * deprecated runtime config keys. Prevents dead-code drift.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BRANDS = ['alquilatucarro', 'alquilame', 'alquicarros']

function readBrandConfig(brand: string): string {
  const p = join(__dirname, '..', '..', `ui-${brand}`, 'nuxt.config.ts')
  return readFileSync(p, 'utf-8')
}

describe('nuxt.config.ts hygiene', () => {
  // rentacarApiReservasDataEndpoint was the legacy admin-data endpoint
  // (categories, branches, pricing). Data now comes from /api/rentacar-data
  // which reads Supabase directly. The key has zero consumers in the codebase.
  for (const brand of BRANDS) {
    it(`${brand}: no rentacarApiReservasDataEndpoint (deprecated)`, () => {
      const content = readBrandConfig(brand)
      expect(content).not.toContain('rentacarApiReservasDataEndpoint')
    })
  }
})
