/**
 * SCEN-BC-01/03/04 — contact channels: Chat IA, Llamar and WhatsApp.
 *
 * Rewritten 2026-10-22 (spec 2026-10-22-barra-contacto-alquilame, owner
 * decision): the old launcher and its `#contact-fab-menu` are gone. Every
 * channel is a direct child of `<nav aria-label="Contacto">`. Chat IA and
 * WhatsApp keep their own dashboard gates; Llamar has none, like «Llámanos» on
 * alquilatucarro. Since spec 2026-10-22-contactanos-movil-alquilame the mobile
 * bar became one «Contáctanos» toggle that unfolds that same <nav> (SCEN-CM-*);
 * desktop keeps the pill row. The mount proofs live in
 * app/components/__tests__/ChatWidget.bar.test.ts.
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

describe('SCEN-BC-01: one channel list, three channels in order, no launcher-era menu', () => {
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

  it('has none of the old launcher, menu or menu state left', () => {
    expect(SRC).not.toContain('contact-fab-menu')
    expect(SRC).not.toContain('v-show="menuOpen"')
    expect(SRC).not.toMatch(/\bmenuOpen\b/)
  })

  // SCEN-CM-01/02: the mobile toggle is a real disclosure button for the <nav>.
  it('the «Contáctanos» toggle is a <button> with aria-expanded/aria-controls on the <nav>', () => {
    expect(SRC).toMatch(/<nav\s+ref="barEl"\s+id="contact-menu"/)
    const toggle = SRC.match(/<button\b[^>]*class="contact-toggle[^"]*"[^>]*>/)?.[0] ?? ''
    expect(toggle, 'toggle button not found').not.toBe('')
    expect(toggle).toContain('type="button"')
    expect(toggle).toContain('aria-controls="contact-menu"')
    expect(toggle).toContain(':aria-expanded="contactMenuOpen"')
    expect(toggle).not.toMatch(/v-if=/)
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

describe('SCEN-CM-01: on mobile a 50px button floats bottom-right, no full-width bar', () => {
  it('the dock sits 16px from the right and the bottom (+ safe area)', () => {
    const dock = SRC.match(/\.contact-dock \{[^}]*\}/)?.[0] ?? ''
    expect(dock).toMatch(/right: 16px;/)
    expect(dock).toContain('bottom: calc(16px + env(safe-area-inset-bottom));')
    expect(dock).not.toMatch(/left: 0;/)
    const toggle = SRC.match(/\.contact-toggle \{[^}]*\}/)?.[0] ?? ''
    expect(toggle).toMatch(/height: 50px;/)
    expect(SRC).not.toContain('height: calc(64px + env(safe-area-inset-bottom));')
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

// SCEN-CM-13 (replaces SCEN-BC-08's 64px bar clearance): on mobile the last
// footer line clears the floating button — 24px of air plus its 50px height
// and 16px offset + safe area. md+ clears the pill row instead (SCEN-BC-17);
// one bottom padding per breakpoint, never stacked.
describe('SCEN-CM-13/BC-17: footer clears the «Contáctanos» button (mobile) and the pills (md+)', () => {
  const footerBar = LAYOUT.match(/<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 [^"]*"/)?.[0] ?? ''

  it('reserves 1.5rem + 66px + safe area on mobile and the pill row on md+', () => {
    expect(footerBar, 'footer bottom bar container').not.toBe('')
    expect(footerBar).toContain('pb-[calc(1.5rem+66px+env(safe-area-inset-bottom))]')
    // SCEN-BC-17: at md+ the pill row (24–68px from the bottom) must clear the
    // right-aligned credits: 2.5rem of air + 44px pill + its 1.5rem offset.
    expect(footerBar).toContain('md:pb-[calc(2.5rem+44px+1.5rem)]')
    expect(footerBar).toMatch(/\bpt-10\b/)
  })

  it('no leftover launcher clearance or stacked bottom paddings', () => {
    expect(LAYOUT).not.toContain('pb-40')
    expect(footerBar).not.toMatch(/\bmd:py-10\b/)
    const bottomPaddings = footerBar.match(/(?:^|\s|")(?:md:)?(?:pb|py|p)-[^\s"]+/g) ?? []
    expect(bottomPaddings.map(c => c.trim().replace(/^"/, ''))).toEqual([
      'pb-[calc(1.5rem+66px+env(safe-area-inset-bottom))]',
      'md:pb-[calc(2.5rem+44px+1.5rem)]',
    ])
  })
})
