// @vitest-environment jsdom
// SCEN-001/002/003/004 — mounted DOM, not source regexes. Mounts the real
// ChatWidget with the real useCallPhone and a keyed useState, sets (or not) the
// forwarding number Google would hand back, and reads the rendered links.
// Spec: docs/specs/2026-09-23-website-call-forwarding/design.md
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineAsyncComponent, type Ref } from 'vue'
import { useChatStatus } from '@rentacar-main/logic/composables/useChatStatus'
import { useCallPhone } from '@rentacar-main/logic/composables/useCallPhone'
import { CALL_FORWARDING_STATE_KEY } from '@rentacar-main/logic/utils'
import ChatWidget from '../ChatWidget.vue'

const TUE_10H = '2026-07-21T15:00:00Z' // Tue 10:00 Bogota — WhatsApp open

const franchise = {
  shortname: 'alquilatucarro',
  whatsapp: 'https://wa.me/573016729250',
  phone: '+57 301 672 9250',
}

let state: Map<string, Ref<unknown>>

function stubNuxtGlobals() {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onMounted', onMounted)
  vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
  vi.stubGlobal('nextTick', nextTick)
  vi.stubGlobal('defineAsyncComponent', defineAsyncComponent)
  vi.stubGlobal('useAppConfig', () => ({ franchise }))
  vi.stubGlobal('useRoute', () => ({ path: '/' }))
  vi.stubGlobal('useStoreSearchData', () => ({ reservationOverlayOpen: ref(false) }))
  vi.stubGlobal('storeToRefs', (store: Record<string, unknown>) => store)
  // Keyed like Nuxt's useState, so the widget and the test share one ref.
  vi.stubGlobal('useState', (key: string, init: () => unknown) => {
    if (!state.has(key)) state.set(key, ref(init()))
    return state.get(key)
  })
  vi.stubGlobal('navigateTo', vi.fn())
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: { rentacarPublicApiBase: 'https://dashboard.test' },
  }))
  vi.stubGlobal('useChatStatus', useChatStatus)
  vi.stubGlobal('useCallPhone', useCallPhone)
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

async function mountWidget() {
  vi.setSystemTime(new Date(TUE_10H))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
    brand: 'alquilatucarro', enabled: true, whatsappSchedule: { tue: ['08:00-18:00'] },
  }))
  mount(ChatWidget, { global: { stubs: { ClientOnly: { template: '<div><slot /></div>' } } } })
  await flushPromises()
  await nextTick()
}

const callLink = () => document.body.querySelector<HTMLAnchorElement>('a[href^="tel:"]')
const waLink = () => document.body.querySelector<HTMLAnchorElement>('a[href*="wa.me"]')

beforeEach(() => {
  state = new Map()
  vi.useFakeTimers()
  stubNuxtGlobals()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('ChatWidget call button follows Google’s forwarding number', () => {
  it('SCEN-003: an organic visitor dials the real number', async () => {
    await mountWidget()
    expect(callLink()?.getAttribute('href')).toBe('tel:+573016729250')
    expect(callLink()?.getAttribute('aria-label')).toBe('Llamar al +57 301 672 9250')
  })

  it('SCEN-001/002: an ad visitor dials and hears the forwarding number', async () => {
    await mountWidget()
    state.get(CALL_FORWARDING_STATE_KEY)!.value = { display: '+57 601 555 0100', tel: '+576015550100' }
    await nextTick()
    expect(callLink()?.getAttribute('href')).toBe('tel:+576015550100')
    expect(callLink()?.getAttribute('aria-label')).toBe('Llamar al +57 601 555 0100')
  })

  it('SCEN-004: WhatsApp keeps the real number for an ad visitor', async () => {
    await mountWidget()
    state.get(CALL_FORWARDING_STATE_KEY)!.value = { display: '+57 601 555 0100', tel: '+576015550100' }
    await nextTick()
    expect(waLink()?.getAttribute('href')).toContain('wa.me/573016729250')
  })
})
