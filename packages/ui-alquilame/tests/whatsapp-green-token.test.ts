/**
 * Issue #284 — single accessible WhatsApp green token (alquilame).
 *
 * Mirrors ui-alquicarros/tests/whatsapp-green-token.test.ts for the red brand.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const pkgRoot = join(__dirname, '..')
const appRoot = join(pkgRoot, 'app')
const theme = readFileSync(join(appRoot, 'assets/css/theme.css'), 'utf-8')

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, acc)
    else if (/\.(vue|css|ts)$/.test(name) && !name.includes('.test.')) acc.push(full)
  }
  return acc
}

describe('issue #284 — WhatsApp green token (alquilame)', () => {
  it('defines --color-whatsapp as institutional #25D366 in theme.css', () => {
    expect(theme).toMatch(/--color-whatsapp:\s*#25D366/i)
    expect(theme).toMatch(/--color-whatsapp-hover:\s*#1EBE5A/i)
  })

  it('primary WhatsApp CTA surfaces use bg-whatsapp + text-black on the same class', () => {
    const surfaces = [
      'layouts/default.vue',
      'components/home/Hero.vue',
      'components/home/Contact.vue',
    ]
    for (const rel of surfaces) {
      const src = readFileSync(join(appRoot, rel), 'utf-8')
      const filled = (src.match(/class="[^"]*\bbg-whatsapp\b[^"]*"/g) ?? [])
      expect(filled.length, rel).toBeGreaterThanOrEqual(1)
      for (const cls of filled) {
        expect(cls, rel).toMatch(/\btext-black\b/)
      }
    }
  })

  it('leaves no bg-[#090] under app/', () => {
    const files = walk(appRoot)
    const offenders: string[] = []
    for (const file of files) {
      const src = readFileSync(file, 'utf-8')
      if (/bg-\[#090\]/.test(src)) offenders.push(relative(appRoot, file))
    }
    expect(offenders).toEqual([])
  })

  // SCEN-BC-01 (spec 2026-10-22-barra-contacto-alquilame): the contact bar
  // paints WhatsApp as a FILLED block with white text, and white on #25D366 is
  // ~2:1. It uses its own darker token (#14843F, 4.77:1 measured) so
  // --color-whatsapp above keeps its black-text CTAs untouched.
  it('ChatWidget WhatsApp block fills with --color-contact-whatsapp (#14843F) and white text', () => {
    const widget = readFileSync(join(appRoot, 'components/ChatWidget.vue'), 'utf-8')
    expect(theme).toMatch(/--color-contact-whatsapp:\s*#14843F/i)
    expect(widget).toMatch(/\.bar-whatsapp\s*\{\s*background:\s*var\(--color-contact-whatsapp, #14843f\);\s*\}/i)
    expect(widget).toMatch(/\.bar-item \{[^}]*color: #fff;/)
    expect(widget).not.toMatch(/var\(--color-whatsapp\b/)
  })
})
