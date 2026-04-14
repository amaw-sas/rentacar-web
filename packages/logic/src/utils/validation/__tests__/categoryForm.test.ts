import { describe, it, expect } from 'vitest'
import * as v from 'valibot'
import { CategoryFormValidationSchema } from '../categoryForm'

// Scenarios:
// - Accepts any non-empty category code string (Localiza adds/renames codes;
//   the admin API validates the catalog, so the client just checks presence).
// - Rejects empty string with the selection-required message.
// - Rejects a missing field entirely.

describe('CategoryFormValidationSchema', () => {
  it('accepts codes that previously weren’t in the hardcoded whitelist', () => {
    // Codes like 'CX', 'AA', 'ZZ' would have been rejected before. They must pass now.
    for (const code of ['C', 'CX', 'AA', 'NEW', 'SOMETHING']) {
      const result = v.safeParse(CategoryFormValidationSchema, { vehiculo: code })
      expect(result.success, `code ${code} should pass`).toBe(true)
    }
  })

  it('rejects an empty string for vehiculo', () => {
    const result = v.safeParse(CategoryFormValidationSchema, { vehiculo: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0]?.message).toMatch(/categor/i)
    }
  })

  it('rejects when vehiculo is missing entirely', () => {
    const result = v.safeParse(CategoryFormValidationSchema, {})
    expect(result.success).toBe(false)
  })
})
