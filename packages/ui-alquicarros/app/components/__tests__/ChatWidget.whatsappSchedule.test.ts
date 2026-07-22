// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineAsyncComponent } from 'vue'
import { useChatStatus } from '@rentacar-main/logic/composables/useChatStatus'
import ChatWidget from '../ChatWidget.vue'

// D4 — real MOUNT test for the WhatsApp schedule gate. The previous version of
// this file asserted regexes over the .vue source, which passed without ever
// rendering. This mounts the widget with the REAL useChatStatus composable and a
// stubbed endpoint, then reads the DOM: fetch -> schedule -> predicate ->
// whatsappVisible -> <li>. Only the clock and the HTTP response are faked.
//
// The widget teleports to <body>, so assertions query document.body, not the
// wrapper — same surface the reviewer inspected in a real browser.

// Verified Bogota anchors (UTC-5, no DST):
const TUE_10H = '2026-07-21T15:00:00Z' // Tue 10:00 Bogota — inside 08:00-18:00
const TUE_20H = '2026-07-22T01:00:00Z' // Tue 20:00 Bogota — after close
const STANDARD = { tue: ['08:00-18:00'] }

const franchise = {
  shortname: 'alquicarros',
  whatsapp: 'https://wa.me/573016729250',
  phone: '+57 301 672 9250',
}

function stubNuxtGlobals() {
  // The SFC relies on Nuxt auto-imports; vitest does not run the auto-import scan.
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onMounted', onMounted)
  vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
  vi.stubGlobal('nextTick', nextTick)
  vi.stubGlobal('defineAsyncComponent', defineAsyncComponent)
  vi.stubGlobal('useAppConfig', () => ({ franchise }))
  vi.stubGlobal('useRoute', () => ({ path: '/blog' }))
  vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
  vi.stubGlobal('navigateTo', vi.fn())
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { rentacarPublicApiBase: 'https://dashboard.test' },
  }))
  // The real composable under test — same code path the app runs.
  vi.stubGlobal('useChatStatus', useChatStatus)
  vi.stubGlobal('useChatUnreadBadge', () => ({
    unread: ref(0),
    announce: ref(''),
    emitReopenedFromBadge: vi.fn(),
    prepareChatOpen: vi.fn(),
  }))
  vi.stubGlobal('useContactTeaser', () => ({
    syntheticCount: ref(0),
    teaserVisible: ref(false),
    teaserStep: ref(1),
    teaserAnnounce: ref(''),
    start: vi.fn(),
    stop: vi.fn(),
    dismiss: vi.fn(),
    engage: vi.fn(),
    suppressForSession: vi.fn(),
  }))
}

const stubs = {
  // <ClientOnly> renders its default slot in the browser; pass it through.
  ClientOnly: { template: '<div><slot /></div>' },
}

/** Mounts the widget with the endpoint answering `payload`, at instant `nowIso`. */
async function mountWidget(payload: unknown, nowIso: string) {
  vi.setSystemTime(new Date(nowIso))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(payload))
  const wrapper = mount(ChatWidget, { global: { stubs } })
  await flushPromises()
  await nextTick()
  return wrapper
}

/** Labels of the contact-menu options currently in the DOM, in render order. */
function menuLabels(): string[] {
  return Array.from(document.querySelectorAll('#contact-fab-menu li'))
    .map(li => li.querySelector('.fab-label')?.textContent?.trim() ?? '')
}

beforeEach(() => {
  vi.useFakeTimers()
  stubNuxtGlobals()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('ChatWidget — WhatsApp option is gated by the schedule (mounted DOM)', () => {
  it('renders WhatsApp inside the window', async () => {
    await mountWidget(
      { brand: 'alquicarros', enabled: true, whatsappSchedule: STANDARD },
      TUE_10H,
    )
    expect(menuLabels()).toEqual(['Chat 24 horas', 'WhatsApp', 'Llámanos'])
  })

  it('removes the WhatsApp option outside the window, keeping Chat and Llámanos', async () => {
    await mountWidget(
      { brand: 'alquicarros', enabled: true, whatsappSchedule: STANDARD },
      TUE_20H,
    )
    const labels = menuLabels()
    expect(labels).not.toContain('WhatsApp')
    expect(labels).toEqual(['Chat 24 horas', 'Llámanos'])
    // The wa.me link itself is gone from the FAB, not merely hidden by CSS.
    expect(document.querySelectorAll('#contact-fab-menu a[href*="wa.me"]')).toHaveLength(0)
  })

  it('hides WhatsApp all week for an empty schedule {} (canonical semantics)', async () => {
    await mountWidget(
      { brand: 'alquicarros', enabled: true, whatsappSchedule: {} },
      TUE_10H,
    )
    expect(menuLabels()).not.toContain('WhatsApp')
  })

  it('keeps WhatsApp visible when no schedule is configured (null)', async () => {
    await mountWidget(
      { brand: 'alquicarros', enabled: true, whatsappSchedule: null },
      TUE_20H, // a time a schedule would have hidden
    )
    expect(menuLabels()).toContain('WhatsApp')
  })

  it('keeps WhatsApp visible when the request fails (fail-open)', async () => {
    vi.setSystemTime(new Date(TUE_20H))
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('network down')))
    mount(ChatWidget, { global: { stubs } })
    await flushPromises()
    await nextTick()
    expect(menuLabels()).toContain('WhatsApp')
  })

  it('closes the option on the 60s tick when the window ends', async () => {
    await mountWidget(
      { brand: 'alquicarros', enabled: true, whatsappSchedule: STANDARD },
      TUE_10H,
    )
    expect(menuLabels()).toContain('WhatsApp')

    // Cross 18:00 with the tab open; the minute tick must drop the option.
    vi.setSystemTime(new Date('2026-07-21T23:00:00Z')) // Tue 18:00 Bogota
    vi.advanceTimersByTime(60_000)
    await nextTick()
    expect(menuLabels()).not.toContain('WhatsApp')
  })
})

describe('ChatWidget — the gate does not disturb the rest of the menu', () => {
  it('leaves the Call option ungated and the menu accessible with WhatsApp absent', async () => {
    await mountWidget(
      { brand: 'alquicarros', enabled: true, whatsappSchedule: STANDARD },
      TUE_20H,
    )
    const menu = document.querySelector('#contact-fab-menu')
    expect(menu?.getAttribute('aria-label')).toBe('Opciones de contacto')

    // Call survives untouched, with its tel: href and aria-label intact.
    const call = document.querySelector<HTMLAnchorElement>('#contact-fab-menu a[href^="tel:"]')
    expect(call).not.toBeNull()
    expect(call?.getAttribute('aria-label')).toBe(`Llamar al ${franchise.phone}`)

    // Chat keeps its own independent gate and stays present.
    expect(document.querySelector('#contact-fab-menu .fab-chat')).not.toBeNull()
  })

  it('still hides Chat via its own gate while WhatsApp follows the schedule', async () => {
    // Chat OFF (fail-closed) + inside the WhatsApp window: only WhatsApp + Call.
    await mountWidget(
      { brand: 'alquicarros', enabled: false, whatsappSchedule: STANDARD },
      TUE_10H,
    )
    expect(menuLabels()).toEqual(['WhatsApp', 'Llámanos'])
  })
})
