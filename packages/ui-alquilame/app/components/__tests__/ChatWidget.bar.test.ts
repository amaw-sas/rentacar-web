// @vitest-environment jsdom
// SCEN-BC-01, 03, 04, 05 (mobile), 09, 10 (channels) of
// docs/specs/2026-10-22-barra-contacto-alquilame/design.md — mounted DOM — and
// SCEN-CM-* of docs/specs/2026-10-22-contactanos-movil-alquilame/design.md,
// which replaces the mobile bar: on phones the three channels fold behind one
// green «Contáctanos» toggle; desktop keeps the PR #525 pill row. The channel
// tests below click the options directly (jsdom applies no CSS, so a folded
// option is still clickable here); the SCEN-CM block drives the toggle. Gates (chatEnabled /
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
import { chatPanelLiftPx } from '@rentacar-main/logic/utils/chatPanelLift'
import { createContactClickHandler } from '@rentacar-main/logic/utils/analytics'
import {
  createContactTeaser,
  TEASER_FIRST_DELAY_MS,
  TEASER_SECOND_DELAY_MS,
  TEASER_SUPPRESS_MS,
  TEASER_LINE_1,
  TEASER_LINE_2,
} from '@rentacar-main/logic/composables/useContactTeaser'
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
// Same keys and copy as packages/ui-alquilame/app/app.config.ts.
const ALQUILAME_LINE_2 = '¿Dudas de requisitos o precios? Estamos en línea 24 horas.'
const ALQUILAME_MOBILE_LINE = '¡Hola! ¿Dudas? Estamos en línea 24 horas.'
let chatGreeting: { line2?: string, mobileLine?: string } | undefined

interface Harness {
  chatEnabled: Ref<boolean>
  resolved: Ref<boolean>
  whatsappVisible: Ref<boolean>
  overlayOpen: Ref<boolean>
  unread: Ref<number>
  syntheticCount: Ref<number>
  teaserVisible: Ref<boolean>
  teaserStep: Ref<0 | 1 | 2>
  dismiss: ReturnType<typeof vi.fn>
  engage: ReturnType<typeof vi.fn>
  navigateTo: ReturnType<typeof vi.fn>
  prepareChatOpen: ReturnType<typeof vi.fn>
}

let h: Harness
declare global {
  interface Window { __gaEvents?: Array<{ name: string, params?: Record<string, unknown> }> }
}
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
    resolved: ref(true),
    whatsappVisible: ref(true),
    overlayOpen: ref(false),
    unread: ref(0),
    syntheticCount: ref(0),
    teaserVisible: ref(false),
    teaserStep: ref(1),
    dismiss: vi.fn(),
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
  vi.stubGlobal('useAppConfig', () => ({ franchise, chatGreeting }))
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
    resolved: h.resolved,
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
    teaserStep: h.teaserStep,
    teaserAnnounce: ref(''),
    start: vi.fn(),
    stop: vi.fn(),
    dismiss: h.dismiss,
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
  chatGreeting = { line2: ALQUILAME_LINE_2, mobileLine: ALQUILAME_MOBILE_LINE }
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

  // SCEN-CM-01 brought a toggle back on mobile; the old launcher's menu stays
  // gone, and the only expandable controls are «Contáctanos» and Chat IA.
  it('no launcher-era menu: the expandable controls are the toggle and Chat IA', async () => {
    await mountWidget()
    expect(q('#contact-fab-menu')).toBeNull()
    expect(q('[aria-controls="contact-fab-menu"]')).toBeNull()
    const expandable = [...document.body.querySelectorAll('[aria-expanded]')]
    expect(expandable).toEqual([q('button.contact-toggle'), chatButton()])
    expect(backdrop()).toBeNull()
  })

  it('every icon is decorative; the label is the accessible name', async () => {
    await mountWidget()
    expect(items()).toHaveLength(3)
    for (const block of items()) {
      const svg = block.querySelector('svg')
      expect(svg, block.textContent ?? '').not.toBeNull()
      expect(svg!.getAttribute('aria-hidden')).toBe('true')
      // Icon comes first in the block, so it renders left of the label.
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

const bubbles = () => [...document.body.querySelectorAll<HTMLElement>('.teaser-live > .teaser-bubble')]
const teaserSlot = () => q<HTMLElement>('.teaser-slot')
const closeTeaser = () => q<HTMLButtonElement>('.teaser-live button.teaser-close')

// Desktop since SCEN-CM-07: the phone shows one short bubble instead.
describe('SCEN-BC-06 (desktop) — the greeting sits over Chat IA with «×» and badge', () => {
  beforeEach(() => stubMatchMedia(true))

  it('step 1: one bubble with TEASER_LINE_1 and the «×»; no second bubble yet', async () => {
    h.teaserVisible.value = true
    h.syntheticCount.value = 1
    await mountWidget()
    expect(bubbles()).toHaveLength(1)
    expect(bubbles()[0]!.textContent).toContain(TEASER_LINE_1)
    expect(bubbles()[0]!.contains(closeTeaser())).toBe(true)
    expect(closeTeaser()!.getAttribute('aria-label')).toBe('Cerrar mensaje')
    expect(badge()!.textContent).toBe('1')
    expect(chatButton()!.getAttribute('aria-label')).toBe('Chat IA, 1 mensaje nuevo')
  })

  it('step 2: a second, separate bubble with alquilame\'s «…24 horas.» from app.config', async () => {
    h.teaserVisible.value = true
    h.teaserStep.value = 2
    h.syntheticCount.value = 2
    await mountWidget()
    expect(bubbles()).toHaveLength(2)
    expect(bubbles()[0]!.textContent).toContain(TEASER_LINE_1)
    expect(bubbles()[1]!.textContent?.trim()).toBe(ALQUILAME_LINE_2)
    // The «×» stays on the first bubble only.
    expect(document.body.querySelectorAll('.teaser-live button.teaser-close')).toHaveLength(1)
    expect(bubbles()[1]!.querySelector('button')).toBeNull()
    expect(chatButton()!.getAttribute('aria-label')).toBe('Chat IA, 2 mensajes nuevos')
  })

  it('step 2 without a brand override falls back to TEASER_LINE_2', async () => {
    chatGreeting = undefined
    h.teaserVisible.value = true
    h.teaserStep.value = 2
    await mountWidget()
    expect(bubbles()[1]!.textContent?.trim()).toBe(TEASER_LINE_2)
  })

  it('the hidden sizer reserves both lines with the same brand copy', async () => {
    await mountWidget()
    const sizer = q('.teaser-slot > .teaser-sizer')!
    expect(sizer.getAttribute('aria-hidden')).toBe('true')
    expect(sizer.textContent).toContain(TEASER_LINE_1)
    expect(sizer.textContent).toContain(ALQUILAME_LINE_2)
  })

  it('the bubbles live beside the <nav>, never inside it, and sit before it in the dock', async () => {
    h.teaserVisible.value = true
    await mountWidget()
    const slot = teaserSlot()!
    expect(bar()!.contains(slot)).toBe(false)
    expect(slot.parentElement).toBe(bar()!.parentElement)
    expect(slot.parentElement!.classList.contains('contact-dock')).toBe(true)
    expect(slot.compareDocumentPosition(bar()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('the live stack carries its tail', async () => {
    h.teaserVisible.value = true
    await mountWidget()
    expect(q('.teaser-live .teaser-tail')).not.toBeNull()
  })

  it('tapping either bubble opens the chat as teaser; the «×» only dismisses', async () => {
    h.teaserVisible.value = true
    h.teaserStep.value = 2
    await mountWidget()
    await click(closeTeaser())
    expect(h.dismiss).toHaveBeenCalledTimes(1)
    expect(h.navigateTo).not.toHaveBeenCalled()
    await click(bubbles()[1]!)
    expect(h.prepareChatOpen).toHaveBeenCalledWith('teaser')
    // Desktop: the bubble opens the inline panel, it never navigates.
    expect(panel()).not.toBeNull()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('reservation funnel route: no bubble', async () => {
    stubNuxtGlobals('/reservas')
    stubMatchMedia(true)
    h.teaserVisible.value = true
    await mountWidget()
    expect(bubbles()).toHaveLength(0)
  })

  it('a real unread wins: no bubble, the badge shows the real count', async () => {
    h.teaserVisible.value = true
    h.syntheticCount.value = 2
    h.unread.value = 4
    await mountWidget()
    expect(bubbles()).toHaveLength(0)
    expect(badge()!.textContent).toBe('4')
  })

  it('chat off: no teaser slot at all', async () => {
    h.chatEnabled.value = false
    h.teaserVisible.value = true
    await mountWidget()
    expect(teaserSlot()).toBeNull()
  })
})

// SCEN-BC-06/10 end to end with the REAL teaser state machine and storage:
// only the clock is fake. Each mount gets a fresh instance, as a new page load.
describe('SCEN-BC-06/10 — real teaser: 5 s / +20 s, engage suppresses for 15 days', () => {
  const brand = 'alquilame'
  const keys = { shownKey: `rentacar-teaser:${brand}:shown`, engagedKey: `rentacar-teaser:${brand}:engagedAt` }

  function useRealTeaser() {
    vi.stubGlobal('useContactTeaser', () => createContactTeaser({ brand, ...keys, line2: ALQUILAME_LINE_2 }))
  }
  async function advance(ms: number) {
    vi.advanceTimersByTime(ms)
    await settle()
  }
  async function newPageLoad() {
    wrapper?.unmount()
    wrapper = null
    await mountWidget()
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(new Date('2026-10-22T15:00:00Z'))
    localStorage.clear()
    sessionStorage.clear()
    useRealTeaser()
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('desktop: bubble 1 at 5 s, bubble 2 «…24 horas.» 20 s later', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS - 1)
    expect(bubbles()).toHaveLength(0)
    await advance(1)
    expect(bubbles()).toHaveLength(1)
    expect(badge()!.textContent).toBe('1')
    await advance(TEASER_SECOND_DELAY_MS)
    expect(bubbles()).toHaveLength(2)
    expect(bubbles()[1]!.textContent?.trim()).toBe(ALQUILAME_LINE_2)
    expect(badge()!.textContent).toBe('2')
  })

  for (const [name, target] of [['Llamar', () => callLink()], ['WhatsApp', () => waLink()], ['Chat IA', () => chatButton()]] as const) {
    it(`tapping ${name} closes the greeting and it does not return within 15 days`, async () => {
      await mountWidget()
      await advance(TEASER_FIRST_DELAY_MS)
      expect(bubbles()).toHaveLength(1)
      await click(target())
      expect(bubbles()).toHaveLength(0)
      expect(badge()).toBeNull()
      // A new session 14 days later: no greeting.
      sessionStorage.clear()
      vi.setSystemTime(Date.now() + TEASER_SUPPRESS_MS - 24 * 60 * 60 * 1000)
      await newPageLoad()
      await advance(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS)
      expect(bubbles()).toHaveLength(0)
      // Past the 15-day window it may greet again.
      sessionStorage.clear()
      vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000)
      await newPageLoad()
      await advance(TEASER_FIRST_DELAY_MS)
      expect(bubbles()).toHaveLength(1)
    })
  }

  // SCEN-BC-10 asks «×» for the same 15 days, but plan Paso 5 wires it to
  // teaser.dismiss(), which the composable (unchanged since Paso 1) keeps
  // session-only. This pins what ships today: closed and gone for the session.
  it('«×» closes the greeting for the rest of the session', async () => {
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS)
    await click(closeTeaser())
    expect(bubbles()).toHaveLength(0)
    expect(badge()).toBeNull()
    await newPageLoad()
    await advance(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS)
    expect(bubbles()).toHaveLength(0)
  })
})

// SCEN-BC-15: the shared analytics plugin attributes a contact click to the
// FAB by `data-analytics-placement` (or the old launcher classes). Without it,
// a tap on the bar goes out as the page's fallback ('category', 'result'...).
describe('SCEN-BC-15 — Llamar and WhatsApp clicks are attributed to the fab', () => {
  let events: Array<{ name: string, params: Record<string, unknown> }>
  let handler: (e: Event) => void
  beforeEach(() => {
    events = []
    vi.stubGlobal('gtag', (_kind: string, name: string, params: Record<string, unknown>) => {
      events.push({ name, params })
    })
    ;(window as unknown as { gtag: unknown }).gtag = (globalThis as unknown as { gtag: unknown }).gtag
    // The same delegated handler the brand plugin installs, on a page whose
    // fallback placement would otherwise be 'category'.
    handler = createContactClickHandler('alquilame', () => ({ pageType: 'category' }))
    document.addEventListener('click', handler, true)
  })
  afterEach(() => {
    document.removeEventListener('click', handler, true)
    delete (window as unknown as { gtag?: unknown }).gtag
  })

  for (const [name, el, method] of [['Llamar', () => callLink(), 'telephone'], ['WhatsApp', () => waLink(), 'whatsapp']] as const) {
    it(`${name} → contact_click { placement: 'fab' }, on mobile and desktop`, async () => {
      for (const desktop of [false, true]) {
        stubMatchMedia(desktop)
        wrapper?.unmount()
        await mountWidget()
        events = []
        await click(el())
        const contact = events.filter(e => e.name === 'contact_click')
        expect(contact, `${name} desktop=${desktop}`).toHaveLength(1)
        expect(contact[0]!.params).toMatchObject({ brand: 'alquilame', method, placement: 'fab', page_type: 'category' })
      }
    })
  }

  it('the placement is declared once, on the <nav>', async () => {
    await mountWidget()
    expect(bar()!.dataset.analyticsPlacement).toBe('fab')
  })
})

// SCEN-BC-14: Nuxt UI slideovers/modals have no z-index, so the fixed contact
// layer (z-60) would sit over them and steal taps on their last row. While a
// modal reka layer is open it sets `body { pointer-events: none }` — the page
// outside it is inert, and the contact surface follows it out of the way.
describe('SCEN-BC-14 — the surface steps aside while a modal slideover/modal is open', () => {
  // What a modal reka layer leaves in the DOM: its root carries
  // `data-dismissable-layer` (reka-ui 2.6.0 DismissableLayer) and Nuxt UI
  // portals it straight into <body>, next to our own teleported layer.
  function openModalLayer() {
    const layer = document.createElement('div')
    layer.setAttribute('role', 'dialog')
    layer.setAttribute('data-dismissable-layer', '')
    document.body.appendChild(layer)
    document.body.style.pointerEvents = 'none'
    return layer
  }
  afterEach(() => {
    document.body.style.pointerEvents = ''
    document.querySelectorAll('[data-dismissable-layer]').forEach(el => el.remove())
  })

  it('hides the bar and greeting while a modal layer is open, and returns after it closes', async () => {
    h.teaserVisible.value = true
    await mountWidget()
    expect(bar()).not.toBeNull()
    const layer = openModalLayer()
    await settle()
    expect(bar()).toBeNull()
    expect(q('.teaser-slot')).toBeNull()
    layer.remove()
    document.body.style.pointerEvents = ''
    await settle()
    expect(bar()).not.toBeNull()
    expect(q('.teaser-slot')).not.toBeNull()
  })

  it('a modal already open at mount keeps the surface hidden from the first paint', async () => {
    openModalLayer()
    await mountWidget()
    expect(bar()).toBeNull()
  })

  // reka 2.6.0 can leave `body { pointer-events: none }` behind with no layer
  // open (issues #25/#65). The bar is then the page's only way out; never hide it.
  it('stale lock: pointer-events none with no layer in the DOM keeps the bar visible', async () => {
    document.body.style.pointerEvents = 'none'
    await mountWidget()
    expect(bar()).not.toBeNull()
  })

  it('stale lock left behind: the last layer unmounts while the style stays none → the bar comes back', async () => {
    await mountWidget()
    const layer = openModalLayer()
    await settle()
    expect(bar()).toBeNull()
    layer.remove()
    // body style untouched: still 'none', as reka leaves it in the stuck case.
    expect(document.body.style.pointerEvents).toBe('none')
    await settle()
    expect(bar()).not.toBeNull()
  })

  it('watches only <body> itself: its style and its direct children, never the subtree', async () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe')
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    await mountWidget()
    const call = observe.mock.calls.find(([target]) => target === document.body)
    expect(call, 'observer on <body>').toBeDefined()
    expect(call![1]).toEqual({ attributes: true, attributeFilter: ['style'], childList: true })
    const before = disconnect.mock.calls.length
    wrapper!.unmount()
    wrapper = null
    expect(disconnect.mock.calls.length).toBeGreaterThan(before)
    observe.mockRestore()
    disconnect.mockRestore()
  })

  it('an open desktop chat panel is not a modal layer: it never hides its own bar', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(chatButton())
    expect(panel()).not.toBeNull()
    expect(bar()).not.toBeNull()
  })
})

// SCEN-BC-16: useChatStatus starts chat OFF / WhatsApp ON until the dashboard
// answers, so painting early shows [Llamar|WhatsApp] and then reflows to three.
describe('SCEN-BC-16 — the bar paints once, in its final composition', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    h.resolved.value = false
    h.chatEnabled.value = false
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('nothing before the status resolves; then all three blocks at once', async () => {
    await mountWidget()
    expect(bar()).toBeNull()
    h.chatEnabled.value = true
    h.resolved.value = true
    await settle()
    expect(items().map(b => b.textContent?.trim())).toEqual(['Chat IA', 'Llamar', 'WhatsApp'])
  })

  it('if the status never arrives, the bar appears at 1.5 s with Llamar (WhatsApp fail-open)', async () => {
    await mountWidget()
    vi.advanceTimersByTime(1499)
    await settle()
    expect(bar()).toBeNull()
    vi.advanceTimersByTime(1)
    await settle()
    expect(items().map(b => b.textContent?.trim())).toEqual(['Llamar', 'WhatsApp'])
  })

  it('resolving first cancels the fallback timer; unmounting before 1.5 s leaves none behind', async () => {
    await mountWidget()
    h.resolved.value = true
    await settle()
    expect(vi.getTimerCount()).toBe(0)
    wrapper!.unmount()
    wrapper = null
    h.resolved.value = false
    await mountWidget()
    expect(vi.getTimerCount()).toBe(1)
    wrapper!.unmount()
    wrapper = null
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('chat switched off while the desktop panel holds focus', () => {
  it('focus moves to Llamar instead of dropping to <body>', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(chatButton())
    panel()!.focus()
    expect(document.activeElement).toBe(panel())
    h.chatEnabled.value = false
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(callLink())
  })

  it('focus on Chat IA itself (panel closed) moves to Llamar when Chat IA disappears', async () => {
    await mountWidget()
    chatButton()!.focus()
    expect(document.activeElement).toBe(chatButton())
    h.chatEnabled.value = false
    await settle()
    expect(chatButton()).toBeNull()
    expect(document.activeElement).toBe(callLink())
  })

  it('focus on Chat IA with the desktop panel open also moves to Llamar', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(chatButton())
    chatButton()!.focus()
    h.chatEnabled.value = false
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(callLink())
  })

  it('focus elsewhere on the page is left alone', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(chatButton())
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    h.chatEnabled.value = false
    await settle()
    expect(document.activeElement).toBe(outside)
  })
})

describe('SCEN-BC-02 — desktop renders the same three channels, in order', () => {
  it('same <nav>, same order; the pill layout is CSS only (no viewport branch in the markup)', async () => {
    stubMatchMedia(true)
    await mountWidget()
    expect(document.body.querySelectorAll('nav[aria-label="Contacto"]')).toHaveLength(1)
    expect(items().map(b => b.textContent?.trim())).toEqual(['Chat IA', 'Llamar', 'WhatsApp'])
    expect(callLink()!.getAttribute('href')).toBe('tel:+573002436677')
  })
})

describe('SCEN-BC-05 (desktop) / SCEN-BC-13 — Chat IA opens the inline panel, closing returns focus', () => {
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

  it('background inert is the panel only: the pills alone never inert the page', async () => {
    stubMatchMedia(true)
    await mountWidget()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(false)
    await click(callLink())
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(false)
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

// SCEN-CM-* of docs/specs/2026-10-22-contactanos-movil-alquilame/design.md:
// on mobile the bar becomes one green «Contáctanos» toggle that unfolds the
// same three channels. The <nav> keeps living in the DOM (hidden by CSS until
// the menu opens, so the first paint never jumps); jsdom applies no scoped
// CSS, so "hidden" is read from the dock's open class here and the CSS that
// turns it into display none/flex is pinned at source level further down.
const toggle = () => q<HTMLButtonElement>('button.contact-toggle')
// Both labels stay in the toggle so its width never jumps (item 8 of the
// review); the inactive one is visibility:hidden + aria-hidden.
const toggleLabel = () => toggle()?.querySelector('.toggle-label > span:not(.toggle-label-off)')?.textContent?.trim()
const dock = () => q<HTMLElement>('.contact-dock')
const isMenuOpen = () => dock()?.classList.contains('contact-dock--open') ?? false
const teaserLive = () => document.body.querySelectorAll<HTMLElement>('span.sr-only[role="status"]')[1]!
const mobileBubbles = () => [...document.body.querySelectorAll<HTMLElement>('.teaser-live > .teaser-bubble')]

async function openMenu() {
  await click(toggle())
  expect(isMenuOpen(), 'menu should be open').toBe(true)
}
async function pressEscape() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settle()
}
async function pointerDownOn(el: Element) {
  el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  await settle()
}

describe('SCEN-CM-01 — mobile: one «Contáctanos» toggle, channels folded away', () => {
  it('renders exactly one toggle with the label, closed, controlling the <nav>', async () => {
    await mountWidget()
    expect(document.body.querySelectorAll('button.contact-toggle')).toHaveLength(1)
    expect(toggleLabel()).toBe('Contáctanos')
    expect(toggle()!.getAttribute('type')).toBe('button')
    expect(toggle()!.getAttribute('aria-expanded')).toBe('false')
    expect(toggle()!.getAttribute('aria-controls')).toBe(bar()!.id)
    expect(bar()!.id).not.toBe('')
    expect(isMenuOpen()).toBe(false)
  })

  it('the toggle lives in the dock BEFORE the <nav>: Tab goes toggle → Chat IA → Llamar → WhatsApp', async () => {
    await mountWidget()
    expect(toggle()!.parentElement).toBe(dock())
    expect(bar()!.contains(toggle())).toBe(false)
    expect(toggle()!.compareDocumentPosition(bar()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Its icon is decorative: the visible text is the accessible name.
    expect(toggle()!.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    expect(toggle()!.hasAttribute('aria-label')).toBe(false)
  })
})

describe('SCEN-CM-02 — tapping «Contáctanos» unfolds Chat IA, Llamar, WhatsApp', () => {
  it('aria-expanded true, label «Cerrar», the three options in order with their icon circle', async () => {
    await mountWidget()
    await openMenu()
    expect(toggle()!.getAttribute('aria-expanded')).toBe('true')
    expect(toggleLabel()).toBe('Cerrar')
    expect(items().map(b => b.textContent?.trim())).toEqual(['Chat IA', 'Llamar', 'WhatsApp'])
    for (const item of items()) expect(item.querySelector(':scope > .bar-icon > svg'), item.textContent ?? '').not.toBeNull()
  })

  it('both labels share the toggle so its width never jumps; the inactive one is hidden from AT', async () => {
    await mountWidget()
    const labels = () => [...toggle()!.querySelectorAll<HTMLElement>('.toggle-label > span')]
    expect(labels().map(l => l.textContent?.trim())).toEqual(['Contáctanos', 'Cerrar'])
    expect(labels()[0]!.classList.contains('toggle-label-off')).toBe(false)
    expect(labels()[0]!.hasAttribute('aria-hidden')).toBe(false)
    expect(labels()[1]!.classList.contains('toggle-label-off')).toBe(true)
    expect(labels()[1]!.getAttribute('aria-hidden')).toBe('true')
    await openMenu()
    expect(labels()[0]!.classList.contains('toggle-label-off')).toBe(true)
    expect(labels()[0]!.getAttribute('aria-hidden')).toBe('true')
    expect(labels()[1]!.classList.contains('toggle-label-off')).toBe(false)
    expect(labels()[1]!.hasAttribute('aria-hidden')).toBe(false)
  })

  it('tapping «Cerrar» folds it again', async () => {
    await mountWidget()
    await openMenu()
    await click(toggle())
    expect(isMenuOpen()).toBe(false)
    expect(toggle()!.getAttribute('aria-expanded')).toBe('false')
    expect(toggleLabel()).toBe('Contáctanos')
  })
})

describe('SCEN-CM-03 — the menu follows each channel gate', () => {
  for (const [chat, wa, expected] of [
    [true, false, ['Chat IA', 'Llamar']],
    [false, true, ['Llamar', 'WhatsApp']],
    [false, false, ['Llamar']],
  ] as const) {
    it(`chat ${chat ? 'on' : 'off'}, WhatsApp ${wa ? 'in' : 'out of'} hours → ${expected.join(', ')}`, async () => {
      h.chatEnabled.value = chat
      h.whatsappVisible.value = wa
      await mountWidget()
      expect(toggle()).not.toBeNull()
      await openMenu()
      expect(items().map(b => b.textContent?.trim())).toEqual(expected)
    })
  }
})

describe('SCEN-CM-04/05 — choosing an option does its job and folds the menu', () => {
  const brand = 'alquilame'
  const keys = { shownKey: `rentacar-teaser:${brand}:shown`, engagedKey: `rentacar-teaser:${brand}:engagedAt` }
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('Llamar: tel:+573002436677, 15-day suppression stamped, menu closed', async () => {
    vi.stubGlobal('useContactTeaser', () => createContactTeaser({ brand, ...keys, line2: ALQUILAME_LINE_2 }))
    await mountWidget()
    await openMenu()
    expect(callLink()!.getAttribute('href')).toBe('tel:+573002436677')
    await click(callLink())
    expect(localStorage.getItem(keys.engagedKey)).not.toBeNull()
    expect(isMenuOpen()).toBe(false)
  })

  it('WhatsApp: wa.me in a new tab, 15-day suppression stamped, menu closed', async () => {
    vi.stubGlobal('useContactTeaser', () => createContactTeaser({ brand, ...keys, line2: ALQUILAME_LINE_2 }))
    await mountWidget()
    await openMenu()
    expect(waLink()!.getAttribute('href')).toBe('https://wa.me/573002436677')
    expect(waLink()!.getAttribute('target')).toBe('_blank')
    await click(waLink())
    expect(localStorage.getItem(keys.engagedKey)).not.toBeNull()
    expect(isMenuOpen()).toBe(false)
  })

  it('Chat IA: /chat with source fab, menu closed', async () => {
    await mountWidget()
    await openMenu()
    await click(chatButton())
    expect(h.navigateTo).toHaveBeenCalledWith('/chat')
    expect(h.prepareChatOpen).toHaveBeenCalledWith('fab')
    expect(isMenuOpen()).toBe(false)
    expect(panel()).toBeNull()
  })

  it('Chat IA with real unread: source unread_badge', async () => {
    h.unread.value = 2
    await mountWidget()
    await openMenu()
    await click(chatButton())
    expect(h.prepareChatOpen).toHaveBeenCalledWith('unread_badge')
    expect(isMenuOpen()).toBe(false)
  })
})

describe('SCEN-CM-06 — «Cerrar», Escape and an outside tap close the menu', () => {
  it('«Cerrar» returns focus to the toggle', async () => {
    await mountWidget()
    await openMenu()
    callLink()!.focus()
    await click(toggle())
    expect(isMenuOpen()).toBe(false)
    expect(document.activeElement).toBe(toggle())
  })

  it('Escape closes it and returns focus to the toggle', async () => {
    await mountWidget()
    await openMenu()
    callLink()!.focus()
    await pressEscape()
    expect(isMenuOpen()).toBe(false)
    expect(document.activeElement).toBe(toggle())
  })

  it('Escape already handled by someone else (defaultPrevented) is ignored', async () => {
    await mountWidget()
    await openMenu()
    const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    e.preventDefault()
    document.dispatchEvent(e)
    await settle()
    expect(isMenuOpen()).toBe(true)
  })

  it('Escape with focus elsewhere on the page closes the menu but leaves focus there', async () => {
    await mountWidget()
    await openMenu()
    const field = document.createElement('input')
    document.body.appendChild(field)
    field.focus()
    await pressEscape()
    expect(isMenuOpen()).toBe(false)
    expect(document.activeElement).toBe(field)
  })

  it('Escape with focus on <body> closes and returns focus to the toggle', async () => {
    await mountWidget()
    await openMenu()
    ;(document.activeElement as HTMLElement | null)?.blur()
    expect(document.activeElement).toBe(document.body)
    await pressEscape()
    expect(isMenuOpen()).toBe(false)
    expect(document.activeElement).toBe(toggle())
  })

  it('Escape with the menu closed does nothing to focus', async () => {
    await mountWidget()
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    await pressEscape()
    expect(document.activeElement).toBe(outside)
  })

  it('a tap outside the dock closes it; a tap on an option area does not', async () => {
    await mountWidget()
    await openMenu()
    await pointerDownOn(bar()!)
    expect(isMenuOpen()).toBe(true)
    await pointerDownOn(toggle()!)
    expect(isMenuOpen()).toBe(true)
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    await pointerDownOn(outside)
    expect(isMenuOpen()).toBe(false)
  })

  it('the viewport crossing to desktop folds the menu without moving focus', async () => {
    const listeners: Array<(e: { matches: boolean }) => void> = []
    let desktop = false
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() { return desktop && query.includes('768px') },
      media: query,
      addEventListener: (_t: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
      removeEventListener: () => {},
      addListener: (cb: (e: { matches: boolean }) => void) => listeners.push(cb),
      removeListener: () => {},
    }))
    await mountWidget()
    await openMenu()
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    desktop = true
    for (const cb of listeners) cb({ matches: true })
    await settle()
    expect(isMenuOpen()).toBe(false)
    expect(document.activeElement).toBe(outside)
  })

  it('no dimming backdrop and no inert page while the menu is open', async () => {
    await mountWidget()
    await openMenu()
    expect(backdrop()).toBeNull()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(false)
  })

  it('the outside-tap and Escape listeners leave with the menu and the widget', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    await mountWidget()
    expect(add.mock.calls.filter(([t]) => t === 'pointerdown')).toHaveLength(0)
    await openMenu()
    expect(add.mock.calls.filter(([t]) => t === 'pointerdown')).toHaveLength(1)
    await click(toggle())
    expect(remove.mock.calls.filter(([t]) => t === 'pointerdown')).toHaveLength(1)
    await openMenu()
    wrapper!.unmount()
    wrapper = null
    expect(remove.mock.calls.filter(([t]) => t === 'pointerdown')).toHaveLength(2)
    add.mockRestore()
    remove.mockRestore()
  })
})

describe('SCEN-CM-07/08 — mobile greeting: ONE bubble over the toggle', () => {
  const brand = 'alquilame'
  const keys = { shownKey: `rentacar-teaser:${brand}:shown`, engagedKey: `rentacar-teaser:${brand}:engagedAt` }
  async function advance(ms: number) {
    vi.advanceTimersByTime(ms)
    await settle()
  }
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(new Date('2026-10-22T15:00:00Z'))
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('useContactTeaser', () => createContactTeaser({ brand, ...keys, line2: ALQUILAME_LINE_2 }))
    window.__gaEvents = []
    ;(window as unknown as { gtag: unknown }).gtag = (_kind: string, name: string, params?: Record<string, unknown>) => {
      window.__gaEvents!.push({ name, params })
    }
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    sessionStorage.clear()
    delete (window as unknown as { gtag?: unknown }).gtag
    delete window.__gaEvents
  })
  const gaEvents = () => window.__gaEvents!.map(e => e.name)
  const gaParams = (name: string) => window.__gaEvents!.find(e => e.name === name)?.params

  it('at 5 s one bubble with the short line and the «×»; never a second one', async () => {
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS - 1)
    expect(mobileBubbles()).toHaveLength(0)
    await advance(1)
    expect(mobileBubbles()).toHaveLength(1)
    expect(mobileBubbles()[0]!.textContent?.trim()).toBe(ALQUILAME_MOBILE_LINE)
    expect(mobileBubbles()[0]!.querySelector('button.teaser-close')!.getAttribute('aria-label')).toBe('Cerrar mensaje')
    await advance(TEASER_SECOND_DELAY_MS)
    expect(mobileBubbles()).toHaveLength(1)
    expect(document.body.textContent).not.toContain(ALQUILAME_LINE_2)
    expect(document.body.textContent).not.toContain(TEASER_LINE_1)
  })

  it('the screen reader hears the same short line, not line 1 + line 2', async () => {
    await mountWidget()
    expect(teaserLive().textContent).toBe('')
    await advance(TEASER_FIRST_DELAY_MS)
    expect(teaserLive().textContent).toBe(ALQUILAME_MOBILE_LINE)
    await advance(TEASER_SECOND_DELAY_MS)
    expect(teaserLive().textContent).toBe(ALQUILAME_MOBILE_LINE)
  })

  it('the hidden sizer reserves only the short line', async () => {
    await mountWidget()
    const sizer = q('.teaser-slot > .teaser-sizer')!
    expect(sizer.textContent?.trim()).toBe(ALQUILAME_MOBILE_LINE)
  })

  it('tapping the bubble opens /chat as teaser', async () => {
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS)
    await click(mobileBubbles()[0]!)
    expect(h.navigateTo).toHaveBeenCalledWith('/chat')
    expect(h.prepareChatOpen).toHaveBeenCalledWith('teaser')
  })

  it('«×» closes it for the session', async () => {
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS)
    await click(q('.teaser-live button.teaser-close'))
    expect(mobileBubbles()).toHaveLength(0)
    wrapper!.unmount()
    wrapper = null
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS)
    expect(mobileBubbles()).toHaveLength(0)
  })

  // SCEN-CM-08 as amended by review: opening the menu only HIDES the bubble.
  // Choosing a channel is an engage (GA4 contact_teaser_engaged + 15 days);
  // folding the menu without choosing is a dismiss, like the «×».
  it('SCEN-CM-08: opening the menu hides the bubble but does not dismiss it', async () => {
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS)
    await openMenu()
    expect(mobileBubbles()).toHaveLength(0)
    expect(gaEvents()).not.toContain('contact_teaser_dismissed')
    // The synthetic count is still alive: Chat IA in the menu carries it.
    expect(chatButton()!.getAttribute('aria-label')).toBe('Chat IA, 1 mensaje nuevo')
  })

  for (const [name, target, method] of [['WhatsApp', () => waLink(), 'whatsapp'], ['Llamar', () => callLink(), 'llamada'], ['Chat IA', () => chatButton(), 'chat']] as const) {
    it(`SCEN-CM-08: bubble visible → open menu → ${name} ⇒ engaged (target ${method}), never dismissed, 15 days stamped`, async () => {
      await mountWidget()
      await advance(TEASER_FIRST_DELAY_MS)
      await openMenu()
      await click(target())
      expect(gaEvents()).toContain('contact_teaser_engaged')
      expect(gaEvents()).not.toContain('contact_teaser_dismissed')
      expect(gaParams('contact_teaser_engaged')).toMatchObject({ brand, target: method })
      expect(localStorage.getItem(keys.engagedKey)).not.toBeNull()
      expect(isMenuOpen()).toBe(false)
      expect(mobileBubbles()).toHaveLength(0)
    })
  }

  for (const [how, close] of [
    ['«Cerrar»', async () => click(toggle())],
    ['Escape', async () => pressEscape()],
    ['an outside tap', async () => pointerDownOn(document.body.appendChild(document.createElement('div')))],
  ] as const) {
    it(`SCEN-CM-08: bubble visible → open menu → ${how} ⇒ dismissed, gone for the session, no 15-day stamp`, async () => {
      await mountWidget()
      await advance(TEASER_FIRST_DELAY_MS)
      await openMenu()
      await close()
      expect(isMenuOpen()).toBe(false)
      expect(gaEvents()).toContain('contact_teaser_dismissed')
      expect(gaEvents()).not.toContain('contact_teaser_engaged')
      expect(mobileBubbles()).toHaveLength(0)
      expect(localStorage.getItem(keys.engagedKey)).toBeNull()
      wrapper!.unmount()
      wrapper = null
      await mountWidget()
      await advance(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS)
      expect(mobileBubbles()).toHaveLength(0)
    })
  }

  // Item 3 of the review: mobile never reaches step 2.
  it('mobile at 25 s+: no step-2 event, badge stays 1, «Contáctanos, 1 mensaje nuevo»', async () => {
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS + 60_000)
    const shown = window.__gaEvents!.filter(e => e.name === 'contact_teaser_shown').map(e => e.params?.step)
    expect(shown).toEqual([1])
    expect(toggle()!.querySelector('.toggle-badge')!.textContent).toBe('1')
    expect(toggle()!.getAttribute('aria-label')).toBe('Contáctanos, 1 mensaje nuevo')
    expect(teaserLive().textContent).toBe(ALQUILAME_MOBILE_LINE)
  })

  it('desktop still advances to step 2 (badge 2, event {step:2})', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await advance(TEASER_FIRST_DELAY_MS + TEASER_SECOND_DELAY_MS)
    const shown = window.__gaEvents!.filter(e => e.name === 'contact_teaser_shown').map(e => e.params?.step)
    expect(shown).toEqual([1, 2])
    expect(badge()!.textContent).toBe('2')
  })
})

describe('SCEN-CM-09 — unread count rides on the closed toggle', () => {
  const toggleBadge = () => toggle()?.querySelector('.toggle-badge') ?? null

  it('2 real unread: badge «2», name «Contáctanos, 2 mensajes nuevos»', async () => {
    h.unread.value = 2
    await mountWidget()
    expect(toggleBadge()!.textContent).toBe('2')
    expect(toggleBadge()!.getAttribute('aria-hidden')).toBe('true')
    expect(toggle()!.getAttribute('aria-label')).toBe('Contáctanos, 2 mensajes nuevos')
  })

  it('singular, 9+ cap and the synthetic teaser count', async () => {
    h.unread.value = 1
    await mountWidget()
    expect(toggle()!.getAttribute('aria-label')).toBe('Contáctanos, 1 mensaje nuevo')
    h.unread.value = 12
    await settle()
    expect(toggleBadge()!.textContent).toBe('9+')
    h.unread.value = 0
    h.syntheticCount.value = 1
    await settle()
    expect(toggleBadge()!.textContent).toBe('1')
  })

  it('no count: no badge, visible text is the name', async () => {
    await mountWidget()
    expect(toggleBadge()).toBeNull()
    expect(toggle()!.hasAttribute('aria-label')).toBe(false)
  })

  it('open menu: the toggle reads «Cerrar» without the count (Chat IA keeps its own)', async () => {
    h.unread.value = 2
    await mountWidget()
    await openMenu()
    expect(toggleBadge()).toBeNull()
    expect(toggle()!.hasAttribute('aria-label')).toBe(false)
    expect(chatButton()!.getAttribute('aria-label')).toBe('Chat IA, 2 mensajes nuevos')
  })
})

describe('SCEN-CM-11 — reservation summary and modal layers hide toggle and menu', () => {
  it('the reservation overlay unmounts toggle and menu; it comes back closed', async () => {
    await mountWidget()
    await openMenu()
    h.overlayOpen.value = true
    await settle()
    expect(toggle()).toBeNull()
    expect(bar()).toBeNull()
    h.overlayOpen.value = false
    await settle()
    expect(toggle()).not.toBeNull()
    expect(isMenuOpen()).toBe(false)
    expect(toggle()!.getAttribute('aria-expanded')).toBe('false')
  })

  it('a modal layer (sedes list) hides the toggle; closing it brings it back', async () => {
    await mountWidget()
    const layer = document.createElement('div')
    layer.setAttribute('data-dismissable-layer', '')
    document.body.appendChild(layer)
    document.body.style.pointerEvents = 'none'
    await settle()
    expect(toggle()).toBeNull()
    layer.remove()
    document.body.style.pointerEvents = ''
    await settle()
    expect(toggle()).not.toBeNull()
  })

  it('stale lock with no layer: the toggle stays visible and still opens the menu', async () => {
    document.body.style.pointerEvents = 'none'
    await mountWidget()
    expect(toggle()).not.toBeNull()
    await openMenu()
    expect(items().map(b => b.textContent?.trim())).toEqual(['Chat IA', 'Llamar', 'WhatsApp'])
    document.body.style.pointerEvents = ''
  })
})

describe('SCEN-CM-12 — options in the mobile menu are attributed to the fab', () => {
  let events: Array<{ name: string, params: Record<string, unknown> }>
  let handler: (e: Event) => void
  beforeEach(() => {
    events = []
    ;(window as unknown as { gtag: unknown }).gtag = (_kind: string, name: string, params: Record<string, unknown>) => {
      events.push({ name, params })
    }
    handler = createContactClickHandler('alquilame', () => ({ pageType: 'home' }))
    document.addEventListener('click', handler, true)
  })
  afterEach(() => {
    document.removeEventListener('click', handler, true)
    delete (window as unknown as { gtag?: unknown }).gtag
  })

  for (const [name, el, method] of [['Llamar', () => callLink(), 'telephone'], ['WhatsApp', () => waLink(), 'whatsapp']] as const) {
    it(`${name} from the open menu → contact_click { placement: 'fab' }`, async () => {
      await mountWidget()
      await openMenu()
      events = []
      await click(el())
      const contact = events.filter(e => e.name === 'contact_click')
      expect(contact).toHaveLength(1)
      expect(contact[0]!.params).toMatchObject({ brand: 'alquilame', method, placement: 'fab' })
    })
  }

  it('opening and closing the menu is not a contact click', async () => {
    await mountWidget()
    await openMenu()
    await click(toggle())
    expect(events.filter(e => e.name === 'contact_click')).toHaveLength(0)
  })
})

describe('SCEN-CM-14 — chat switched off with focus on Chat IA in the open menu', () => {
  it('Chat IA leaves the menu and focus moves to Llamar', async () => {
    await mountWidget()
    await openMenu()
    chatButton()!.focus()
    h.chatEnabled.value = false
    await settle()
    expect(chatButton()).toBeNull()
    expect(isMenuOpen()).toBe(true)
    expect(document.activeElement).toBe(callLink())
  })

  it('focus on the toggle is left alone', async () => {
    await mountWidget()
    toggle()!.focus()
    h.chatEnabled.value = false
    await settle()
    expect(document.activeElement).toBe(toggle())
  })
})

describe('SCEN-CM-10 — desktop markup is the PR #525 pill row', () => {
  it('Chat IA still opens the inline panel; the toggle never opens a menu there', async () => {
    stubMatchMedia(true)
    await mountWidget()
    expect(items().map(b => b.textContent?.trim())).toEqual(['Chat IA', 'Llamar', 'WhatsApp'])
    await click(chatButton())
    expect(panel()).not.toBeNull()
    expect(h.navigateTo).not.toHaveBeenCalled()
  })

  it('two greeting bubbles on desktop, no short mobile line', async () => {
    stubMatchMedia(true)
    h.teaserVisible.value = true
    h.teaserStep.value = 2
    await mountWidget()
    expect(bubbles()).toHaveLength(2)
    expect(document.body.textContent).not.toContain(ALQUILAME_MOBILE_LINE)
  })
})

describe('source-level wiring a mount cannot observe', () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../ChatWidget.vue'), 'utf8')
  // Body of the first `@media (min-width: 768px)` block (balanced braces).
  const desktopCss = (() => {
    const start = source.indexOf('@media (min-width: 768px) {')
    if (start === -1) return ''
    let depth = 0
    for (let i = source.indexOf('{', start); i < source.length; i++) {
      if (source[i] === '{') depth++
      else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
    }
    return ''
  })()
  const desktopRule = (sel: string) =>
    desktopCss.match(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{[^}]*\\}`))?.[0] ?? ''
  const template = source.slice(0, source.indexOf('<script setup'))

  // Step 5 moved the bottom-right anchor from the <nav> to the dock that also
  // carries the greeting (so the bubbles can sit over Chat IA); same values.
  it('SCEN-BC-02: md+ turns the bar into a bottom-right row of pills (no full-width bar)', () => {
    expect(desktopCss, '@media (min-width: 768px) block').not.toBe('')
    const dock = desktopRule('.contact-dock')
    expect(dock).toMatch(/left: auto;/)
    expect(dock).toMatch(/right: 1\.5rem;/)
    expect(dock).toMatch(/bottom: 1\.5rem;/)
    const nav = desktopRule('.contact-bar')
    expect(nav).toMatch(/position: relative;/)
    expect(nav).toMatch(/height: auto;/)
    expect(nav).toMatch(/gap: 0\.75rem;/)
    expect(nav).toMatch(/box-shadow: none;/)
  })

  it('SCEN-BC-02: each pill is a 44px rounded row, icon left of the label, own shadow', () => {
    const pill = desktopRule('.bar-item')
    expect(pill).toMatch(/flex: 0 0 auto;/)
    expect(pill).toMatch(/flex-direction: row;/)
    expect(pill).toMatch(/height: 44px;/)
    expect(pill).toMatch(/padding: 0 1\.25rem;/)
    expect(pill).toMatch(/gap: 0\.5rem;/)
    expect(pill).toMatch(/border-radius: 9999px;/)
    expect(pill).toMatch(/box-shadow: /)
    expect(pill).toMatch(/font-size: 0\.9375rem;/)
  })

  // SCEN-CM-07 adds the one JS viewport branch: how many greeting bubbles to
  // paint (it changes the announced copy, not just geometry). Channels and the
  // toggle still switch layout through CSS only.
  it('SCEN-BC-02: the channel/toggle layout switch is CSS, never a viewport branch in the template', () => {
    expect(template).not.toContain('isDesktop')
    const nav = template.slice(template.indexOf('<nav'), template.indexOf('</nav>'))
    const toggleTag = template.slice(template.indexOf('class="contact-toggle'), template.indexOf('</button>', template.indexOf('class="contact-toggle')))
    expect(nav).not.toBe('')
    expect(toggleTag).not.toBe('')
    for (const markup of [nav, toggleTag]) expect(markup).not.toContain('compactGreeting')
    const slot = template.slice(template.indexOf('class="teaser-slot"'), template.indexOf('<nav'))
    expect(template.split('compactGreeting').length - 1).toBe(slot.split('compactGreeting').length - 1)
  })

  it('SCEN-CM-10: md+ removes the toggle and always shows the pill row', () => {
    expect(desktopRule('.contact-toggle')).toMatch(/display: none;/)
    const nav = desktopRule('.contact-bar')
    expect(nav).toMatch(/display: flex;/)
    expect(nav).toMatch(/flex-direction: row;/)
    expect(nav).toMatch(/bottom: auto;/)
  })

  it('panel fallback is the pill row: 44 + 24 + 12 = 80px = 5rem, in bottom and height', () => {
    expect(chatPanelLiftPx(44)).toBe(80)
    expect(source).toContain('bottom: var(--panel-lift, 5rem);')
    expect(source).toContain('height: min(52rem, calc(100dvh - var(--panel-lift, 5rem) - 1.5rem));')
    expect(source).not.toContain('5.75rem')
  })

  const rule = (sel: string) => {
    const css = source.slice(source.indexOf('<style scoped>'), source.indexOf('@media (min-width: 768px) {'))
    return css.match(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{[^}]*\\}`))?.[0] ?? ''
  }

  it('SCEN-CM-01: the mobile dock is the toggle, 16px from the right and bottom (+ safe area)', () => {
    const dock = rule('.contact-dock')
    expect(dock).toMatch(/position: absolute;/)
    expect(dock).toMatch(/right: 16px;/)
    expect(dock).toMatch(/bottom: calc\(16px \+ env\(safe-area-inset-bottom\)\);/)
    expect(dock).not.toMatch(/left: 0;/)
  })

  it('SCEN-CM-01: the toggle is a 50px green pill with white text', () => {
    const t = rule('.contact-toggle')
    expect(t).toMatch(/height: 50px;/)
    expect(t).toMatch(/border-radius: 9999px;/)
    expect(t).toMatch(/background: var\(--color-contact-whatsapp, #14843f\);/)
    expect(t).toMatch(/color: #fff;/)
    expect(t).toMatch(/white-space: nowrap;/)
    const b = rule('.toggle-badge')
    expect(b).toMatch(/position: absolute;/)
    expect(b).toMatch(/top: -6px;/)
    expect(b).toMatch(/right: -4px;/)
    expect(b).toMatch(/background: #e50a35;/)
  })

  it('SCEN-CM-01/02: the menu is folded (display none) until the dock opens', () => {
    const nav = rule('.contact-bar')
    expect(nav).toMatch(/display: none;/)
    expect(nav).toMatch(/flex-direction: column;/)
    expect(nav).toMatch(/align-items: flex-end;/)
    expect(nav).toMatch(/gap: 10px;/)
    expect(nav).toMatch(/bottom: calc\(100% \+ 10px\);/)
    expect(source).toContain('.contact-dock--open .contact-bar { display: flex; }')
    // No full-width bar left on mobile.
    expect(nav).not.toMatch(/left: 0;/)
    expect(source).not.toContain('calc(64px + env(safe-area-inset-bottom))')
  })

  it('mobile menu dead zone: the <nav> lets taps through, only the pills catch them; desktop unchanged', () => {
    expect(rule('.contact-bar')).toMatch(/pointer-events: none;/)
    expect(rule('.bar-item')).toMatch(/pointer-events: auto;/)
    expect(desktopRule('.contact-bar')).toMatch(/pointer-events: auto;/)
  })

  it('toggle width is fixed: both labels share one grid cell, the inactive one invisible', () => {
    expect(rule('.toggle-label')).toMatch(/display: grid;/)
    expect(source).toContain('.toggle-label > span { grid-area: 1 / 1; text-align: center; }')
    expect(rule('.toggle-label-off')).toMatch(/visibility: hidden;/)
  })

  it('SCEN-CM-07: one bubble right-aligned above the toggle, never wider than a 320px screen', () => {
    const slot = rule('.teaser-slot')
    expect(slot).toMatch(/position: absolute;/)
    expect(slot).toMatch(/right: 0;/)
    expect(slot).toMatch(/bottom: calc\(100% \+ 12px\);/)
    // 16px gutters each side: 280px fits at 320px wide, and never overflows.
    expect(slot).toMatch(/width: min\(280px, calc\(100vw - 32px\)\);/)
    expect(rule('.teaser-stack')).toMatch(/align-items: flex-end;/)
    expect(rule('.teaser-bubble-solo')).toMatch(/border-radius: 16px 16px 4px 16px;/)
    expect(rule('.teaser-tail')).toMatch(/margin-right: 28px;/)
    // Desktop keeps its left-anchored stack.
    expect(desktopRule('.teaser-slot')).toMatch(/right: auto;/)
    expect(desktopRule('.teaser-stack')).toMatch(/align-items: flex-start;/)
  })

  it('SCEN-BC-06 desktop: greeting stacked above the pills, from the Chat IA edge', () => {
    const slot = desktopRule('.teaser-slot')
    expect(slot).toMatch(/bottom: calc\(100% \+ 10px\);/)
    // Left edge on Chat IA; slides left only if the row is narrower than 280px.
    expect(slot).toMatch(/left: min\(0px, calc\(100% - 280px\)\);/)
    expect(desktopRule('.teaser-tail')).toMatch(/margin-left: 40px;/)
  })

  it('bubbles follow the approved artboard: white, 14px, radii, shadow, 6px gap', () => {
    expect(rule('.teaser-stack')).toMatch(/gap: 6px;/)
    const b = rule('.teaser-bubble')
    expect(b).toMatch(/background: #fff;/)
    expect(b).toMatch(/padding: 10px 12px;/)
    expect(b).toMatch(/font-size: 14px;/)
    expect(b).toMatch(/line-height: 1\.35;/)
    expect(b).toMatch(/color: #141414;/)
    expect(b).toMatch(/box-shadow: 0 6px 20px rgba\(20, 20, 20, 0\.16\);/)
    expect(rule('.teaser-bubble-1')).toMatch(/border-radius: 16px 16px 16px 4px;/)
    expect(rule('.teaser-bubble-1')).toMatch(/padding-right: 36px;/)
    expect(rule('.teaser-bubble-2')).toMatch(/border-radius: 4px 16px 16px 16px;/)
    const x = rule('.teaser-close')
    expect(x).toMatch(/top: 4px;/)
    expect(x).toMatch(/right: 4px;/)
    expect(x).toMatch(/width: 28px;/)
    expect(x).toMatch(/height: 28px;/)
    expect(x).toMatch(/background: #f4f5f9;/)
    expect(x).toMatch(/color: #5b6170;/)
  })

  it('badge follows the artboard: red over the Chat IA circle on mobile, pill corner on desktop', () => {
    const b = rule('.bar-badge')
    expect(b).toMatch(/top: -6px;/)
    expect(b).toMatch(/right: -10px;/)
    expect(b).toMatch(/background: #e50a35;/)
    expect(b).toMatch(/border: 2px solid #fff;/)
    const d = desktopRule('.bar-badge')
    expect(d).toMatch(/left: -6px;/)
    expect(d).toMatch(/right: auto;/)
    expect(d).toMatch(/border-color: #fff;/)
  })

  it('the provisional anchor from steps 3–4 is gone', () => {
    expect(source).not.toContain('teaser-anchor')
  })
  const theme = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../assets/css/theme.css'), 'utf8')

  it('SCEN-BC-01: the three tokens exist with the measured-contrast hexes', () => {
    expect(theme).toMatch(/--color-contact-chat:\s*#6d28d9/i)
    expect(theme).toMatch(/--color-contact-call:\s*#1d4ed8/i)
    expect(theme).toMatch(/--color-contact-whatsapp:\s*#14843f/i)
  })

  // Each channel carries its token in --channel-color: the icon circle on
  // mobile (SCEN-CM-02), the whole pill on desktop (SCEN-BC-02).
  it('SCEN-BC-01/CM-02: each channel declares its token once', () => {
    expect(source).toMatch(/\.bar-chat \{ --channel-color: var\(--color-contact-chat, #6d28d9\); \}/)
    expect(source).toMatch(/\.bar-call \{ --channel-color: var\(--color-contact-call, #1d4ed8\); \}/)
    expect(source).toMatch(/\.bar-whatsapp \{ --channel-color: var\(--color-contact-whatsapp, #14843f\); \}/)
    expect(rule('.bar-icon')).toMatch(/background: var\(--channel-color\);/)
    const pill = desktopRule('.bar-item')
    expect(pill).toMatch(/background: var\(--channel-color\);/)
    expect(pill).toMatch(/color: #fff;/)
    expect(pill).toMatch(/border: 0;/)
  })

  it('SCEN-CM-02: mobile options are 44px white pills with a 30px colour circle', () => {
    const item = rule('.bar-item')
    expect(item).toMatch(/height: 44px;/)
    expect(item).toMatch(/flex-direction: row;/)
    expect(item).toMatch(/background: #fff;/)
    expect(item).toMatch(/border: 1px solid #e5e7eb;/)
    expect(item).toMatch(/color: #111827;/)
    expect(item).toMatch(/border-radius: 9999px;/)
    expect(item).toMatch(/font-weight: 700;/)
    const icon = rule('.bar-icon')
    expect(icon).toMatch(/width: 30px;/)
    expect(icon).toMatch(/height: 30px;/)
    expect(icon).toMatch(/color: #fff;/)
    // The desktop pill keeps its 22px icon; the circle scales it down to 18.
    const nav = source.match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? ''
    const icons = nav.match(/<svg width="(\d+)" height="(\d+)"/g) ?? []
    expect(icons).toHaveLength(3)
    for (const icon of icons) expect(icon).toBe('<svg width="22" height="22"')
    expect(rule('.bar-icon svg')).toMatch(/width: 18px;/)
    expect(desktopRule('.bar-icon svg')).toMatch(/width: 22px;/)
    expect(desktopRule('.bar-icon')).toMatch(/background: none;/)
  })

  // SCEN-BC-13: Escape, backdrop and the panel «×» all go through closeAll,
  // whose focus return to Chat IA is mount-tested through the backdrop above.
  // The «×» is wired here at source level: the panel body is an async
  // component and this harness cannot settle its real import across tests.
  it('SCEN-BC-13: the panel «×» (ChatConversation dismiss) runs closeAll', () => {
    expect(source).toMatch(/<ChatConversation [^>]*@dismiss="closeAll"/)
    expect(source).toMatch(/function closeAll\(\) \{\s*if \(!panelOpen\.value\) return\s*panelOpen\.value = false\s*chatButtonEl\.value\?\.focus\(\{ preventScroll: true \}\)\s*\}/)
    expect(source).toMatch(/<button\s+v-if="chatEnabled"\s+ref="chatButtonEl"/)
  })

  it('Escape runs closeAll from the window keydown listener', () => {
    expect(source).toMatch(/function onKeydown\(e: KeyboardEvent\) \{\s*if \(e\.key === 'Escape'\) closeAll\(\)\s*\}/)
    expect(source).toMatch(/window\.addEventListener\('keydown', onKeydown\)/)
  })

  // Equivalents of ChatWidget.panel-clearance «mide antes de abrir» and
  // SCEN-006 (ui-alquilatucarro), which pin the launcher names on the base copies.
  it('measures the <nav>, and re-observes it while it lives', () => {
    expect(source).toMatch(/<nav\s+ref="barEl"/)
    expect(source).toMatch(/barEl\.value\?\.getBoundingClientRect\(\)/)
    expect(source).toMatch(/barObserver\?\.disconnect\(\)/)
    expect(source).toMatch(/onBeforeUnmount\(\(\) => barObserver\?\.disconnect\(\)\)/)
  })

  it('measures the bar before opening the panel, so it never lands a frame late', () => {
    const fn = source.slice(source.indexOf('function openChat'))
    const measure = fn.indexOf('measureBar()')
    const open = fn.indexOf('panelOpen.value = true')
    expect(measure).toBeGreaterThan(-1)
    expect(open).toBeGreaterThan(measure)
  })

  it('the modal watcher and the status fallback timer are released on unmount', () => {
    expect(source).toMatch(/bodyObserver\?\.disconnect\(\)/)
    expect(source).toMatch(/clearTimeout\(statusFallbackTimer\)/)
  })

  it('removed launcher-era state stays removed', () => {
    for (const gone of ['menuOpen', 'contact-fab-menu', 'restoreFocusToLauncher', 'function toggle()', 'animate-pulse-attention', 'pulse-attention', 'fab-chip', 'shiftLeft', 'isWideViewport', 'data-shift-left', 'contact-fab-stack--reservation', 'launcherEl', 'launcherHeight', 'launcherObserver', 'measureLauncher', 'onChannelLink', 'closePanel']) {
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
    // Scoped to the panel rule: the desktop pill row legitimately sits at
    // `bottom: 1.5rem`, which is what the panel's lift arithmetic assumes.
    const panelRule = source.match(/\.chat-panel \{[^}]*\}/)?.[0] ?? ''
    expect(panelRule).toMatch(/bottom: var\(--panel-lift, \d+(\.\d+)?rem\);/)
    expect(panelRule).not.toMatch(/^\s*bottom: \d+(\.\d+)?rem;$/m)
    expect(source.match(/bottom: var\(--panel-lift/g)).toHaveLength(1)
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
