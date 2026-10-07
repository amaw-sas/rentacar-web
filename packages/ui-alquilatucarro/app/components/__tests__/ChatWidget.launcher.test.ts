// @vitest-environment jsdom
// SCEN-01..09 of docs/specs/2026-10-06-contact-fab-collapse — mounted DOM.
// The widget collapses back into ONE launcher FAB that expands into the channel
// menu. Gates (chatEnabled / whatsappVisible), unread counts, the teaser and the
// reservation overlay are driven through refs so every state is reachable.
// Source assertions at the bottom cover only what a mount cannot observe: CSS
// fallbacks, the ResizeObserver wiring, the "exactly one" watcher and the
// Escape listener (it is registered behind `import.meta.client`, which vitest
// leaves undefined, so a mounted widget never attaches it).
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
  shortname: 'alquilatucarro',
  whatsapp: 'https://wa.me/573016729250',
  phone: '+57 301 672 9250',
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
const launcher = () => q<HTMLButtonElement>('button[aria-controls="contact-fab-menu"]')
const menu = () => q<HTMLElement>('#contact-fab-menu')
const backdrop = () => q<HTMLButtonElement>('button[aria-hidden="true"].bg-black\\/50')
const panel = () => q('[role="dialog"]')
const bubble = () => q('.teaser-bubble.pointer-events-auto')
const menuShown = () => !!menu() && menu()!.style.display !== 'none'
const chatOption = () => q<HTMLButtonElement>('button[aria-label="Abrir Chat 24 horas"]')
const waLink = () => q<HTMLAnchorElement>('a[href*="wa.me"]')
const callLink = () => q<HTMLAnchorElement>('a[href^="tel:"]')

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

describe('SCEN-01 — collapsed by default: one button, no rows', () => {
  it('renders exactly one 56px brand-primary launcher with the bubble icon', async () => {
    await mountWidget()
    const buttons = document.body.querySelectorAll('button[aria-controls="contact-fab-menu"]')
    expect(buttons).toHaveLength(1)
    const btn = launcher()!
    expect(btn.className).toContain('w-14')
    expect(btn.className).toContain('h-14')
    expect(btn.className).toContain('bg-primary')
    expect(btn.querySelector('path[d^="M21 15a2 2 0 0 1-2 2H7l-4 4V5"]')).not.toBeNull()
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(btn.getAttribute('aria-label')).toBe('Abrir opciones de contacto')
  })

  it('shows no channel rows or labels until the launcher is tapped', async () => {
    await mountWidget()
    expect(menuShown()).toBe(false)
    expect(backdrop()).toBeNull()
    const labels = [...document.body.querySelectorAll('.fab-label')]
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect((label.closest('#contact-fab-menu') as HTMLElement).style.display).toBe('none')
    }
  })

  it('keeps the pre-July tab order: menu items first, launcher last', async () => {
    await mountWidget()
    expect(menu()!.compareDocumentPosition(launcher()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('pulses only while collapsed and badge-free', async () => {
    await mountWidget()
    expect(launcher()!.className).toContain('animate-pulse-attention')
    await click(launcher())
    expect(launcher()!.className).not.toContain('animate-pulse-attention')
    await click(launcher())
    h.unread.value = 2
    await settle()
    expect(launcher()!.className).not.toContain('animate-pulse-attention')
  })
})

describe('SCEN-02 — tap opens the gated menu', () => {
  it('opens the menu, flips to X, dims the page and leaves the app root un-inert', async () => {
    await mountWidget()
    const btn = launcher()!
    btn.focus()
    await click(btn)
    expect(menuShown()).toBe(true)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(btn.getAttribute('aria-label')).toBe('Cerrar')
    expect(btn.querySelector('line')).not.toBeNull()
    expect(backdrop()).not.toBeNull()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(btn)
    expect(q(`#${btn.getAttribute('aria-controls')}`)).toBe(menu())
  })

  it('lists Chat, WhatsApp and Llámanos when every gate is on', async () => {
    await mountWidget()
    await click(launcher())
    expect(chatOption()).not.toBeNull()
    expect(waLink()).not.toBeNull()
    expect(callLink()).not.toBeNull()
  })

  it('lists only gate-allowed channels (WhatsApp off)', async () => {
    h.whatsappVisible.value = false
    await mountWidget()
    await click(launcher())
    expect(menuShown()).toBe(true)
    expect(chatOption()).not.toBeNull()
    expect(waLink()).toBeNull()
  })

  it('lists only gate-allowed channels (chat off)', async () => {
    h.chatEnabled.value = false
    await mountWidget()
    await click(launcher())
    expect(chatOption()).toBeNull()
    expect(waLink()).not.toBeNull()
  })

  it('opening the menu alone is not an engage', async () => {
    await mountWidget()
    await click(launcher())
    expect(h.engage).not.toHaveBeenCalled()
  })
})

describe('SCEN-03 — WhatsApp / Llámanos act and close the menu', () => {
  it('WhatsApp keeps its wa.me href, engages and closes the menu', async () => {
    await mountWidget()
    await click(launcher())
    expect(waLink()!.getAttribute('href')).toBe(franchise.whatsapp)
    await click(waLink())
    expect(h.engage).toHaveBeenCalledWith('whatsapp')
    expect(menuShown()).toBe(false)
    expect(launcher()!.getAttribute('aria-expanded')).toBe('false')
  })

  it('Llámanos keeps its tel: href, engages and closes the menu', async () => {
    await mountWidget()
    await click(launcher())
    expect(callLink()!.getAttribute('href')).toBe('tel:+573016729250')
    await click(callLink())
    expect(h.engage).toHaveBeenCalledWith('llamada')
    expect(menuShown()).toBe(false)
  })
})

describe('SCEN-04 — Chat opens the panel anchored above the launcher', () => {
  it('desktop: closes the menu and opens the panel lifted by launcher height + 36px, measured synchronously', async () => {
    stubMatchMedia(true)
    // jsdom has no ResizeObserver: the lift can only come from the synchronous
    // measure inside openChat, so this pins that path.
    expect(typeof ResizeObserver).toBe('undefined')
    await mountWidget()
    await click(launcher())
    vi.spyOn(launcher()!, 'getBoundingClientRect').mockReturnValue({ height: 56 } as DOMRect)
    await click(chatOption())
    expect(menuShown()).toBe(false)
    expect(panel()).not.toBeNull()
    expect(panel()!.getAttribute('style')).toContain('--panel-lift: 92px')
  })

  it('mobile: navigates to /chat and leaves the menu closed', async () => {
    await mountWidget()
    await click(launcher())
    await click(chatOption())
    expect(h.navigateTo).toHaveBeenCalledWith('/chat')
    expect(menuShown()).toBe(false)
    expect(launcher()!.getAttribute('aria-expanded')).toBe('false')
    expect(panel()).toBeNull()
  })
})

describe('SCEN-05 — Escape and backdrop close everything', () => {
  it('clicking the backdrop closes the open menu and the launcher returns to collapsed', async () => {
    await mountWidget()
    await click(launcher())
    await click(backdrop())
    expect(menuShown()).toBe(false)
    expect(backdrop()).toBeNull()
    expect(launcher()!.getAttribute('aria-expanded')).toBe('false')
    expect(launcher()!.getAttribute('aria-label')).toBe('Abrir opciones de contacto')
  })

  it('the backdrop closes the open panel too, and un-inerts the app root', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(launcher())
    await click(chatOption())
    expect(panel()).not.toBeNull()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(true)
    await click(backdrop())
    expect(panel()).toBeNull()
    expect(backdrop()).toBeNull()
    expect(document.getElementById('__nuxt')!.hasAttribute('inert')).toBe(false)
    expect(launcher()!.getAttribute('aria-expanded')).toBe('false')
  })

  it('tapping the X while the panel is open closes the panel, not the menu', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(launcher())
    await click(chatOption())
    expect(launcher()!.getAttribute('aria-label')).toBe('Cerrar')
    await click(launcher())
    expect(panel()).toBeNull()
    expect(menuShown()).toBe(false)
  })

  it('Escape runs closeAll (menu + panel) from the window keydown listener', () => {
    const src = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../ChatWidget.vue'), 'utf8')
    expect(src).toMatch(/function onKeydown\(e: KeyboardEvent\) \{\s*if \(e\.key === 'Escape'\) closeAll\(\)\s*\}/)
    expect(src).toMatch(/window\.addEventListener\('keydown', onKeydown\)/)
    expect(src).toMatch(/function closeAll\(\) \{\s*restoreFocusToLauncher\(\)\s*menuOpen\.value = false\s*closePanel\(\)\s*\}/)
  })

  // Un usuario de teclado puede tener el foco DENTRO del menú (los ítems van
  // antes del lanzador en el orden de tab). Ocultar el <ul> con el foco dentro
  // lo manda a <body> y el siguiente Tab arranca desde el inicio de la página.
  it('closing the menu with focus on a menu item returns focus to the launcher', async () => {
    await mountWidget()
    await click(launcher())
    waLink()!.focus()
    expect(document.activeElement).toBe(waLink())
    await click(backdrop())
    expect(menuShown()).toBe(false)
    expect(document.activeElement).toBe(launcher())
  })

  it('activating a channel link with keyboard focus returns focus to the launcher', async () => {
    await mountWidget()
    await click(launcher())
    waLink()!.focus()
    await click(waLink())
    expect(menuShown()).toBe(false)
    expect(h.engage).toHaveBeenCalledWith('whatsapp')
    expect(document.activeElement).toBe(launcher())
  })

  // La X del panel abierto se anuncia expandida: el icono, la etiqueta «Cerrar»
  // y aria-expanded cuentan la misma historia al lector de pantalla.
  it('aria-expanded is true while the panel is open (matches the X and «Cerrar»)', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(launcher())
    await click(chatOption())
    expect(panel()).not.toBeNull()
    expect(launcher()!.getAttribute('aria-label')).toBe('Cerrar')
    expect(launcher()!.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('SCEN-06 — one badge, right place, never cleared by the menu', () => {
  const launcherBadge = () => launcher()!.querySelector('.fab-badge')
  const optionBadge = () => chatOption()!.querySelector('.fab-badge-option')
  const chip = () => chatOption()!.querySelector('.fab-chip')

  it('collapsed: real unread badges the launcher, singular/plural in the label', async () => {
    h.unread.value = 1
    await mountWidget()
    expect(launcherBadge()!.textContent).toBe('1')
    expect(launcher()!.getAttribute('aria-label')).toBe('Abrir opciones de contacto (1 mensaje nuevo)')
    h.unread.value = 3
    await settle()
    expect(launcherBadge()!.textContent).toBe('3')
    expect(launcher()!.getAttribute('aria-label')).toBe('Abrir opciones de contacto (3 mensajes nuevos)')
  })

  it('caps the launcher badge at 9+', async () => {
    h.unread.value = 12
    await mountWidget()
    expect(launcherBadge()!.textContent).toBe('9+')
  })

  it('synthetic teaser count badges the launcher when there is no real unread; real wins over it', async () => {
    h.syntheticCount.value = 2
    await mountWidget()
    expect(launcherBadge()!.textContent).toBe('2')
    h.unread.value = 3
    await settle()
    expect(launcherBadge()!.textContent).toBe('3')
  })

  it('real unread never badges the launcher while chat is off', async () => {
    h.chatEnabled.value = false
    h.unread.value = 3
    await mountWidget()
    expect(launcher()).not.toBeNull()
    expect(launcherBadge()).toBeNull()
    expect(launcher()!.getAttribute('aria-label')).toBe('Abrir opciones de contacto')
  })

  it('menu open: the launcher badge is hidden (not cleared) and the count lands on the Chat circle', async () => {
    h.unread.value = 3
    await mountWidget()
    await click(launcher())
    expect(launcherBadge()).toBeNull()
    expect(optionBadge()!.textContent).toBe('3')
    expect(chip()).toBeNull()
    await click(launcher())
    expect(launcherBadge()!.textContent).toBe('3')
    expect(h.unread.value).toBe(3)
  })

  it('green 24/7 chip shows only when both counts are 0', async () => {
    await mountWidget()
    await click(launcher())
    expect(chip()).not.toBeNull()
    expect(optionBadge()).toBeNull()
    h.syntheticCount.value = 1
    await settle()
    expect(chip()).toBeNull()
    expect(optionBadge()!.textContent).toBe('1')
  })
})

describe('SCEN-07 — teaser bubble vs menu', () => {
  beforeEach(() => {
    h.teaserVisible.value = true
  })

  it('shows the bubble when collapsed; clicking it opens the chat directly (no menu)', async () => {
    await mountWidget()
    expect(bubble()).not.toBeNull()
    await click(bubble())
    expect(h.navigateTo).toHaveBeenCalledWith('/chat')
    expect(menuShown()).toBe(false)
    expect(launcher()!.getAttribute('aria-expanded')).toBe('false')
  })

  it('desktop: clicking the bubble opens the panel directly', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(bubble())
    expect(panel()).not.toBeNull()
    expect(menuShown()).toBe(false)
  })

  it('hides the bubble while the menu is open and brings it back when the menu closes without engage', async () => {
    await mountWidget()
    expect(bubble()).not.toBeNull()
    await click(launcher())
    expect(bubble()).toBeNull()
    await click(launcher())
    expect(bubble()).not.toBeNull()
    expect(h.engage).not.toHaveBeenCalled()
  })

  // Atribución del beacon: con el timer del teaser vivo pero la burbuja OCULTA
  // (menú abierto), abrir el chat desde la fila del menú es 'fab', no 'teaser'.
  // Antes burbuja y botón convivían a la vista y la ambigüedad era real; ahora
  // sería un falso determinista que infla el KPI del teaser.
  it('opening the chat from the menu while the teaser timer is live reports fab, not teaser', async () => {
    await mountWidget()
    await click(launcher())
    await click(chatOption())
    expect(h.prepareChatOpen).toHaveBeenCalledWith('fab')
  })

  it('opening the chat from the visible bubble still reports teaser', async () => {
    await mountWidget()
    await click(bubble())
    expect(h.prepareChatOpen).toHaveBeenCalledWith('teaser')
  })
})

describe('SCEN-08 — reservation overlay resets the menu, not the panel', () => {
  it('stack unmounts with the overlay and returns collapsed (no pre-opened menu)', async () => {
    await mountWidget()
    await click(launcher())
    expect(menuShown()).toBe(true)
    h.overlayOpen.value = true
    await settle()
    expect(launcher()).toBeNull()
    h.overlayOpen.value = false
    await settle()
    expect(launcher()).not.toBeNull()
    expect(menuShown()).toBe(false)
    expect(launcher()!.getAttribute('aria-expanded')).toBe('false')
    expect(backdrop()).toBeNull()
  })

  it('an open chat panel survives the overlay unchanged', async () => {
    stubMatchMedia(true)
    await mountWidget()
    await click(launcher())
    await click(chatOption())
    expect(panel()).not.toBeNull()
    h.overlayOpen.value = true
    await settle()
    expect(panel()).not.toBeNull()
    h.overlayOpen.value = false
    await settle()
    expect(panel()).not.toBeNull()
  })
})

describe('SCEN-09 — gates off: nothing renders, no stale menu', () => {
  it('renders no launcher when chat and WhatsApp are both off', async () => {
    h.chatEnabled.value = false
    h.whatsappVisible.value = false
    await mountWidget()
    expect(launcher()).toBeNull()
    expect(menu()).toBeNull()
  })

  it('does not reappear pre-opened after the gates go off with the menu open and a channel returns', async () => {
    await mountWidget()
    await click(launcher())
    expect(menuShown()).toBe(true)
    h.chatEnabled.value = false
    h.whatsappVisible.value = false
    await settle()
    expect(launcher()).toBeNull()
    h.whatsappVisible.value = true
    await settle()
    expect(launcher()).not.toBeNull()
    expect(menuShown()).toBe(false)
    expect(backdrop()).toBeNull()
  })

  it('chat turning off with WhatsApp still on keeps the stack; its Chat row unmounts', async () => {
    await mountWidget()
    await click(launcher())
    h.chatEnabled.value = false
    await settle()
    expect(launcher()).not.toBeNull()
    expect(chatOption()).toBeNull()
    expect(waLink()).not.toBeNull()
  })
})

describe('source-level wiring a mount cannot observe', () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../ChatWidget.vue'), 'utf8')

  it('ONE watcher on the full stack-visibility expression resets menuOpen', () => {
    const expr = 'watch(() => (chatEnabled.value || whatsappVisible.value) && !hideContactButtons.value'
    expect(source.split(expr)).toHaveLength(2)
  })

  it('measures the launcher button, not the channel list', () => {
    expect(source).toMatch(/<button[^>]*\sref="launcherEl"|ref="launcherEl"[^>]*aria-controls/s)
    expect(source).toMatch(/launcherEl\.value\?\.getBoundingClientRect\(\)/)
    expect(source).not.toContain('channelsEl')
  })

  it('openChat closes the menu and measures before opening the panel', () => {
    const fn = source.slice(source.indexOf('function openChat'))
    const closeMenu = fn.indexOf('menuOpen.value = false')
    const measure = fn.indexOf('measureLauncher()')
    const open = fn.indexOf('panelOpen.value = true')
    expect(closeMenu).toBeGreaterThan(-1)
    expect(measure).toBeGreaterThan(-1)
    expect(open).toBeGreaterThan(measure)
  })

  it('CSS fallback is the launcher case (5.75rem) in both bottom and height', () => {
    expect(source).toContain('bottom: var(--panel-lift, 5.75rem);')
    expect(source).toContain('height: min(52rem, calc(100dvh - var(--panel-lift, 5.75rem) - 1.5rem));')
    expect(source).not.toMatch(/(?<![\d.])9rem/)
  })

  it('background inert stays panel-only (the menu is a dismiss layer, not a modal)', () => {
    expect(source).toContain('watch(panelOpen, (open) => setBackgroundInert(open))')
    expect(source).not.toMatch(/setBackgroundInert\(menuOpen/)
  })
})
