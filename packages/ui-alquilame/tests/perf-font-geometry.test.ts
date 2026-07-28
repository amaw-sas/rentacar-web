import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8')
}

describe('home first-paint geometry', () => {
  const config = read('nuxt.config.ts')
  const hero = read('app/components/home/Hero.vue')
  const fleet = read('app/components/home/Fleet.vue')
  const layout = read('app/layouts/default.vue')

  it('reserves the final mobile hero geometry in critical CSS', () => {
    expect(config).toContain('.py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }')
    expect(config).toContain('.py-3\\\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }')
    expect(config).toContain('.min-h-\\\\[16rem\\\\] { min-height: 16rem; }')
    expect(config).toContain('.max-w-xl { max-width: 36rem; }')

    const lateTextSizeRule = config.indexOf('.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }')
    const titleRule = config.indexOf('.home-hero-title {', lateTextSizeRule)
    expect(titleRule).toBeGreaterThan(lateTextSizeRule)
    expect(config.slice(titleRule, titleRule + 100)).toMatch(/font-size:\s*1\.875rem;[\s\S]*line-height:\s*1\.1;/)
    expect(hero).toMatch(/<h1[^>]*home-hero-title/)
    expect(hero).toContain('home-hero-grid grid')
    expect(hero).toContain('home-hero-copy text-center')
    expect(hero).toContain('home-hero-review-row hero-review-row')
    expect(hero).toContain('home-hero-cta-row')
    expect(config).toContain('.home-hero-grid { gap: 2.5rem; }')
    expect(config).toContain('.home-hero-title { font-size: 3rem; }')
    expect(config).toContain('.home-hero-title { font-size: 3.75rem; }')
  })

  it('keeps the hero trust and CTA label boxes stable across the font handoff', () => {
    expect(config).toMatch(/\.hero-review-label\s*\{[\s\S]*?width:\s*122\.765625px/)
    expect(config).toMatch(/\.hero-contact-label\s*\{[\s\S]*?width:\s*81\.6875px/)
    expect(config).toMatch(/\.hero-review-label\s*\{[^}]*white-space:\s*nowrap;/)
    expect(config).toMatch(/\.hero-contact-label\s*\{[^}]*white-space:\s*nowrap;/)
    expect(hero).toContain('class="hero-review-label ml-2"')
    expect(hero).toContain('class="hero-contact-label"')
    expect(hero).not.toContain('transition-all')
    expect(hero).toContain('transition-[background-color,box-shadow]')
  })

  it('reserves the final desktop header and nav geometry before deferred CSS', () => {
    expect(config).toContain('.lg\\\\:h-20 { height: 5rem; }')
    expect(config).toContain('.lg\\\\:h-9 { height: 2.25rem; }')
    expect(config).toMatch(/border-style:\s*solid;[\s\S]*?border-width:\s*0;/)
    expect(layout).toContain('class="font-stable-nav hidden lg:flex"')
    expect(layout).toContain('header-reservation-cta')
    expect(layout).not.toMatch(/header-reservation-cta[^"\n]*transition-all/)

    const widths = [...config.matchAll(
      /\.font-stable-nav \[data-slot="item"\]:nth-child\(\d\) \[data-slot="linkLabel"\] \{ width: ([\d.]+)px; \}/g,
    )].map(match => Number(match[1]))

    expect(widths).toEqual([35.234375, 32.46875, 62.71875, 68.46875, 26.375, 62.0625])
    expect(widths.reduce((sum, width) => sum + width, 0) + (6 * 20)).toBe(407.328125)
    expect(config).toMatch(/\.header-reservation-cta\s*\{\s*width:\s*136\.8125px;\s*height:\s*35\.984375px;/)
  })

  it('keeps fleet row heights independent of the desktop fallback wrap', () => {
    expect(config).toContain('.fleet-tab-daily-stable { width: 142.609375px; }')
    expect(config).toContain('.fleet-tab-monthly-stable { width: 134.15625px; }')
    expect(config).toContain('.xl\\\\:whitespace-nowrap { white-space: nowrap; }')
    expect(fleet).toContain('fleet-tab-daily-stable')
    expect(fleet).toContain('fleet-tab-monthly-stable')
    expect(fleet).toContain('leading-snug xl:whitespace-nowrap')
    expect(fleet).not.toContain('transition-all')
    expect(fleet).toContain('transition-[translate,box-shadow]')
  })
})
