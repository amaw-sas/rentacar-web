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
import { chatPanelLiftPx } from '@rentacar-main/logic/utils/chatPanelLift'
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
// Same key and copy as packages/ui-alquilame/app/app.config.ts.
const ALQUILAME_LINE_2 = '¿Dudas de requisitos o precios? Estamos en línea 24 horas.'
let chatGreeting: { line2?: string } | undefined

interface Harness {
  chatEnabled: Ref<boolean>
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
  chatGreeting = { line2: ALQUILAME_LINE_2 }
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

const bubbles = () => [...document.body.querySelectorAll<HTMLElement>('.teaser-live > .teaser-bubble')]
const teaserSlot = () => q<HTMLElement>('.teaser-slot')
const closeTeaser = () => q<HTMLButtonElement>('.teaser-live button.teaser-close')

describe('SCEN-BC-06 — the greeting sits over Chat IA with «×» and badge', () => {
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

  it('the tail points at Chat IA: the slot knows how many blocks share the bar', async () => {
    h.teaserVisible.value = true
    await mountWidget()
    expect(teaserSlot()!.style.getPropertyValue('--bar-items')).toBe('3')
    h.whatsappVisible.value = false
    await settle()
    expect(teaserSlot()!.style.getPropertyValue('--bar-items')).toBe('2')
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
    expect(h.navigateTo).toHaveBeenCalledWith('/chat')
  })

  it('reservation funnel route: no bubble', async () => {
    stubNuxtGlobals('/reservas')
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

  it('bubble 1 at 5 s, bubble 2 «…24 horas.» 20 s later', async () => {
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

  it('SCEN-BC-02: the layout switch is CSS, never a viewport branch in the template', () => {
    expect(template).not.toContain('isDesktop')
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

  it('mobile dock spans the bottom edge; the bar inside it keeps bottom 0', () => {
    const dock = rule('.contact-dock')
    expect(dock).toMatch(/position: absolute;/)
    expect(dock).toMatch(/left: 0;/)
    expect(dock).toMatch(/right: 0;/)
    expect(dock).toMatch(/bottom: 0;/)
  })

  it('SCEN-BC-06 mobile: greeting at the left edge over Chat IA, above the bar, never wider than the viewport', () => {
    const slot = rule('.teaser-slot')
    expect(slot).toMatch(/position: absolute;/)
    expect(slot).toMatch(/left: 12px;/)
    // Above the bar's 64px + safe area: it can never cover Llamar or WhatsApp.
    expect(slot).toMatch(/bottom: calc\(64px \+ env\(safe-area-inset-bottom\) \+ 34px\);/)
    // 12px gutters each side: 280px fits at 320px wide, and never overflows.
    expect(slot).toMatch(/width: min\(280px, calc\(100vw - 24px\)\);/)
    // The tail points at the centre of the first block (Chat IA).
    expect(rule('.teaser-tail')).toMatch(/margin-left: calc\(100vw \/ var\(--bar-items, 3\) \/ 2 - 21px\);/)
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

  it('badge follows the artboard: red over the Chat IA icon on mobile, pill corner on desktop', () => {
    const b = rule('.bar-badge')
    expect(b).toMatch(/top: -6px;/)
    expect(b).toMatch(/right: -10px;/)
    expect(b).toMatch(/background: #e50a35;/)
    expect(b).toMatch(/border: 2px solid var\(--color-contact-chat, #6d28d9\);/)
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

  // SCEN-BC-13: Escape, backdrop and the panel «×» all go through closeAll,
  // whose focus return to Chat IA is mount-tested through the backdrop above.
  // The «×» is wired here at source level: the panel body is an async
  // component and this harness cannot settle its real import across tests.
  it('SCEN-BC-13: the panel «×» (ChatConversation dismiss) runs closeAll', () => {
    expect(source).toMatch(/<ChatConversation [^>]*@dismiss="closeAll"/)
    expect(source).toMatch(/function closeAll\(\) \{\s*if \(!panelOpen\.value\) return\s*closePanel\(\)\s*chatButtonEl\.value\?\.focus\(\{ preventScroll: true \}\)\s*\}/)
    expect(source).toMatch(/<button\s+v-if="chatEnabled"\s+ref="chatButtonEl"/)
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
