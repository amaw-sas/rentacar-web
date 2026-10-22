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

// Unchanged until step 6 (SCEN-BC-08) swaps it for the bar height.
describe('SCEN-FAB4: footer clearance on mobile', () => {
  it('reserves bottom space on mobile without changing desktop spacing', () => {
    expect(LAYOUT).toContain('pt-10 pb-40 md:py-10')
  })
})
