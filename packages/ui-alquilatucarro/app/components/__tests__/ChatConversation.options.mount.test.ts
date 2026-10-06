// @vitest-environment jsdom
//
// chat-option-buttons.scenarios.md (docs/specs/2026-10-05-chat-option-buttons) at
// the DOM level: a REAL conversation instance driven by a stubbed SSE `fetch`.
// `data-buttons.opciones` are action buttons (same color, arrival order) whose
// label goes back as the customer's message; the link buttons render as before.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import {
  createChatConversation,
  type ChatConversation as ChatInstance,
  type ChatConversationConfig,
} from '@rentacar-main/logic/composables/useChatConversation'
import ChatConversation from '../ChatConversation.vue'

const OPCIONES = ['Quiero reservar', 'Quiero ver fotos', 'Tengo preguntas']
const WA = 'https://wa.me/573001234567'
const text = (s: string) => [
  { type: 'text-start', id: s },
  { type: 'text-delta', id: s, delta: s },
  { type: 'text-end', id: s },
]
const buttons = (payload: unknown) => ({ type: 'data-buttons', data: payload })

// fetch that answers every turn with the next queued SSE body, delivered whole.
function sseFetch(turns: unknown[][]) {
  const encoder = new TextEncoder()
  const queue = [...turns]
  return vi.fn((_url: string, _init?: { body?: string }) => {
    const events = queue.shift() ?? []
    const chunks = [
      { done: false, value: encoder.encode(events.map((e) => `data: ${JSON.stringify(e)}\n`).join('')) },
      { done: true, value: undefined },
    ]
    return Promise.resolve({
      ok: true,
      headers: { get: () => null },
      body: { getReader: () => ({ read: () => Promise.resolve(chunks.shift() ?? { done: true }) }) },
    })
  })
}

let brandSeq = 0
function cfg(brand = `opt-ui-${brandSeq++}`): ChatConversationConfig {
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  }
}

let fetchMock: ReturnType<typeof sseFetch>
async function converse(turns: unknown[][], replies: unknown[][] = [], config = cfg()): Promise<ChatInstance> {
  fetchMock = sseFetch([...turns, ...replies])
  vi.stubGlobal('fetch', fetchMock)
  const instance = createChatConversation(config)
  for (let t = 0; t < turns.length; t++) {
    instance.input.value = `pregunta ${t + 1}`
    await instance.submit()
  }
  return instance
}

let wrapper: VueWrapper | null = null
async function render(instance: ChatInstance) {
  vi.stubGlobal('useChatConversation', () => instance)
  wrapper = mount(ChatConversation, { props: { variant: 'page', active: true } })
  await wrapper.vm.$nextTick()
  return wrapper
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
  await wrapper!.vm.$nextTick()
}
const optionBtns = (w: VueWrapper) => w.findAll('button.cc-option-btn')
const sentTexts = () =>
  fetchMock.mock.calls.map((c) => {
    const body = JSON.parse(String(c[1]?.body)) as { messages: Array<{ role: string; parts: Array<{ text?: string }> }> }
    return body.messages.at(-1)!.parts.map((p) => p.text ?? '').join('')
  })

beforeEach(() => {
  localStorage.clear()
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}
  if (typeof globalThis.CSS === 'undefined') vi.stubGlobal('CSS', { escape: (s: string) => s })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('SCEN-001 — options-only part renders same-colored buttons in order', () => {
  it('shows the 3 options in arrival order with one shared class and enabled', async () => {
    const w = await render(await converse([[...text('¿Qué quieres hacer?'), buttons({ opciones: OPCIONES })]]))
    const btns = optionBtns(w)
    expect(btns.map((b) => b.text())).toEqual(OPCIONES)
    expect(new Set(btns.map((b) => b.classes().join(' '))).size).toBe(1)
    expect(btns.every((b) => b.attributes('type') === 'button' && b.attributes('disabled') === undefined)).toBe(true)
    expect(w.findAll('a.cc-link-btn')).toHaveLength(0)
  })
})

describe('SCEN-002 / SCEN-003 — tap sends the exact text once, then the row disables', () => {
  it('sends the label verbatim, the bot answers, and the old row stays disabled', async () => {
    const instance = await converse(
      [[...text('¿Qué quieres hacer?'), buttons({ opciones: OPCIONES })]],
      [[...text('Perfecto, ¿en qué ciudad?')]],
    )
    instance.input.value = 'borrador sin enviar'
    const w = await render(instance)
    const btns = optionBtns(w)
    // Double tap + a tap on another option in the same tick: only one turn.
    ;(btns[1]!.element as HTMLButtonElement).click()
    ;(btns[1]!.element as HTMLButtonElement).click()
    ;(btns[2]!.element as HTMLButtonElement).click()
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sentTexts().at(-1)).toBe('Quiero ver fotos')
    const msgs = instance.messages.value
    expect(msgs.at(-2)).toMatchObject({ role: 'user', text: 'Quiero ver fotos' })
    expect(msgs.at(-1)).toMatchObject({ role: 'assistant', text: 'Perfecto, ¿en qué ciudad?' })
    expect(instance.input.value).toBe('borrador sin enviar')

    const after = optionBtns(w)
    expect(after).toHaveLength(3)
    expect(after.every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    ;(after[0]!.element as HTMLButtonElement).click()
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('a reloaded transcript keeps the answered row disabled', async () => {
    const config = cfg()
    const now = Date.now()
    localStorage.setItem(config.messagesKey, JSON.stringify([
      { id: 'u1', role: 'user', text: 'hola', createdAt: now - 3000 },
      { id: 'a1', role: 'assistant', text: '¿Qué quieres hacer?', createdAt: now - 2000, actions: { opciones: OPCIONES } },
      { id: 'u2', role: 'user', text: 'Quiero reservar', createdAt: now - 1000 },
      { id: 'a2', role: 'assistant', text: 'Listo', createdAt: now - 500 },
    ]))
    vi.stubGlobal('fetch', vi.fn())
    const w = await render(createChatConversation(config))
    const btns = optionBtns(w)
    expect(btns).toHaveLength(3)
    expect(btns.every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })
})

describe('SCEN-004 — whatsapp + opciones in one part render both', () => {
  it('shows the advisor link and the 3 options', async () => {
    const w = await render(await converse([[...text('Te ayudo'), buttons({ whatsapp: WA, opciones: OPCIONES })]]))
    const wa = w.findAll('a.cc-link-btn-wa')
    expect(wa).toHaveLength(1)
    expect(wa[0]!.attributes('href')).toBe(WA)
    expect(optionBtns(w).map((b) => b.text())).toEqual(OPCIONES)
  })
})

describe('SCEN-005 — legacy web + share render exactly as before', () => {
  const legacy = (w: VueWrapper) =>
    w.findAll('.cc-actions > *').map((el) => ({
      tag: el.element.tagName,
      cls: el.classes().join(' '),
      href: el.attributes('href'),
      label: el.text(),
    }))
  const expected = [
    { tag: 'A', cls: 'cc-link-btn', href: 'https://reserva.test/x', label: 'Terminar mi reserva en la web' },
    { tag: 'A', cls: 'cc-link-btn cc-link-btn-share', href: 'https://wa.me/?text=hola', label: 'Compartir cotización' },
  ]

  it('streamed web + share', async () => {
    const w = await render(await converse([[...text('Aquí'), buttons({ web: 'https://reserva.test/x', share: 'https://wa.me/?text=hola' })]]))
    expect(legacy(w)).toEqual(expected)
    expect(optionBtns(w)).toHaveLength(0)
  })

  it('stored message from before this change', async () => {
    const config = cfg()
    localStorage.setItem(config.messagesKey, JSON.stringify([
      { id: 'u1', role: 'user', text: 'hola', createdAt: Date.now() - 2000 },
      { id: 'a1', role: 'assistant', text: 'Aquí', createdAt: Date.now() - 1000, actions: { web: 'https://reserva.test/x', share: 'https://wa.me/?text=hola' } },
    ]))
    vi.stubGlobal('fetch', vi.fn())
    const w = await render(createChatConversation(config))
    expect(legacy(w)).toEqual(expected)
  })
})

describe('SCEN-006 — bold renders without asterisks', () => {
  it('**¿Te ayudo a realizar la reserva?** → <strong>', async () => {
    const w = await render(await converse([[...text('**¿Te ayudo a realizar la reserva?**'), buttons({ opciones: OPCIONES })]]))
    const strong = w.find('.cc-text strong')
    expect(strong.exists()).toBe(true)
    expect(strong.text()).toBe('¿Te ayudo a realizar la reserva?')
    expect(w.find('.cc-text').text()).not.toContain('*')
  })
})

describe('SCEN-007 — malformed opciones never break the bubble', () => {
  it('streamed: keeps only non-empty strings; nothing valid and no links → no buttons', async () => {
    const w = await render(await converse([
      [...text('Uno'), buttons({ opciones: ['A', 3, '', null, '   ', 'B'] })],
      [...text('Dos'), buttons({ opciones: [1, ''] })],
    ]))
    expect(optionBtns(w).map((b) => b.text())).toEqual(['A', 'B'])
    expect(w.findAll('.cc-actions')).toHaveLength(1)
  })

  it('corrupt storage: renders the valid entries and does not throw', async () => {
    const config = cfg()
    localStorage.setItem(config.messagesKey, JSON.stringify([
      { id: 'u1', role: 'user', text: 'hola', createdAt: Date.now() - 2000 },
      { id: 'a1', role: 'assistant', text: 'x', createdAt: Date.now() - 1000, actions: { opciones: [{}, 'X', 7] } },
    ]))
    vi.stubGlobal('fetch', vi.fn())
    const w = await render(createChatConversation(config))
    expect(optionBtns(w).map((b) => b.text())).toEqual(['X'])
  })
})
