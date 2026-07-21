/**
 * F1 step07a — Contact + Announcement bar + FAB (issue #112).
 *
 * Static-source assertions encoding the observable contract (full runtime/visual
 * check deferred to the F1 preview verification):
 *   - SCEN-F1-03: the home has a dismissible announcement bar, a contact CTA
 *     section, and a floating contact FAB — in the design's style.
 *   - Contact CTA is BUTTONS, not a form (golden 10-contact.html paridad visual):
 *     "Reserva Ahora" + WhatsApp. The WhatsApp CTA is CONFIG-DRIVEN
 *     (franchise.whatsapp full URL, never re-wrapped); the FAB additionally drives
 *     franchise.phone. Neither hardcodes the mockup's number.
 *   - WhatsApp green guard (brand hard rule): the contact WhatsApp surface is the
 *     shared bg-whatsapp token (#25D366) + black text — no free-form green-N.
 *   - The announcement bar dismiss state is CLIENT-ONLY (onMounted + v-if guard /
 *     ClientOnly) so SSR/ISR never bakes the closed state (#109 hydration lesson).
 *   - Background guard: contact replicates the golden's radial+linear gradient as
 *     an inline style (radials are not Tailwind utilities) and introduces no
 *     broken v3 `bg-gradient-to-*` alias.
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

  it('uses the shared bg-whatsapp token + black text for the WhatsApp CTA', () => {
    // issue #284: institutional WhatsApp green via theme token; black text for AA.
    // Free-form green-N utilities remain forbidden.
    expect(contact).toMatch(/\bbg-whatsapp\b/)
    expect(contact).toMatch(/\btext-black\b/)
    expect(contact).not.toMatch(/bg-\[#090\]/)
    expect(contact).not.toMatch(/\bbg-green-\d/)
    expect(contact).not.toMatch(/\btext-green-\d/)
  })

  it('hardcodes NO contact number (no raw wa.me/<digits> or tel:<digits>)', () => {
    expect(contact).not.toMatch(HARDCODED_WA)
    expect(contact).not.toMatch(HARDCODED_TEL)
    expect(contact).not.toMatch(/https:\/\/wa\.me/)
  })

  it('reads franchise from useAppConfig (not a hardcoded brand contact)', () => {
    expect(contact).toMatch(/useAppConfig\(\)/)
  })

  it('replicates the golden radial+linear background as an inline style, no broken v3 alias', () => {
    // golden 10-contact.html: the red CTA band is a radial-gradient stack over a
    // linear-gradient — radials are not expressible as Tailwind utilities, so it
    // is bound as an inline :style. Guard the linear red base + the v3 alias ban.
    expect(contact).toMatch(/radial-gradient/)
    expect(contact).toMatch(/linear-gradient\(122deg/)
    expect(contact).not.toMatch(BROKEN_V3_GRADIENT)
  })

  it('adopts the .heading-* utilities (Plus Jakarta) for its heading', () => {
    expect(contact).toMatch(/font-heading/)
  })

  it('exposes the contact section under id="contact"', () => {
    expect(contact).toMatch(/id="contact"/)
  })

  it('makes the "Reserva Ahora" anchor configurable via a reserveAnchor prop (default #hero)', () => {
    // F2 step01: the reserve CTA must anchor to a per-page target. The default
    // keeps the home intact (#hero); the city landing passes '#searcher'.
    expect(contact).toMatch(/defineProps<\{\s*reserveAnchor\?: string\s*\}>/)
    expect(contact).toMatch(/reserveAnchor:\s*'#hero'/)
    // The CTA binds the prop, never the old hardcoded home id.
    expect(contact).toMatch(/:href="reserveAnchor"/)
    expect(contact).not.toMatch(/href="#hero"/)
  })
})

describe('F1 step07a — AnnouncementBar.vue', () => {
  const bar = read('app/components/home/AnnouncementBar.vue')

  it('renders the bar in SSR by default so it does not shift the hero on mount (CLS)', () => {
    // CLS fix (step10 runtime): the bar must occupy its space from first paint.
    // dismissed starts false (SSR-safe default) and the bar is shown under v-if,
    // so SSR + the first client render BOTH show the bar → no hydration mismatch
    // and no post-mount appearance shift that pushes the hero down.
    expect(bar).toMatch(/const dismissed = ref\(false\)/)
    expect(bar).toMatch(/v-if="!dismissed"/)
    // The bar is NOT gated behind a mount flag / ClientOnly (that caused the shift).
    expect(bar).not.toMatch(/v-if="mounted/)
    expect(bar).not.toMatch(/<ClientOnly>/)
  })

  it('keeps the dismissed state CLIENT-ONLY (onMounted restore, never baked under SSR)', () => {
    // Only the per-session dismissed flag is client-side: restored in onMounted
    // (post-hydration, so SSR never observes it) and set on dismiss.
    expect(bar).toMatch(/onMounted\(/)
  })

  it('persists the dismissed flag to sessionStorage (per-session, client-side)', () => {
    expect(bar).toMatch(/sessionStorage/)
  })

  it('has a dismiss control with an accessible label', () => {
    expect(bar).toMatch(/@click="dismiss"/)
    expect(bar).toMatch(/aria-label="Cerrar anuncio"/)
  })

  it('anchors the close button to the centered content container, not the full-bleed bar', () => {
    // Bug (runtime): on wide desktop the absolutely-positioned close button had
    // no positioned ancestor except the full-width bar, so it floated at the far
    // viewport corner and rode above the bar's vertical center (top:50% measured
    // against the bar's py-2 padding box). The inner max-w-7xl content container
    // must be `relative` so the button anchors to the CENTERED content edge and
    // its top-1/2 / -translate-y-1/2 centers within the content line.
    // SCEN-001 / SCEN-002 (announcement-close-button.scenarios.md).
    const containerEl = bar.match(/<div class="[^"]*\bmax-w-7xl\b[^"]*"/)
    expect(containerEl, 'max-w-7xl content container should exist').not.toBeNull()
    expect(containerEl![0]).toMatch(/\brelative\b/)
    // The button keeps its absolute + vertical-centering recipe.
    expect(bar).toMatch(/class="[^"]*\babsolute\b[^"]*top-1\/2[^"]*-translate-y-1\/2/)
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

  it('mounts the FAB tree only on the client (ClientOnly wrapper)', () => {
    // Widget opens the chat panel via openChat() + useChatConversation; there is
    // no local open ref. ClientOnly still gates SSR so the FAB never hydrates
    // with a mismatched shell.
    expect(fab).toMatch(/<ClientOnly>/)
    expect(fab).toMatch(/function openChat\s*\(/)
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

/**
 * Stacking contract (runtime bug):
 *   GIVEN the home scrolled a few px past the top
 *   WHEN  the sticky header (layouts/default.vue → UHeader `sticky top-0 z-50`)
 *         overlaps the announcement bar, which lives inside <main> and therefore
 *         AFTER the header in the DOM
 *   THEN  the header paints ON TOP — the bar slides underneath.
 * With an equal z-index the later DOM node wins the tie, so the bar painted over
 * the header and clipped the logo + the menu toggle. The bar's z MUST be
 * strictly lower than the header's.
 */
describe('AnnouncementBar — stays under the sticky header', () => {
  const zOf = (cls: string): number | null => {
    const m = cls.match(/\bz-(\d+)\b/)
    return m ? Number(m[1]) : null
  }

  it('gives the bar a strictly lower z-index than the sticky header', () => {
    const bar = read('app/components/home/AnnouncementBar.vue')
    const barRoot = bar.match(/<div\s+v-if="!dismissed"\s+class="([^"]+)"/)
    expect(barRoot, 'announcement bar root should carry a class list').not.toBeNull()

    const layout = read('app/layouts/default.vue')
    const headerRoot = layout.match(/<UHeader[\s\S]{0,400}?\bclass="([^"]+)"/)
    expect(headerRoot, 'UHeader should carry a class list').not.toBeNull()

    const barZ = zOf(barRoot![1]!)
    const headerZ = zOf(headerRoot![1]!)
    expect(barZ, 'bar must declare an explicit z-index').not.toBeNull()
    expect(headerZ, 'header must declare an explicit z-index').not.toBeNull()
    expect(barZ!).toBeLessThan(headerZ!)
  })

  it('keeps the bar in normal flow so it scrolls away (never sticky/fixed)', () => {
    const bar = read('app/components/home/AnnouncementBar.vue')
    const barRoot = bar.match(/<div\s+v-if="!dismissed"\s+class="([^"]+)"/)!
    expect(barRoot[1]).not.toMatch(/\b(sticky|fixed)\b/)
  })
})

/**
 * Dismiss behaviour ported from the Astro design:
 *   GIVEN the announcement bar is visible
 *   WHEN  the user taps the close button
 *   THEN  the bar slides up and fades over ~300ms, and only then leaves the
 *         layout — it does not vanish in a single frame, which reads as a
 *         glitch and snaps the whole page upward.
 * Reduced-motion users get the instant removal instead of the slide.
 */
/**
 * Placement — the bar is top chrome, above the header:
 *   GIVEN the home page
 *   WHEN  it renders
 *   THEN  the announcement bar sits ABOVE the logo/menu row, matching the
 *         reference design, and appears on the home route ONLY — /reservas,
 *         city pages and /gana must not carry it.
 * It therefore lives in the layout (the only place that renders the header),
 * behind a home-route guard, instead of being the first child of index.vue.
 */
describe('AnnouncementBar — top chrome, home route only', () => {
  const layout = read('app/layouts/default.vue')

  it('renders in the layout BEFORE the header, not inside the page', () => {
    const barAt = layout.indexOf('AnnouncementBar')
    const headerAt = layout.indexOf('<UHeader')
    expect(barAt, 'layout must mount the announcement bar').toBeGreaterThan(-1)
    expect(headerAt).toBeGreaterThan(-1)
    expect(barAt).toBeLessThan(headerAt)
  })

  it('is gated to the home route so inner pages stay clean', () => {
    const line = layout.split('\n').find((l) => l.includes('AnnouncementBar'))
    expect(line, 'announcement bar mount line not found').toBeDefined()
    expect(line!).toMatch(/v-if="[^"]*isHome[^"]*"/)
    expect(layout).toMatch(/const isHome\s*=\s*computed\(/)
    expect(layout).toMatch(/route\.path === '\/'/)
  })

  it('no longer mounts the bar from the home page itself (no double bar)', () => {
    const index = read('app/pages/index.vue')
    expect(index).not.toMatch(/<HomeAnnouncementBar\b/)
  })
})

describe('AnnouncementBar — animated dismissal', () => {
  const bar = read('app/components/home/AnnouncementBar.vue')

  it('animates out over 300ms before leaving the layout', () => {
    expect(bar).toMatch(/duration-300|300/)
    expect(bar).toMatch(/-translate-y-full/)
    expect(bar).toMatch(/opacity-0/)
    expect(bar).toMatch(/transition/)
  })

  it('drives the exit from a leaving flag, so the node survives the animation', () => {
    // A bare `dismissed = true` unmounts the node instantly and no transition
    // can play. The component needs a separate "leaving" state that applies the
    // exit classes first and flips `dismissed` when the animation ends.
    expect(bar).toMatch(/leaving/)
    expect(bar).toMatch(/setTimeout|onTransitionend|transitionend/)
  })

  it('persists the dismissal only after the animation, keeping it per-session', () => {
    expect(bar).toMatch(/sessionStorage\.setItem/)
    expect(bar).toMatch(/STORAGE_KEY/)
  })

  it('respects prefers-reduced-motion by skipping the slide', () => {
    expect(bar).toMatch(/prefers-reduced-motion/)
  })
})
