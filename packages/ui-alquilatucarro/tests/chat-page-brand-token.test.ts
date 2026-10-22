/**
 * chat-direct-entry SCEN-1/2 — /chat keeps its brand color on a direct load.
 *
 * Measured live (2026-10-22): the server strips entry.css on every non-home route
 * and /chat (layout:false) never gets it back on the client, so `--color-brand-*`
 * is missing. Nuxt UI declares `--ui-color-primary-*: var(--color-brand-*, )` with
 * an EMPTY fallback, which leaves `--ui-primary` valid-but-empty: the chat's own
 * `var(--ui-primary, #cc022b)` fallback never fires and the header, send button and
 * option buttons paint transparent (white title on white).
 *
 * The page wrapper ships its own chunk CSS, so it redeclares the token there. Not in
 * ChatConversation.vue: alquicarros/alquilatucarro copies must stay byte-identical
 * (SCEN-ALQ-CHAT-07) while their brand colors differ.
 *
 * SCEN-3 — on desktop the conversation is a centered column, not full width.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkg = (brand: string, file: string) => readFileSync(join(__dirname, '..', '..', brand, file), 'utf-8')
const brand600 = (brand: string) => pkg(brand, 'app/assets/css/theme.css').match(/--color-brand-600:\s*(#[0-9a-f]{6})/i)?.[1]

// alquilatucarro has no brand scale: its primary is Nuxt UI's default green-500
// (measured live as --ui-primary on alquilatucarro.com/medellin).
const expected: Record<string, string | undefined> = {
  'ui-alquilame': brand600('ui-alquilame'),
  'ui-alquicarros': brand600('ui-alquicarros'),
  'ui-alquilatucarro': 'oklch(72.3% 0.219 149.579)',
}

describe('chat-direct-entry SCEN-1/2: /chat declares its brand token without entry.css', () => {
  it.each(Object.keys(expected))('%s .chat-page sets --ui-primary to the brand color', (brand) => {
    const color = expected[brand]
    expect(color, 'brand color resolved').toBeTruthy()
    const page = pkg(brand, 'app/pages/chat.vue')
    const rule = page.match(/\.chat-page \{([^}]*)\}/)?.[1] ?? ''
    expect(rule).toContain(`--ui-primary: ${color};`)
  })
})

describe('chat-direct-entry SCEN-3: /chat is a centered column on desktop', () => {
  it.each(Object.keys(expected))('%s wraps the conversation in a max-width column from 768px', (brand) => {
    const page = pkg(brand, 'app/pages/chat.vue')
    expect(page).toContain('<div class="chat-column">')
    const desktop = page.match(/@media \(min-width: 768px\) \{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(desktop).toMatch(/\.chat-column \{[^}]*max-width: 720px;/)
    expect(desktop).toMatch(/\.chat-column \{[^}]*margin: 0 auto;/)
  })
})

// The X button showed the browser's grey buttonface and the controls fell back to
// Arial: Tailwind's preflight also lives in entry.css. The page re-adds the subset
// the chat relies on, at zero specificity so the chat's own rules keep winning.
describe('chat-direct-entry SCEN-1b: /chat resets form controls without entry.css', () => {
  it.each(Object.keys(expected))('%s declares a zero-specificity control reset under .chat-page', (brand) => {
    const page = pkg(brand, 'app/pages/chat.vue')
    // Must be an UNSCOPED <style>: scoped would append [data-v-*] and stop matching
    // the buttons that live inside ChatConversation.
    const unscoped = [...page.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n')
    expect(unscoped).toContain(':where(.chat-page) :where(button, input, textarea)')
    const reset = page.match(/:where\(\.chat-page\) :where\(button, input, textarea\) \{([^}]*)\}/)?.[1] ?? ''
    expect(reset).toContain('font: inherit;')
    expect(reset).toContain('background-color: transparent;')
    expect(reset).toContain('padding: 0;')
  })
})
