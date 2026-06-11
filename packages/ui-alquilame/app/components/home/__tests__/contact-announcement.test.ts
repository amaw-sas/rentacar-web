/**
 * F1 step07a — Contact + Announcement bar + FAB (issue #112).
 *
 * Static-source assertions encoding the observable contract (full runtime/visual
 * check deferred to the F1 preview verification):
 *   - SCEN-F1-03: the home has a dismissible announcement bar, a contact CTA
 *     section, and a floating contact FAB — in the design's style.
 *   - Contact + FAB are CONFIG-DRIVEN: they consume franchise.whatsapp (full URL,
 *     never re-wrapped) and franchise.phone — never the mockup's hardcoded number.
 *   - The announcement bar dismiss state is CLIENT-ONLY (onMounted + v-if guard /
 *     ClientOnly) so SSR/ISR never bakes the closed state (#109 hydration lesson).
 *   - Gradient guard (F0 lesson): contact uses the v4 `bg-linear-to-*` utility,
 *     never the broken v3 `bg-gradient-to-*` alias.
 *   - Headings adopt the `.heading-*` utilities (Plus Jakarta).
 *   - Single FAB: the FAB lives in ChatWidget.vue (mounted once via the layout);
 *     no home component mounts a second ChatWidget.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

// The broken v3 alias, assembled from fragments so this guard file never itself
// contains the literal token a project-wide grep forbids in rendered markup.
const BROKEN_V3_GRADIENT = new RegExp(['bg', 'gradient', 'to-'].join('-'))
// A raw wa.me/<digits> or tel:<digits> literal — forbidden in source (must come
// from franchise.* config instead).
const HARDCODED_WA = /wa\.me\/\d/
const HARDCODED_TEL = /tel:\+?\d/

describe('F1 step07a — Contact.vue', () => {
  const contact = read('app/components/home/Contact.vue')

  it('binds the WhatsApp CTA to franchise.whatsapp (full URL, not re-wrapped)', () => {
    expect(contact).toMatch(/:href="franchise\.whatsapp"/)
    expect(contact).toMatch(/target="_blank"/)
  })

  it('binds the phone CTA to franchise.phone via a tel: link', () => {
    expect(contact).toMatch(/:href="`tel:\$\{franchise\.phone\}`"/)
    expect(contact).toMatch(/\{\{ franchise\.phone \}\}/)
  })

  it('hardcodes NO contact number (no raw wa.me/<digits> or tel:<digits>)', () => {
    expect(contact).not.toMatch(HARDCODED_WA)
    expect(contact).not.toMatch(HARDCODED_TEL)
    expect(contact).not.toMatch(/https:\/\/wa\.me/)
  })

  it('reads franchise from useAppConfig (not a hardcoded brand contact)', () => {
    expect(contact).toMatch(/useAppConfig\(\)/)
  })

  it('renders its gradient via the v4 bg-linear-to-* utility, not the broken v3 alias', () => {
    expect(contact).toMatch(/bg-linear-to-[a-z]/)
    expect(contact).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its heading', () => {
    expect(contact).toMatch(/heading-(section|sub|card)/)
  })

  it('exposes the contact section under id="contact"', () => {
    expect(contact).toMatch(/id="contact"/)
  })
})

describe('F1 step07a — AnnouncementBar.vue', () => {
  const bar = read('app/components/home/AnnouncementBar.vue')

  it('keeps the dismissed state CLIENT-ONLY (onMounted, never baked under SSR)', () => {
    // The bar is revealed only after onMounted flips a flag that starts false,
    // so SSR renders the SSR-safe default — no per-session attribute is baked.
    expect(bar).toMatch(/onMounted\(/)
    expect(bar).toMatch(/const mounted = ref\(false\)/)
  })

  it('guards the bar with a v-if so SSR never renders the closed branch', () => {
    expect(bar).toMatch(/v-if="mounted && !dismissed"/)
  })

  it('isolates the per-session state inside <ClientOnly> (no SSR hydration mismatch)', () => {
    expect(bar).toMatch(/<ClientOnly>/)
  })

  it('persists the dismissed flag to sessionStorage (per-session, client-side)', () => {
    expect(bar).toMatch(/sessionStorage/)
  })

  it('has a dismiss control with an accessible label', () => {
    expect(bar).toMatch(/@click="dismiss"/)
    expect(bar).toMatch(/aria-label="Cerrar anuncio"/)
  })
})

describe('F1 step07a — ChatWidget.vue (FAB restyle in place)', () => {
  const fab = read('app/components/ChatWidget.vue')

  it('drives both contacts from config (franchise.whatsapp full URL + franchise.phone)', () => {
    expect(fab).toMatch(/:href="franchise\.whatsapp"/)
    expect(fab).toMatch(/:href="`tel:\$\{franchise\.phone\}`"/)
    expect(fab).toMatch(/useAppConfig\(\)/)
  })

  it('hardcodes NO contact number (no raw wa.me/<digits> or tel:<digits>)', () => {
    expect(fab).not.toMatch(HARDCODED_WA)
    expect(fab).not.toMatch(HARDCODED_TEL)
    expect(fab).not.toMatch(/https:\/\/wa\.me/)
  })

  it('keeps the open state client-only (starts false, inside ClientOnly)', () => {
    expect(fab).toMatch(/const open = ref\(false\)/)
    expect(fab).toMatch(/<ClientOnly>/)
  })

  it('introduces no broken v3 gradient alias', () => {
    expect(fab).not.toMatch(BROKEN_V3_GRADIENT)
  })
})

describe('F1 step07a — single FAB invariant', () => {
  it('mounts the FAB (ChatWidget) exactly once, via the layout — not in any home component or page', () => {
    // The only allowed mount site is the layout (LazyChatWidget). No home/* SFC
    // and no index.vue may mount ChatWidget, otherwise the page shows two FABs.
    const layout = read('app/layouts/default.vue')
    expect(layout).toMatch(/<LazyChatWidget\b|<ChatWidget\b/)

    const homeDir = join(ROOT, 'app/components/home')
    const homeFiles = readdirSync(homeDir).filter((f) => f.endsWith('.vue'))
    for (const f of homeFiles) {
      const src = read(join('app/components/home', f))
      expect(src, `${f} must not mount a second FAB`).not.toMatch(/<(Lazy)?ChatWidget\b/)
    }

    const index = read('app/pages/index.vue')
    expect(index).not.toMatch(/<(Lazy)?ChatWidget\b/)
  })
})
