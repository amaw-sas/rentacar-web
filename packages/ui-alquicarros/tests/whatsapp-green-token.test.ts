/**
 * Issue #284 — single accessible WhatsApp green token.
 *
 * Encodes SCEN-001..003 as static-source assertions:
 *   - theme defines --color-whatsapp: #25D366
 *   - primary WA CTAs use bg-whatsapp + text-black
 *   - no legacy bg-[#090] remains under ui-alquicarros/app
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

describe('issue #284 — WhatsApp green token (alquicarros)', () => {
  it('defines --color-whatsapp as institutional #25D366 in theme.css', () => {
    expect(theme).toMatch(/--color-whatsapp:\s*#25D366/i)
    expect(theme).toMatch(/--color-whatsapp-hover:\s*#1EBE5A/i)
  })

  it('primary WhatsApp CTA surfaces use bg-whatsapp + text-black', () => {
    const surfaces = [
      'layouts/default.vue',
      'components/home/Hero.vue',
      'components/home/Contact.vue',
      'components/home/Faq.vue',
      'components/city/Faq.vue',
    ]
    for (const rel of surfaces) {
      const src = readFileSync(join(appRoot, rel), 'utf-8')
      // Footer/plain text WA links also bind franchise.whatsapp; only green CTAs
      // carry the token fill. Assert every bg-whatsapp surface pairs text-black.
      const filled = (src.match(/class="[^"]*\bbg-whatsapp\b[^"]*"/g) ?? [])
      expect(filled.length, rel).toBeGreaterThanOrEqual(1)
      for (const cls of filled) {
        expect(cls, rel).toMatch(/\btext-black\b/)
      }
    }
  })

  it('leaves no bg-[#090] WhatsApp anti-pattern under app/', () => {
    const files = walk(appRoot)
    const offenders: string[] = []
    for (const file of files) {
      const src = readFileSync(file, 'utf-8')
      if (/bg-\[#090\]/.test(src)) offenders.push(relative(appRoot, file))
    }
    expect(offenders).toEqual([])
  })

  it('ChatWidget FAB icon color resolves via --color-whatsapp', () => {
    const widget = readFileSync(join(appRoot, 'components/ChatWidget.vue'), 'utf-8')
    expect(widget).toMatch(/\.fab-whatsapp\s*\{\s*color:\s*var\(--color-whatsapp/)
  })
})
