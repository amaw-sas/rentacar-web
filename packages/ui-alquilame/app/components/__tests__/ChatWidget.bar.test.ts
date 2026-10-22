// @vitest-environment jsdom
// SCEN-BC-01, 03, 04, 05 (mobile), 09, 10 (channels) of
// docs/specs/2026-10-22-barra-contacto-alquilame/design.md — mounted DOM.
// Replaces ChatWidget.launcher.test.ts: the single launcher and its menu are
// gone by owner decision. alquilame now shows a contact bar with Chat IA,
// Llamar and WhatsApp always one tap away. Gates (chatEnabled /
// whatsappVisible), unread counts, the teaser and the reservation overlay are
// driven through refs so every state is reachable. Source assertions at the
// bottom cover only what a mount cannot observe: colours (jsdom does not apply
// scoped CSS), the ResizeObserver wiring and the Escape listener (registered
// behind `import.meta.client`, which vitest leaves undefined).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineAsyncComponent, type Ref } from 'vue'
import { useCallPhone } from '@rentacar-main/logic/composables/useCallPhone'
import ChatWidget from '../ChatWidget.vue'

// The panel body is irrelevant here; avoid loading the real conversation graph.
vi.mock('../ChatConversation.vue', () => ({
  // Vue/VTU probe these flags on the loaded module; the mock proxy throws on
  // unknown keys, so they are declared explicitly.
  __esModule: true,
  __isTeleport: undefined,
  __isKeepAlive: undefined,
  __isSuspense: undefined,
  default: { name: 'ChatConversationStub', template: '<div class="conversation-stub" />' },
}))

const franchise = {
  shortname: 'alquilame',
  phone: '+57 300 243 6677',
  whatsapp: 'https://wa.me/573002436677',
}

interface Harness {
  chatEnabled: Ref<boolean>
  whatsappVisible: Ref<boolean>
  overlayOpen: Ref<boolean>
  unread: Ref<number>
  syntheticCount: Ref<number>
  teaserVisible: Ref<boolean>
  engage: ReturnType<typeof vi.fn>
  navigateTo: ReturnType<typeof vi.fn>
  prepareChatOpen: ReturnType<typeof vi.fn>
}

let h: Harness
let wrapper: VueWrapper | null = null
let state: Map<string, Ref<unknown>>

function stubMatchMedia(desktop: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: desktop && query.includes('768px'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }))
}

function stubNuxtGlobals(route = '/') {
  h = {
    chatEnabled: ref(true),
    whatsappVisible: ref(true),
    overlayOpen: ref(false),
    unread: ref(0),
    syntheticCount: ref(0),
    teaserVisible: ref(false),
    engage: vi.fn(),
    navigateTo: vi.fn(),
    prepareChatOpen: vi.fn(),
  }
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onMounted', onMounted)
  vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
  vi.stubGlobal('nextTick', nextTick)
  vi.stubGlobal('defineAsyncComponent', defineAsyncComponent)
  vi.stubGlobal('useAppConfig', () => ({ franchise }))
  vi.stubGlobal('useRoute', () => ({ path: route }))
  vi.stubGlobal('useStoreSearchData', () => ({ reservationOverlayOpen: h.overlayOpen }))
  vi.stubGlobal('storeToRefs', (store: Record<string, unknown>) => store)
  vi.stubGlobal('useState', (key: string, init: () => unknown) => {
    if (!state.has(key)) state.set(key, ref(init()))
    return state.get(key)
  })
  vi.stubGlobal('navigateTo', h.navigateTo)
  // The real composable: the bar must dial whatever it resolves, never a
  // hand-built number.
  vi.stubGlobal('useCallPhone', useCallPhone)
  vi.stubGlobal('useChatStatus', () => ({
    enabled: h.chatEnabled,
    whatsappVisible: h.whatsappVisible,
    resolved: ref(true),
  }))
  vi.stubGlobal('useChatUnreadBadge', () => ({
    unread: h.unread,
    announce: ref(''),
    emitReopenedFromBadge: vi.fn(),
    prepareChatOpen: h.prepareChatOpen,
  }))
  vi.stubGlobal('useContactTeaser', () => ({
    syntheticCount: h.syntheticCount,
    teaserVisible: h.teaserVisible,
    teaserStep: ref(1),
    teaserAnnounce: ref(''),
    start: vi.fn(),
    stop: vi.fn(),
    dismiss: vi.fn(),
    engage: h.engage,
    suppressForSession: vi.fn(),
  }))
}

const settle = async () => {
  await flushPromises()
  await nextTick()
}

async function mountWidget() {
  wrapper = mount(ChatWidget, { global: { stubs: { ClientOnly: { template: '<div><slot /></div>' } } } })
  await settle()
}

const q = <T extends Element = HTMLElement>(sel: string) => document.body.querySelector<T>(sel)
const bar = () => q<HTMLElement>('nav[aria-label="Contacto"]')
const items = () => [...(bar()?.children ?? [])] as HTMLElement[]
const chatButton = () => q<HTMLButtonElement>('nav[aria-label="Contacto"] button.bar-chat')
const callLink = () => q<HTMLAnchorElement>('nav[aria-label="Contacto"] a.bar-call')
const waLink = () => q<HTMLAnchorElement>('nav[aria-label="Contacto"] a.bar-whatsapp')
const backdrop = () => q<HTMLButtonElement>('button[aria-hidden="true"].bg-black\\/50')
const panel = () => q('[role="dialog"]')
const bubble = () => q('.teaser-bubble.pointer-events-auto')
const badge = () => chatButton()?.querySelector('.bar-badge') ?? null

async function click(el: Element | null) {
  expect(el, 'element to click is missing').not.toBeNull()
  el!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await settle()
}

beforeEach(() => {
  state = new Map()
  stubMatchMedia(false)
  stubNuxtGlobals()
  const appRoot = document.createElement('div')
  appRoot.id = '__nuxt'
  document.body.appendChild(appRoot)
  // jsdom cannot navigate to wa.me / tel:; cancel the default after Vue ran.
  document.addEventListener('click', e => e.preventDefault())
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('SCEN-BC-01 — mobile: one bar, Chat IA · Llamar · WhatsApp, in that order', () => {
  it('renders the three channels as direct children of <nav aria-label="Contacto">', async () => {
    await mountWidget()
    expect(document.body.querySelectorAll('nav[aria-label="Contacto"]')).toHaveLength(1)
    const blocks = items()
    expect(blocks).toHaveLength(3)
    expect(blocks.map(b => b.textContent?.trim())).toEqual(['Chat IA', 'Llamar', 'WhatsApp'])
    expect(blocks[0]).toBe(chatButton())
    expect(blocks[1]).toBe(callLink())
    expect(blocks[2]).toBe(waLink())
  })

  it('every block shares one equal-width item class and carries its own colour class', async () => {
    await mountWidget()
    const [chat, call, wa] = items()
    for (const block of [chat, call, wa]) expect(block!.classList.contains('bar-item')).toBe(true)
    expect(chat!.classList.contains('bar-chat')).toBe(true)
    expect(call!.classList.contains('bar-call')).toBe(true)
    expect(wa!.classList.contains('bar-whatsapp')).toBe(true)
  })

  it('no launcher, no channel menu: nothing to expand first', async () => {
    await mountWidget()
    expect(q('#contact-fab-menu')).toBeNull()
    expect(q('[aria-controls="contact-fab-menu"]')).toBeNull()
    expect(document.body.querySelectorAll('[aria-expanded]').length).toBeLessThanOrEqual(1)
    expect(backdrop()).toBeNull()
  })

  it('every icon is decorative; the label is the accessible name', async () => {
    await mountWidget()
    expect(items()).toHaveLength(3)
    for (const block of items()) {
      const svg = block.querySelector('svg')
      expect(svg, block.textContent ?? '').not.toBeNull()
      expect(svg!.getAttribute('aria-hidden')).toBe('true')
      // Icon comes first in the block, so the column renders it above the label.
      const label = block.querySelector('.bar-label')!
      expect(svg!.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })
})

describe('SCEN-BC-03 — WhatsApp out of hours: two blocks, Llamar stays', () => {
  it('whatsappVisible=false leaves exactly Chat IA and Llamar', async () => {
    h.whatsappVisible.value = false
    await mountWidget()
    expect(items().map(b => b.textContent?.trim())).toEqual(['Chat IA', 'Llamar'])
    expect(waLink()).toBeNull()
    expect(document.body.querySelector('a[href*="wa.me"]')).toBeNull()
  })

  it('chat and WhatsApp both off: Llamar is still visible on its own', async () => {
    h.chatEnabled.value = false
    h.whatsappVisible.value = false
    await mountWidget()
    expect(bar()).not.toBeNull()
    expect(items().map(b => b.textContent?.trim())).toEqual(['Llamar'])
  })

  it('WhatsApp drops live when the schedule closes, and returns when it reopens', async () => {
    await mountWidget()
    expect(items()).toHaveLength(3)
    h.whatsappVisible.value = false
    await settle()
    expect(items()).toHaveLength(2)
    h.whatsappVisible.value = true
    await settle()
    expect(items()).toHaveLength(3)
  })
})

describe('SCEN-BC-04 — Llamar dials the call phone', () => {
  it('href is useCallPhone().telHref = tel:+573002436677, with an explicit label', async () => {
    await mountWidget()
    expect(callLink()!.getAttribute('href')).toBe('tel:+573002436677')
    expect(callLink()!.getAttribute('aria-label')).toBe('Llamar al +57 300 243 6677')
    expect(callLink()!.hasAttribute('target')).toBe(false)
  })

  it('a Google forwarding number in state wins over franchise.phone (same composable as the live brands)', async () => {
    state.set('call-forwarding-number', ref({ display: '300 999 1111', tel: '+573009991111' }))
    await mountWidget()
    // alquilame has no forwarding plugin today, but the bar dials whatever the
    // shared composable resolves instead of re-deriving it from franchise.phone.
    expect(callLink()!.getAttribute('href')).toBe('tel:+573009991111')
    expect(callLink()!.getAttribute('aria-label')).toBe('Llamar al 300 999 1111')
  })
})

describe('SCEN-BC-05 (mobile) — Chat IA opens /chat', () => {
  it('navigates to /chat, attributes the open to fab and engages the teaser', async () => {
    await mountWidget()
    await click(chatButton())
    expect(h.navigateTo).toHaveBeenCalledWith('/chat')
    expect(h.prepareChatOpen).toHaveBeenCalledWith('fab')
    expect(h.engage).toHaveBeenCalledWith('chat')
    expect(panel()).toBeNull()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(false)
  })

  it('with the teaser bubble on screen, tapping Chat IA itself is still fab', async () => {
    h.teaserVisible.value = true
    await mountWidget()
    expect(bubble()).not.toBeNull()
    await click(chatButton())
    expect(h.prepareChatOpen).toHaveBeenCalledWith('fab')
  })

  it('tapping the teaser bubble opens /chat and reports teaser', async () => {
    h.teaserVisible.value = true
    await mountWidget()
    await click(bubble())
    expect(h.navigateTo).toHaveBeenCalledWith('/chat')
    expect(h.prepareChatOpen).toHaveBeenCalledWith('teaser')
  })

  it('a real unread reports unread_badge', async () => {
    h.unread.value = 2
    await mountWidget()
    await click(chatButton())
    expect(h.prepareChatOpen).toHaveBeenCalledWith('unread_badge')
  })

  it('chat off: no Chat IA block, nothing can open it', async () => {
    h.chatEnabled.value = false
    await mountWidget()
    expect(chatButton()).toBeNull()
    expect(items().map(b => b.textContent?.trim())).toEqual(['Llamar', 'WhatsApp'])
  })
})

describe('SCEN-BC-09 — reservation summary open: nothing shows', () => {
  it('the whole surface (bar + teaser) unmounts with the overlay and returns after', async () => {
    h.teaserVisible.value = true
    await mountWidget()
    expect(bar()).not.toBeNull()
    expect(bubble()).not.toBeNull()
    h.overlayOpen.value = true
    await settle()
    expect(bar()).toBeNull()
    expect(callLink()).toBeNull()
    expect(bubble()).toBeNull()
    h.overlayOpen.value = false
    await settle()
    expect(bar()).not.toBeNull()
    expect(items()).toHaveLength(3)
  })

  it('an open desktop chat panel survives the overlay unchanged', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(chatButton())
    expect(panel()).not.toBeNull()
    h.overlayOpen.value = true
    await settle()
    expect(panel()).not.toBeNull()
    h.overlayOpen.value = false
    await settle()
    expect(panel()).not.toBeNull()
  })
})

describe('SCEN-BC-10 (channels) — any channel engages the teaser', () => {
  it('Llamar engages llamada', async () => {
    await mountWidget()
    await click(callLink())
    expect(h.engage).toHaveBeenCalledWith('llamada')
    expect(h.engage).toHaveBeenCalledTimes(1)
  })

  it('WhatsApp engages whatsapp and keeps its wa.me href in a new tab', async () => {
    await mountWidget()
    expect(waLink()!.getAttribute('href')).toBe(franchise.whatsapp)
    expect(waLink()!.getAttribute('target')).toBe('_blank')
    expect(waLink()!.getAttribute('rel')).toBe('noopener noreferrer')
    expect(waLink()!.getAttribute('aria-label')).toBe('Abrir WhatsApp')
    await click(waLink())
    expect(h.engage).toHaveBeenCalledWith('whatsapp')
    expect(h.engage).toHaveBeenCalledTimes(1)
  })

  it('Chat IA engages chat', async () => {
    await mountWidget()
    await click(chatButton())
    expect(h.engage).toHaveBeenCalledWith('chat')
  })

  it('mounting alone is not an engage', async () => {
    await mountWidget()
    expect(h.engage).not.toHaveBeenCalled()
  })
})

// Kept from the launcher era: the unread badge moves onto Chat IA (the only
// chat entry left) so a real reply is never invisible. Its exact placement over
// the icon and the teaser anchoring are SCEN-BC-06 (step 5).
describe('unread badge on Chat IA', () => {
  it('real unread badges Chat IA; the count is in the accessible name', async () => {
    h.unread.value = 1
    await mountWidget()
    expect(badge()!.textContent).toBe('1')
    expect(badge()!.getAttribute('aria-hidden')).toBe('true')
    expect(chatButton()!.getAttribute('aria-label')).toBe('Chat IA, 1 mensaje nuevo')
    h.unread.value = 3
    await settle()
    expect(chatButton()!.getAttribute('aria-label')).toBe('Chat IA, 3 mensajes nuevos')
  })

  it('caps at 9+', async () => {
    h.unread.value = 12
    await mountWidget()
    expect(badge()!.textContent).toBe('9+')
  })

  it('synthetic teaser count shows when there is no real unread; real wins over it', async () => {
    h.syntheticCount.value = 2
    await mountWidget()
    expect(badge()!.textContent).toBe('2')
    h.unread.value = 3
    await settle()
    expect(badge()!.textContent).toBe('3')
  })

  it('no count: no badge and the visible label is the name', async () => {
    await mountWidget()
    expect(badge()).toBeNull()
    expect(chatButton()!.hasAttribute('aria-label')).toBe(false)
  })
})

describe('desktop panel stays reachable from Chat IA (step 4 restyles it)', () => {
  it('opens the panel lifted by the measured bar height + 36px, measured synchronously', async () => {
    stubMatchMedia(true)
    // jsdom has no ResizeObserver: the lift can only come from the synchronous
    // measure inside openChat, so this pins that path.
    expect(typeof ResizeObserver).toBe('undefined')
    await mountWidget()
    vi.spyOn(bar()!, 'getBoundingClientRect').mockReturnValue({ height: 44 } as DOMRect)
    await click(chatButton())
    expect(panel()).not.toBeNull()
    expect(panel()!.getAttribute('style')).toContain('--panel-lift: 80px')
    expect(h.navigateTo).not.toHaveBeenCalled()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(true)
  })

  it('the backdrop closes the panel, un-inerts the app root and returns focus to Chat IA', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(chatButton())
    expect(backdrop()).not.toBeNull()
    await click(backdrop())
    expect(panel()).toBeNull()
    expect(backdrop()).toBeNull()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(chatButton())
  })

  it('Chat IA toggles the open panel closed', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(chatButton())
    expect(chatButton()!.getAttribute('aria-expanded')).toBe('true')
    await click(chatButton())
    expect(panel()).toBeNull()
    expect(chatButton()!.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('source-level wiring a mount cannot observe', () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../ChatWidget.vue'), 'utf8')
  const theme = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../assets/css/theme.css'), 'utf8')

  it('SCEN-BC-01: the three tokens exist with the measured-contrast hexes', () => {
    expect(theme).toMatch(/--color-contact-chat:\s*#6d28d9/i)
    expect(theme).toMatch(/--color-contact-call:\s*#1d4ed8/i)
    expect(theme).toMatch(/--color-contact-whatsapp:\s*#14843f/i)
  })

  it('SCEN-BC-01: each block paints its token with white text and icon', () => {
    expect(source).toMatch(/\.bar-chat \{ background: var\(--color-contact-chat, #6d28d9\); \}/)
    expect(source).toMatch(/\.bar-call \{ background: var\(--color-contact-call, #1d4ed8\); \}/)
    expect(source).toMatch(/\.bar-whatsapp \{ background: var\(--color-contact-whatsapp, #14843f\); \}/)
    const item = source.match(/\.bar-item \{[^}]*\}/)?.[0] ?? ''
    expect(item).toMatch(/color: #fff;/)
    expect(item).toMatch(/flex: 1 1 0;/)
    expect(item).toMatch(/font-weight: 700;/)
  })

  // Owner-approved artboard G: each block is a column, icon ABOVE label.
  it('SCEN-BC-01: each block stacks a ~22px icon above a 13px bold label, centred in 64px', () => {
    const item = source.match(/\.bar-item \{[^}]*\}/)?.[0] ?? ''
    expect(item).toMatch(/flex-direction: column;/)
    expect(item).toMatch(/align-items: center;/)
    expect(item).toMatch(/justify-content: center;/)
    expect(item).toMatch(/gap: 4px;/)
    expect(item).toMatch(/font-size: 13px;/)
    expect(item).not.toMatch(/font-size: 1rem;/)
    // Content box is the top 64px; the safe area is padding below it.
    expect(item).toMatch(/height: 100%;/)
    expect(item).toMatch(/box-sizing: border-box;/)
    expect(item).toMatch(/padding: 0 0\.25rem env\(safe-area-inset-bottom\);/)
    const nav = source.match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? ''
    const icons = nav.match(/<svg width="(\d+)" height="(\d+)"/g) ?? []
    expect(icons).toHaveLength(3)
    for (const icon of icons) expect(icon).toBe('<svg width="22" height="22"')
  })

  it('SCEN-BC-01: bar height is 64px plus the safe area, in pure CSS', () => {
    const nav = source.match(/\.contact-bar \{[^}]*\}/)?.[0] ?? ''
    expect(nav).toContain('height: calc(64px + env(safe-area-inset-bottom));')
    expect(nav).toMatch(/bottom: 0;/)
    expect(nav).toMatch(/left: 0;/)
    expect(nav).toMatch(/right: 0;/)
  })

  it('Escape runs closeAll from the window keydown listener', () => {
    expect(source).toMatch(/function onKeydown\(e: KeyboardEvent\) \{\s*if \(e\.key === 'Escape'\) closeAll\(\)\s*\}/)
    expect(source).toMatch(/window\.addEventListener\('keydown', onKeydown\)/)
  })

  it('measures the <nav>, and re-observes it while it lives', () => {
    expect(source).toMatch(/<nav\s+ref="launcherEl"/)
    expect(source).toMatch(/launcherEl\.value\?\.getBoundingClientRect\(\)/)
    expect(source).toMatch(/onBeforeUnmount\(\(\) => launcherObserver\?\.disconnect\(\)\)/)
  })

  it('removed launcher-era state stays removed', () => {
    for (const gone of ['menuOpen', 'contact-fab-menu', 'restoreFocusToLauncher', 'function toggle()', 'animate-pulse-attention', 'pulse-attention', 'fab-chip', 'shiftLeft', 'isWideViewport', 'data-shift-left', 'contact-fab-stack--reservation']) {
      expect(source, gone).not.toContain(gone)
    }
  })

  // Still-true invariants that the cross-brand guards no longer check on
  // alquilame since it forked (SCEN-BC-12): ChatWidget.panel-clearance
  // (ui-alquilatucarro) and ChatWidget.burbuja-mission E4 (ui-alquicarros).
  it('measures the bar itself, never a channels list', () => {
    expect(source).not.toContain('channelsEl')
  })

  it('panel bottom derives from the measured --panel-lift, never a fixed rem', () => {
    expect(source).toMatch(/bottom: var\(--panel-lift, \d+(\.\d+)?rem\);/)
    expect(source).not.toMatch(/^\s*bottom: \d+(\.\d+)?rem;$/m)
  })

  it('panel keeps the 52rem ceiling that yields to the available height', () => {
    expect(source).toMatch(/height: min\(52rem, calc\(100dvh - var\(--panel-lift, \d+(\.\d+)?rem\) - 1\.5rem\)\);/)
    expect(source).not.toMatch(/^\s*height: 32rem;$/m)
    expect(source).not.toContain('max-height: min(75dvh, 40rem);')
  })

  it('channels are direct, one level, no role="menu" for base.css to recolour', () => {
    // Scoped to an opening tag: the header comment documents this very rule.
    expect(source).not.toMatch(/<[a-z][\w-]*\b[^>]*\brole="menu"/i)
  })

  it('background inert stays panel-only', () => {
    expect(source).toContain('watch(panelOpen, (open) => setBackgroundInert(open))')
  })
})
