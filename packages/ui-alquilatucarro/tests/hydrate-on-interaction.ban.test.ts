import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * SCEN-322-P03 — known audit call sites must not steal the first mobile tap.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

describe('SCEN-322-P03 — no hydrate-on-interaction on audited live sites', () => {
  it('alquilatucarro home index has no hydrate-on-interaction', () => {
    const src = readFileSync(resolve(root, 'app/pages/index.vue'), 'utf8')
    expect(src).not.toMatch(/hydrate-on-interaction/)
  })

  it('alquilame city FAQ has no hydrate-on-interaction', () => {
    const src = readFileSync(
      resolve(root, '../ui-alquilame/app/components/city/Faq.vue'),
      'utf8',
    )
    expect(src).not.toMatch(/hydrate-on-interaction/)
  })
})
