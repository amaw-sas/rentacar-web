/**
 * SCEN-FAB1 — floating contact button: green + bottom-left (operator request,
 * alquilame only).
 *
 * The FAB toggle turns WhatsApp green (#25D366 = bg-whatsapp) with black text
 * (white on #25D366 fails WCAG AA), and the whole stack anchors to the LEFT
 * (left-6, items-start) instead of the right. Menu items and teaser bubble align
 * left accordingly. The visual result and the expanded menu are verified in the
 * browser.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(
  join(__dirname, '..', 'app/components/ChatWidget.vue'),
  'utf-8',
)

describe('SCEN-FAB1: FAB toggle is WhatsApp green with black text', () => {
  it('uses bg-whatsapp + text-black, not bg-primary/text-white', () => {
    const btn = SRC.match(/class="relative flex items-center justify-center w-14 h-14[^"]*"/)
    expect(btn, 'FAB toggle button class not found').not.toBeNull()
    expect(btn![0]).toMatch(/bg-whatsapp/)
    expect(btn![0]).toMatch(/hover:bg-whatsapp-hover/)
    expect(btn![0]).toMatch(/text-black/)
    expect(btn![0]).not.toMatch(/bg-primary/)
  })
})

describe('SCEN-FAB2: FAB stack anchors bottom-left', () => {
  it('the stack container uses left-6 and items-start (no right-6 / items-end)', () => {
    const stack = SRC.match(/class="contact-fab-stack absolute [^"]*"/)
    expect(stack, 'FAB stack container class not found').not.toBeNull()
    expect(stack![0]).toMatch(/\bleft-6\b/)
    expect(stack![0]).toMatch(/\bitems-start\b/)
    expect(stack![0]).not.toMatch(/\bright-6\b/)
  })

  it('no right-anchoring items-end remains on the FAB layout', () => {
    expect(SRC).not.toMatch(/\bitems-end\b/)
  })
})
