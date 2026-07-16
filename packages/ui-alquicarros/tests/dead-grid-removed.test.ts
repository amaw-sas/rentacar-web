import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

describe('SCEN-322-D01 — dead alquicarros grid removed', () => {
  it('CategorySelectionSection.vue is deleted', () => {
    expect(existsSync(resolve(root, 'app/components/CategorySelectionSection.vue'))).toBe(false)
  })

  it('CategoryCard.vue is deleted', () => {
    expect(existsSync(resolve(root, 'app/components/CategoryCard.vue'))).toBe(false)
  })

  it('CityPage results does not mount CategorySelectionSection', () => {
    const src = readFileSync(resolve(root, 'app/components/CityPage.vue'), 'utf8')
    expect(src).not.toMatch(/<CategorySelectionSection\b/)
  })
})
