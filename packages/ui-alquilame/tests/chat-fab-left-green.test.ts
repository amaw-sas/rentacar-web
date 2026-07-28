/**
 * SCEN-FAB1 — two direct floating contact buttons, bottom-right.
 *
 * The old expandable toggle and call action are gone. Chat 24/7 and WhatsApp
 * remain directly visible, independently gated by the dashboard, and the whole
 * stack stays anchored to the RIGHT in its normal bottom position.
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

describe('SCEN-FAB1: Chat and WhatsApp are direct dashboard-gated controls', () => {
  it('renders only the two requested channels without an expandable menu', () => {
    expect(SRC).toContain('<li v-if="chatEnabled"')
    expect(SRC).toContain('<li v-if="whatsappVisible"')
    expect(SRC).toContain('<span class="fab-label">Chat 24 horas</span>')
    expect(SRC).toContain('<span class="fab-label">WhatsApp</span>')
    expect(SRC).not.toContain('menuOpen')
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
