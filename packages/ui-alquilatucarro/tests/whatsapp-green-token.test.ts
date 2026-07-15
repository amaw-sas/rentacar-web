/**
 * Issue #284 — WhatsApp green token (alquilatucarro).
 * Labeled WA CTAs must use bg-whatsapp + text-black (not free-form green + white).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const pkgRoot = join(__dirname, '..')
const appRoot = join(pkgRoot, 'app')
const mainCss = readFileSync(join(appRoot, 'assets/css/main.css'), 'utf-8')
const layout = readFileSync(join(appRoot, 'layouts/default.vue'), 'utf-8')
const blog = readFileSync(join(appRoot, 'pages/blog/index.vue'), 'utf-8')

describe('issue #284 — WhatsApp green token (alquilatucarro)', () => {
  it('defines --color-whatsapp as #25D366 in main.css @theme', () => {
    expect(mainCss).toMatch(/--color-whatsapp:\s*#25D366/i)
    expect(mainCss).toMatch(/--color-whatsapp-hover:\s*#1EBE5A/i)
  })

  it('mobile menu WhatsApp CTA uses bg-whatsapp + text-black', () => {
    const wa = (layout.match(/<a[\s\S]*?<\/a>/g) ?? []).filter((a) =>
      /franchise\.whatsapp/.test(a),
    )
    expect(wa.length).toBeGreaterThanOrEqual(1)
    for (const a of wa) {
      expect(a).toMatch(/\bbg-whatsapp\b/)
      expect(a).toMatch(/\btext-black\b/)
      expect(a).not.toMatch(/bg-\[#22c55e\]/)
      expect(a).not.toMatch(/\btext-white\b/)
    }
  })

  it('blog WhatsApp CTA uses bg-whatsapp + text-black (not bg-green-600 text-white)', () => {
    expect(blog).toMatch(/franchise\.whatsapp/)
    expect(blog).toMatch(/\bbg-whatsapp\b/)
    expect(blog).toMatch(/\btext-black\b/)
    // the labeled WA pill must not keep the old free-form green+white pairing
    const waLink = (blog.match(/<NuxtLink[\s\S]*?<\/NuxtLink>/g) ?? []).find((b) =>
      /franchise\.whatsapp/.test(b),
    )
    expect(waLink).toBeTruthy()
    expect(waLink!).toMatch(/\bbg-whatsapp\b/)
    expect(waLink!).toMatch(/\btext-black\b/)
    expect(waLink!).not.toMatch(/\bbg-green-\d/)
    expect(waLink!).not.toMatch(/\btext-white\b/)
  })
})
