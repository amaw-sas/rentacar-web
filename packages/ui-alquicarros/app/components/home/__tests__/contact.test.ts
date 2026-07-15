/**
 * Alquicarros reskin — Contact.vue (#contact) redesign holdout.
 *
 * Encodes SCEN-CONTACT-01..05 (+ brand-token + local invariants) as static-source
 * assertions; full runtime verification (SCEN-06 contrast/console, SCEN-02 per-host
 * href, SCEN-07 section order) is done via /agent-browser and reskin-invariants.
 *
 * Design: docs/specs/2026-07-01-alquicarros-contact-doble-ruta-design.md
 * Holdout: docs/specs/alquicarros-contact-redesign/scenarios/contact-doble-ruta.scenarios.md
 *
 * The section moves from the alquilame-cloned full-bleed band (SUV floating right)
 * to a "doble ruta" layout: two action tiles (one per CTA) over a cream background.
 * The two real CTAs are preserved verbatim.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const contact = readFileSync(join(__dirname, '..', 'Contact.vue'), 'utf-8')

describe('reskin — Contact.vue #contact doble-ruta', () => {
  // SCEN-CONTACT-01 — the two real CTAs are preserved with their attributes.
  it('preserves both CTAs with their labels and attributes', () => {
    expect(contact).toMatch(/id="contact"/)
    expect(contact).toContain('Reserva tu Carro Hoy')
    // Reserve CTA
    expect(contact).toContain('Reserva Ahora')
    expect(contact).toMatch(/:href="reserveAnchor"/)
    // WhatsApp CTA
    expect(contact).toContain('Habla con un Asesor')
    expect(contact).toMatch(/:href="franchise\.whatsapp"/)
    expect(contact).toMatch(/target="_blank"/)
    expect(contact).toMatch(/rel="noopener noreferrer"/)
    expect(contact).toMatch(/aria-label="Habla con un asesor por WhatsApp"/)
    expect(contact).toMatch(/WhatsappIcon/)
  })

  // SCEN-CONTACT-02 — reserveAnchor bound verbatim (route-vs-anchor neutral).
  it('binds reserveAnchor verbatim, without wrapping or concatenation', () => {
    // prop preserved with the same signature + default
    expect(contact).toMatch(/reserveAnchor\?:\s*string/)
    expect(contact).toMatch(/reserveAnchor:\s*'#hero'/)
    // no template-string / concatenation around the anchor on the href
    expect(contact).not.toMatch(/:href="`[^"]*\$\{\s*reserveAnchor\s*\}[^"]*`"/)
    expect(contact).not.toMatch(/:href="['"]?#['"]?\s*\+\s*reserveAnchor/)
    expect(contact).not.toMatch(/:href="reserveAnchor\s*\+/)
  })

  // SCEN-CONTACT-03 — differentiated from alquilame: two-tile grid, no SUV.
  it('drops the SUV band and uses a two-column action grid', () => {
    expect(contact).not.toContain('cta-suv.webp')
    expect(contact).toMatch(/md:grid-cols-2/)
  })

  // SCEN-CONTACT-04 — lucide iconography via UIcon, no hand-drawn badge SVGs.
  it('uses UIcon lucide icons, not hand-rolled <svg> badges', () => {
    expect(contact).toMatch(/<UIcon\b/)
    expect(contact).toContain('i-lucide-car')
    expect(contact).toContain('i-lucide-message-circle')
    expect(contact).toContain('i-lucide-wallet')
    expect(contact).toContain('i-lucide-shield-check')
    expect(contact).toContain('i-lucide-headset')
    expect(contact).toContain('i-lucide-map-pinned')
    // the previous trust badges were inline hand-drawn SVGs
    expect(contact).not.toMatch(/<svg\b/)
  })

  // SCEN-CONTACT-05 — city count is derived from useCityCount, not hardcoded.
  it('derives the cities badge from useCityCount (not a hardcoded number)', () => {
    expect(contact).toMatch(/useCityCount\(\)/)
    expect(contact).toMatch(/cityCount\.value/)
  })

  // Local reskin invariants (mirrors reskin-invariants for fast feedback).
  it('uses a brand-* token and avoids red / v3 gradient alias', () => {
    expect(contact).toMatch(/\b(bg|text|from|to|border|ring|shadow)-brand-/)
    expect(contact).not.toMatch(/bg-gradient-to-/)
    expect(contact).not.toMatch(/#cc022b|#cb032c|#a00425|#93070b|#7a001a|#c71a16|#e53a1f|#ff294d|#ff7a45/i)
    expect(contact).not.toMatch(/\b(bg|text|border|from|to|via|ring|shadow|fill)-red-\d/)
    expect(contact).not.toMatch(/Alquilame/i)
  })

  // issue #284 — WhatsApp CTA uses shared token + black text (WCAG AA).
  it('uses the shared bg-whatsapp token with black text (no legacy #090 + white)', () => {
    expect(contact).toMatch(/\bbg-whatsapp\b/)
    expect(contact).toMatch(/text-black/)
    expect(contact).not.toMatch(/bg-\[#090\]/)
    expect(contact).not.toMatch(/bg-\[#090\].*text-white|text-white.*bg-\[#090\]/)
  })
})
