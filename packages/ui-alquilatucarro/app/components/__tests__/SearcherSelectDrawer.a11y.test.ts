import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../SearcherSelectDrawerPanel.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X02 (issue #322): the mobile drawer's option buttons must expose the
// selected state to assistive tech, not only visually (border/check icon).
describe('SCEN-322-X02 — drawer options expose their selected state', () => {
  it('binds aria-pressed to the selection on every option button', () => {
    expect(source).toMatch(/:aria-pressed="item\[valueKey\] === modelValue"/)
  })

  it('the aria-pressed binding sits on the v-for option button', () => {
    const btn = /<button[^>]*\n(?:[^>]*\n)*?\s*v-for="item in filteredItems"[\s\S]*?:aria-pressed="item\[valueKey\] === modelValue"/m
    expect(source).toMatch(btn)
  })
})
