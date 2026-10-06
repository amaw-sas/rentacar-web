/**
 * chat-keyboard-header SCEN-003 — /chat opts into `interactive-widget=resizes-content`
 * in all three brands, so the Android keyboard shrinks the page instead of panning
 * the header off-screen. The real effect is only observable on an Android phone
 * (SCEN-001/002); this guard freezes the opt-in in each brand's page.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const brands = ['ui-alquilatucarro', 'ui-alquilame', 'ui-alquicarros']

describe('chat-keyboard-header SCEN-003: /chat viewport opt-in', () => {
  it.each(brands)('%s /chat declares a single viewport that keeps the base and adds resizes-content', (brand) => {
    const page = readFileSync(join(__dirname, '..', '..', brand, 'app/pages/chat.vue'), 'utf-8')
    const viewport = page.match(/name: 'viewport',\s*content: '([^']+)'/)
    expect(viewport, 'viewport meta in useHead').not.toBeNull()
    const content = viewport![1]
    expect(content).toContain('width=device-width')
    expect(content).toContain('initial-scale=1')
    expect(content).toContain('interactive-widget=resizes-content')
  })
})

// chat-viewport-restore SCEN-001 — Nuxt pushes app.head on the server only; without
// a client default, leaving /chat in-app strips the viewport tag from the document.
describe('chat-viewport-restore SCEN-001: client keeps a default viewport to fall back to', () => {
  it('the shared layer registers the default viewport on the client', () => {
    const plugin = readFileSync(join(__dirname, '..', '..', 'logic/plugins/viewport-default.client.ts'), 'utf-8')
    expect(plugin).toMatch(/useHead\(\{\s*meta: \[\{ name: 'viewport', content: 'width=device-width, initial-scale=1' \}\]/)
  })
})
