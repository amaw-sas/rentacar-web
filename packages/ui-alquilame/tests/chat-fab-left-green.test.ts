/**
 * SCEN-BC-01/03/04 — contact bar: Chat IA, Llamar and WhatsApp, no launcher.
 *
 * Rewritten 2026-10-22 (spec 2026-10-22-barra-contacto-alquilame, owner
 * decision): the single launcher and its `#contact-fab-menu` are gone. Every
 * channel is a direct child of `<nav aria-label="Contacto">`. Chat IA and
 * WhatsApp keep their own dashboard gates; Llamar has none, like «Llámanos» on
 * alquilatucarro. The mount proof (Llamar visible with chat and WhatsApp off)
 * lives in app/components/__tests__/ChatWidget.bar.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(
  join(__dirname, '..', 'app/components/ChatWidget.vue'),
  'utf-8',
)
const LAYOUT = readFileSync(
  join(__dirname, '..', 'app/layouts/default.vue'),
  'utf-8',
)

const nav = SRC.slice(SRC.indexOf('<nav'), SRC.indexOf('</nav>'))
const tagOf = (cls: string) => nav.match(new RegExp(`<(?:a|button)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`))?.[0] ?? ''

describe('SCEN-BC-01: one contact bar, three channels in order, no launcher menu', () => {
  it('renders the channels inside <nav aria-label="Contacto"> as Chat IA, Llamar, WhatsApp', () => {
    expect(SRC).toContain('aria-label="Contacto"')
    const chat = nav.indexOf('bar-chat')
    const call = nav.indexOf('bar-call')
    const wa = nav.indexOf('bar-whatsapp')
    expect(chat).toBeGreaterThan(-1)
    expect(call).toBeGreaterThan(chat)
    expect(wa).toBeGreaterThan(call)
    expect(nav).toContain('<span class="bar-label">Chat IA</span>')
    expect(nav).toContain('<span class="bar-label">Llamar</span>')
    expect(nav).toContain('<span class="bar-label">WhatsApp</span>')
  })

  it('has no launcher, menu or menu state left', () => {
    expect(SRC).not.toContain('contact-fab-menu')
    expect(SRC).not.toContain('v-show="menuOpen"')
    expect(SRC).not.toContain('menuOpen')
  })
})

describe('SCEN-BC-03: WhatsApp follows its gate, Llamar has none', () => {
  it('Chat IA behind chatEnabled, WhatsApp behind whatsappVisible', () => {
    expect(tagOf('bar-chat')).toMatch(/v-if="chatEnabled"/)
    expect(tagOf('bar-whatsapp')).toMatch(/v-if="whatsappVisible"/)
  })

  it('Llamar carries no v-if (SCEN-BC-04: any hour)', () => {
    const call = tagOf('bar-call')
    expect(call, 'Llamar anchor not found').not.toBe('')
    expect(call).not.toMatch(/v-if=/)
    expect(call).not.toMatch(/v-show=/)
  })

  it('the surface only hides with the reservation overlay (SCEN-BC-09)', () => {
    expect(SRC).toContain('v-if="!hideContactButtons"')
    expect(SRC).toContain('const hideContactButtons = computed(() => reservationOverlayOpen.value)')
    expect(SRC).not.toContain('(chatEnabled || whatsappVisible) && !hideContactButtons')
    expect(SRC).toMatch(/enabled: chatEnabled,[\s\S]*whatsappVisible,[\s\S]*useChatStatus/)
  })
})

describe('SCEN-BC-01: the bar sits flush with the bottom edge, full width', () => {
  it('anchors at bottom 0, left 0, right 0 with 64px + safe area', () => {
    const rule = SRC.match(/\.contact-bar \{[^}]*\}/)?.[0] ?? ''
    expect(rule).toMatch(/bottom: 0;/)
    expect(rule).toMatch(/left: 0;/)
    expect(rule).toMatch(/right: 0;/)
    expect(rule).toContain('height: calc(64px + env(safe-area-inset-bottom));')
  })
})

describe('SCEN-BC-02: on desktop the bar becomes pills at bottom 1.5rem', () => {
  // Step 5: the dock (pills + greeting) carries the anchor; same values.
  it('md+ anchors the row bottom-right at 1.5rem, not full width', () => {
    const media = SRC.slice(SRC.indexOf('@media (min-width: 768px) {'))
    expect(SRC).toContain('@media (min-width: 768px) {')
    const rule = media.match(/\.contact-dock \{[^}]*\}/)?.[0] ?? ''
    expect(rule).toMatch(/bottom: 1\.5rem;/)
    expect(rule).toMatch(/right: 1\.5rem;/)
    expect(rule).toMatch(/left: auto;/)
  })
})

// SCEN-BC-08 (replaces SCEN-FAB4, which reserved pb-40 for the removed
// launcher): on mobile the last footer line clears the bar — 40px of air plus
// the bar's own 64px + safe area. md+ keeps the old 2.5rem; one padding each,
// never stacked.
describe('SCEN-BC-08: footer clears the contact bar on mobile', () => {
  const footerBar = LAYOUT.match(/<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 [^"]*"/)?.[0] ?? ''

  it('reserves 2.5rem + 64px + safe area below the legal links, desktop unchanged', () => {
    expect(footerBar, 'footer bottom bar container').not.toBe('')
    expect(footerBar).toContain('pb-[calc(2.5rem+64px+env(safe-area-inset-bottom))]')
    expect(footerBar).toMatch(/\bmd:pb-10\b/)
    expect(footerBar).toMatch(/\bpt-10\b/)
  })

  it('no leftover launcher clearance or stacked bottom paddings', () => {
    expect(LAYOUT).not.toContain('pb-40')
    expect(footerBar).not.toMatch(/\bmd:py-10\b/)
    const bottomPaddings = footerBar.match(/(?:^|\s|")(?:md:)?(?:pb|py|p)-[^\s"]+/g) ?? []
    expect(bottomPaddings.map(c => c.trim().replace(/^"/, ''))).toEqual([
      'pb-[calc(2.5rem+64px+env(safe-area-inset-bottom))]',
      'md:pb-10',
    ])
  })
})
