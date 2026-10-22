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
    expect(config).toContain('.fleet-tab-daily-stable { width: 142.609375px; height: 2.5rem; }')
    expect(config).toContain('.fleet-tab-monthly-stable { width: 134.15625px; height: 2.5rem; }')
    expect(config).toContain('.xl\\\\:whitespace-nowrap { white-space: nowrap; }')
    expect(fleet).toContain('fleet-tab-daily-stable')
    expect(fleet).toContain('fleet-tab-monthly-stable')
    expect(fleet).toContain('leading-snug xl:whitespace-nowrap')
    expect(fleet).not.toContain('transition-all')
    expect(fleet).toContain('transition-[translate,box-shadow]')
  })

  it('reserves the visible fleet and contact control geometry before entry CSS', () => {
    expect(config).toContain('.h-1 { height: 0.25rem; }')
    expect(config).toContain('.p-1 { padding: 0.25rem; }')
    expect(config).toContain('.py-2\\\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }')
    expect(config).toContain('.mt-3 { margin-top: 0.75rem; }')
    expect(config).toContain('.mb-12 { margin-bottom: 3rem; }')
    expect(config).toContain('.max-w-2xl { max-width: 42rem; }')
    expect(config).toContain('.md\\\\:py-20 { padding-top: 5rem; padding-bottom: 5rem; }')
    expect(config).toContain('.md\\\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }')
    expect(config).toContain('.md\\\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }')

    const chatWidget = read('app/components/ChatWidget.vue')
    expect(chatWidget).toContain('contact-fab-layer fixed inset-0')
    expect(config).toMatch(/\.contact-fab-layer\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;/)
    // SCEN-BC-08/12: the launcher stack is gone (owner decision), so its
    // critical rules go too; the contact bar/pills take their place below.
    expect(config).not.toContain('.contact-fab-stack')
  })

  // The ChatWidget is lazy and client-only, so its scoped CSS can land after it
  // mounts. The critical block gives the bar its fixed geometry and colours from
  // the first frame (no in-flow flash, no shift), as a strict subset of the
  // widget's own rules so the two can never disagree.
  describe('contact surface critical CSS (SCEN-BC-01/02/08)', () => {
    const chatWidget = read('app/components/ChatWidget.vue')
    const start = config.indexOf('/* contact-surface:start */')
    const end = config.indexOf('/* contact-surface:end */')
    const critical = start === -1 || end === -1 ? '' : config.slice(start, end)
    const widgetCss = chatWidget.slice(chatWidget.indexOf('<style scoped>'))
    const desktopStart = (css: string) => css.indexOf('@media (min-width: 768px) {')

    type Rules = Map<string, Map<string, string>>
    function parse(css: string): Rules {
      const out: Rules = new Map()
      for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([.][\w-]+(?:[ >]+[.\w-]+)*)\s*\{([^{}]*)\}/g)) {
        const decls = out.get(m[1]!.trim()) ?? new Map<string, string>()
        for (const d of m[2]!.split(';')) {
          const i = d.indexOf(':')
          if (i > 0) decls.set(d.slice(0, i).trim(), d.slice(i + 1).trim())
        }
        out.set(m[1]!.trim(), decls)
      }
      return out
    }
    function mediaBody(css: string): string {
      const at = desktopStart(css)
      if (at === -1) return ''
      let depth = 0
      for (let i = css.indexOf('{', at); i < css.length; i++) {
        if (css[i] === '{') depth++
        else if (css[i] === '}' && --depth === 0) return css.slice(css.indexOf('{', at) + 1, i)
      }
      return ''
    }
    const criticalBase = parse(desktopStart(critical) === -1 ? critical : critical.slice(0, desktopStart(critical)))
    const criticalDesktop = parse(mediaBody(critical))
    const widgetBase = parse(widgetCss.slice(0, desktopStart(widgetCss)))
    const widgetDesktop = parse(mediaBody(widgetCss))

    it('is present and covers the dock, bar, blocks, colours and the hidden sizer', () => {
      expect(critical, 'contact-surface markers in nuxt.config.ts').not.toBe('')
      for (const sel of ['.contact-dock', '.contact-bar', '.bar-item', '.bar-chat', '.bar-call', '.bar-whatsapp', '.teaser-slot', '.teaser-sizer']) {
        expect(criticalBase.has(sel), sel).toBe(true)
      }
      for (const sel of ['.contact-dock', '.contact-bar', '.bar-item', '.teaser-slot']) {
        expect(criticalDesktop.has(sel), `@media ${sel}`).toBe(true)
      }
      expect(criticalBase.get('.contact-bar')!.get('height')).toBe('calc(64px + env(safe-area-inset-bottom))')
      expect(criticalBase.get('.bar-whatsapp')!.get('background')).toBe('var(--color-contact-whatsapp, #14843f)')
      expect(criticalDesktop.get('.contact-dock')!.get('bottom')).toBe('1.5rem')
      expect(criticalDesktop.get('.bar-item')!.get('height')).toBe('44px')
    })

    it('every critical declaration matches the widget rule it pre-paints', () => {
      for (const [scope, crit, widget] of [['base', criticalBase, widgetBase], ['desktop', criticalDesktop, widgetDesktop]] as const) {
        for (const [sel, decls] of crit) {
          const own = widget.get(sel)
          expect(own, `${scope} ${sel} missing in ChatWidget.vue`).toBeDefined()
          for (const [prop, value] of decls) {
            expect(own!.get(prop), `${scope} ${sel} { ${prop} }`).toBe(value)
          }
        }
      }
    })
  })
})
