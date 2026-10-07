/**
 * SCEN-FAB1 — one launcher FAB, bottom-right, expanding into the channel menu.
 *
 * The launcher (restored 2026-10-06, spec contact-fab-collapse) is the only
 * always-visible button. Chat 24/7 and WhatsApp live in the menu it opens,
 * independently gated by the dashboard, and the whole stack stays anchored to
 * the RIGHT in its normal bottom position. alquilame never had a call action.
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

describe('SCEN-FAB1: a single launcher opens the dashboard-gated Chat and WhatsApp menu', () => {
  it('renders the two channels inside the launcher-controlled menu and no call action', () => {
    // Invariant kept: only Chat + WhatsApp, each behind its own dashboard gate.
    expect(SRC).toContain('<li v-if="chatEnabled"')
    expect(SRC).toContain('<li v-if="whatsappVisible"')
    expect(SRC).toContain('<span class="fab-label">Chat 24 horas</span>')
    expect(SRC).toContain('<span class="fab-label">WhatsApp</span>')
    // Re-pointed: the old "no menu" assertion became "menu is collapsed behind one launcher".
    expect(SRC).toContain('v-show="menuOpen"')
    expect(SRC).toContain('id="contact-fab-menu"')
    expect(SRC).toContain('aria-controls="contact-fab-menu"')
    // Unchanged: alquilame has no call action.
    expect(SRC).not.toContain('Llámanos')
    expect(SRC).not.toContain('fab-call')
  })
})

describe('SCEN-FAB2: FAB stack anchors bottom-right', () => {
  it('the stack container uses right-6 and items-end', () => {
    const stack = SRC.match(/class="contact-fab-stack absolute [^"]*"/)
    expect(stack, 'FAB stack container class not found').not.toBeNull()
    expect(stack![0]).toMatch(/\bright-6\b/)
    expect(stack![0]).toMatch(/\bitems-end\b/)
    expect(stack![0]).not.toMatch(/\bleft-6\b/)
    expect(SRC).toContain('class="flex flex-col items-end gap-3 pointer-events-auto"')
  })

  it('uses the normal bottom position without a reservation offset', () => {
    expect(SRC).toContain('.contact-fab-stack { bottom: 1.5rem; }')
    expect(SRC).not.toContain('contact-fab-stack--reservation')
  })
})

describe('SCEN-FAB3: the whole stack disappears when both channels are OFF', () => {
  it('gates the stack on either live channel', () => {
    expect(SRC).toContain('v-if="(chatEnabled || whatsappVisible) && !hideContactButtons"')
  })

  it('hides the stack on every viewport while the reservation overlay is open', () => {
    // The slideover footer carries its own WhatsApp CTA; the floating stack used
    // to hide only on mobile and sat exactly on top of that CTA on desktop.
    expect(SRC).toContain('const hideContactButtons = computed(() => reservationOverlayOpen.value)')
    expect(SRC).not.toContain('!isDesktop.value && reservationOverlayOpen.value')
    expect(SRC).toMatch(/enabled: chatEnabled,[\s\S]*whatsappVisible,[\s\S]*useChatStatus/)
  })
})

describe('SCEN-FAB4: footer clearance on mobile', () => {
  it('reserves black space for both buttons without changing desktop spacing', () => {
    expect(LAYOUT).toContain('pt-10 pb-40 md:py-10')
  })
})
