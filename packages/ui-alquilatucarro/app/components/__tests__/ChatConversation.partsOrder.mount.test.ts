// @vitest-environment jsdom
//
// chat-parts-order.scenarios.md (docs/specs/2026-09-13-chat-parts-order) at the
// DOM level: a REAL conversation instance is driven by a stubbed SSE `fetch`, then
// the component renders its messages. The source-string guards pin markup; this
// suite pins what the customer sees — which bubbles exist and, inside each one,
// the order of text, quote table, gama cards, sede cards and buttons.
//
// Legacy scenarios (E1, E6, E10) also pin today's bubble classes and time row, so
// the "without the marker nothing changes" promise is checked against the DOM.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import {
  createChatConversation,
  type ChatConversation as ChatInstance,
  type ChatConversationConfig,
} from '@rentacar-main/logic/composables/useChatConversation'
import ChatConversation from '../ChatConversation.vue'

// ─────────────────────────────────────────────────────────────────────────
// Harness
// ─────────────────────────────────────────────────────────────────────────

const MARKER = { type: 'data-partsOrder', data: { v: 2 } }
const text = (s: string) => [
  { type: 'text-start', id: s },
  { type: 'text-delta', id: s, delta: s },
  { type: 'text-end', id: s },
]
const QUOTE = {
  sede: 'AABOT',
  dias: 3,
  filas: [
    { categoria: 'C', descripcion: 'Económico Mecánico', precioTotal: 350000, horasExtra: 0, precioHoraExtra: 0 },
    { categoria: 'F', descripcion: 'Sedán Mecánico', precioTotal: 420000, horasExtra: 0, precioHoraExtra: 0 },
  ],
}
const CARDS = {
  gama: 'F',
  descripcion: 'Sedán mecánico',
  modelos: [
    { nombre: 'Chevrolet Onix', imagen: 'https://img.test/onix.webp' },
    { nombre: 'Kia Soluto', imagen: '' },
  ],
}
const SEDES = {
  sedes: [
    { code: 'AABOT', nombre: 'Bogotá Aeropuerto', horario: 'Lun-Dom 6am-10pm' },
    { code: 'ABCTR', nombre: 'Bogotá Centro', horario: 'Lun-Sáb 8am-6pm' },
  ],
}
const data = (type: string, payload: unknown) => ({ type: `data-${type}`, data: payload })
// Quote contract for a sede card (chat-sede-reply.scenarios.md), identical in the 3 brands.
const sedeQuote = (nombre: string, targetId: string) => ({
  label: `Sede ${nombre}`,
  context: `[El cliente responde sobre la sede ${nombre}.]`,
  author: 'Asesora',
  preview: `Sede ${nombre}`,
  targetId,
})

// fetch that answers every turn with the next queued SSE body, delivered whole.
function sseFetch(turns: unknown[][]) {
  const encoder = new TextEncoder()
  const queue = [...turns]
  return vi.fn(() => {
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
function cfg(brand = `po-ui-${brandSeq++}`): ChatConversationConfig {
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  }
}

async function converse(turns: unknown[][], config = cfg()): Promise<ChatInstance> {
  vi.stubGlobal('fetch', sseFetch(turns))
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

// Normalized view of one assistant bubble: its data-bearing children in DOM order.
type Child =
  | { kind: 'text'; text: string }
  | { kind: 'quote' | 'cards' | 'actions' }
  | { kind: 'sedes'; sedes: Array<{ name: string; schedule: string }> }
const KINDS: Array<[string, Child['kind']]> = [
  ['cc-text', 'text'],
  ['cc-quote', 'quote'],
  ['cc-cards', 'cards'],
  ['cc-sedes', 'sedes'],
  ['cc-actions', 'actions'],
]

function assistantBubbles(w: VueWrapper): HTMLElement[] {
  return Array.from(w.element.querySelectorAll<HTMLElement>('.cc-msg.is-assistant')).filter(
    (el) => !el.querySelector('.cc-typing-text'),
  )
}

function structure(el: HTMLElement): Child[] {
  const out: Child[] = []
  for (const child of Array.from(el.children)) {
    const hit = KINDS.find(([cls]) => child.classList.contains(cls))
    if (!hit) continue
    const kind = hit[1]
    if (kind === 'text') out.push({ kind, text: (child.textContent ?? '').trim() })
    else if (kind === 'sedes') {
      out.push({
        kind,
        sedes: Array.from(child.querySelectorAll('.cc-sede')).map((s) => ({
          name: (s.querySelector('.cc-sede-name')?.textContent ?? '').trim(),
          schedule: (s.querySelector('.cc-sede-horario')?.textContent ?? '').trim(),
        })),
      })
    } else out.push({ kind })
  }
  return out
}

// Today's bubble chrome: classes (minus the new has-cards / flash) + time row.
function chrome(el: HTMLElement) {
  return {
    classes: Array.from(el.classList).filter((c) => c !== 'has-cards' && c !== 'cc-flash').sort(),
    time: !!el.querySelector(':scope > .cc-time'),
  }
}

const T = (s: string): Child => ({ kind: 'text', text: s })
const QUOTE_C: Child = { kind: 'quote' }
const CARDS_C: Child = { kind: 'cards' }
const ACTIONS_C: Child = { kind: 'actions' }
const BASE = ['cc-msg', 'has-time', 'is-assistant']

let consoleError: ReturnType<typeof vi.spyOn>
let consoleWarn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  localStorage.clear()
  // jsdom lacks these; the component calls them on mount / quote jump.
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}
  if (typeof globalThis.CSS === 'undefined') vi.stubGlobal('CSS', { escape: (s: string) => s })
  consoleError = vi.spyOn(console, 'error')
  consoleWarn = vi.spyOn(console, 'warn')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────
// Legacy (no data-partsOrder): identical to today
// ─────────────────────────────────────────────────────────────────────────

describe('SCEN-E1 — today\'s format without marker renders like today', () => {
  it('3 bubbles A, B, C with table → cards → buttons at the end of the third', async () => {
    const instance = await converse([[
      ...text('A'), ...text('B'), ...text('C'),
      data('quoteTable', QUOTE), data('gamaCards', CARDS), data('buttons', { web: 'https://web.test', whatsapp: 'https://wa.test' }),
    ]])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([
      [T('A')],
      [T('B')],
      [T('C'), QUOTE_C, CARDS_C, ACTIONS_C],
    ])
    expect(bubbles.map(chrome)).toEqual([
      { classes: [...BASE, 'is-group-start'].sort(), time: true },
      { classes: BASE, time: true },
      { classes: [...BASE, 'has-parts'].sort(), time: true },
    ])
    expect(w.find('.cc-quote-note').text()).toBe('Total con IVA, tasas, seguro básico y km ilimitado.')
    expect(consoleError).not.toHaveBeenCalled()
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  it('the bubble with gama cards carries has-cards', async () => {
    const instance = await converse([[...text('A'), data('gamaCards', CARDS)]])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles).toHaveLength(1)
    expect(bubbles[0]!.classList.contains('has-cards')).toBe(true)
  })
})

describe('SCEN-E6 — transcripts saved before the change load identically', () => {
  it('stored shape (A\\n---\\nB + table, cards, actions) → 2 bubbles, data at the end of the second, no errors', async () => {
    const config = cfg()
    const now = Date.now()
    const stored = [
      { id: 'u1', role: 'user', text: 'hola', createdAt: now - 2000 },
      {
        id: 'a1',
        role: 'assistant',
        text: 'A\n---\nB',
        createdAt: now - 1000,
        quoteTable: QUOTE,
        gamaCards: CARDS,
        actions: { web: 'https://web.test', whatsapp: 'https://wa.test' },
      },
    ]
    localStorage.setItem(config.messagesKey, JSON.stringify(stored))
    const instance = createChatConversation(config)
    expect(JSON.parse(JSON.stringify(instance.messages.value))).toEqual(stored)

    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([
      [T('A')],
      [T('B'), QUOTE_C, CARDS_C, ACTIONS_C],
    ])
    expect(bubbles.map(chrome)).toEqual([
      { classes: [...BASE, 'is-group-start'].sort(), time: true },
      { classes: [...BASE, 'has-parts'].sort(), time: true },
    ])
    expect(consoleError).not.toHaveBeenCalled()
    expect(consoleWarn).not.toHaveBeenCalled()
  })
})

describe('SCEN-E10 — production interleaving without marker renders like today', () => {
  it('text → table → text → text = 3 bubbles, table at the end of the third; buttons → text = button below the text', async () => {
    const instance = await converse([
      [...text('Ida y vuelta.'), data('quoteTable', QUOTE), ...text('La más elegida es la C.'), ...text('¿Cuál reservamos?')],
      [data('buttons', { web: 'https://web.test' }), ...text('Te dejo el enlace para reservar tú mismo abajo.')],
    ])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([
      [T('Ida y vuelta.')],
      [T('La más elegida es la C.')],
      [T('¿Cuál reservamos?'), QUOTE_C],
      [T('Te dejo el enlace para reservar tú mismo abajo.'), ACTIONS_C],
    ])
    expect(bubbles.map(chrome)).toEqual([
      { classes: [...BASE, 'is-group-start'].sort(), time: true },
      { classes: BASE, time: true },
      { classes: [...BASE, 'has-parts'].sort(), time: true },
      { classes: [...BASE, 'has-parts', 'is-group-start'].sort(), time: true },
    ])
    expect(consoleError).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// v2 (data-partsOrder {v:2}): pieces in arrival order
// ─────────────────────────────────────────────────────────────────────────

describe('SCEN-E2 — v2 text → table → text is one bubble in order', () => {
  it('renders [text, table, text] in one bubble; ending in text drops has-parts', async () => {
    const instance = await converse([[MARKER, ...text('Te cotizo:'), data('quoteTable', QUOTE), ...text('¿Cuál te gusta?')]])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([[T('Te cotizo:'), QUOTE_C, T('¿Cuál te gusta?')]])
    expect(bubbles[0]!.classList.contains('has-parts')).toBe(false)
    expect(bubbles[0]!.querySelector(':scope > .cc-time')).not.toBeNull()
    expect(w.find('.cc-quote-note').text()).toBe('Total con IVA, tasas, seguro básico y km ilimitado.')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('a v2 bubble that ends in a data piece keeps has-parts', async () => {
    const instance = await converse([[MARKER, ...text('Te cotizo:'), data('quoteTable', QUOTE)]])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([[T('Te cotizo:'), QUOTE_C]])
    expect(bubbles[0]!.classList.contains('has-parts')).toBe(true)
  })
})

describe('SCEN-E3 — v2 text → cards → text → buttons → text is one bubble in order', () => {
  it('renders the five pieces in order and tapping a card still quotes it', async () => {
    const instance = await converse([[
      MARKER, ...text('Modelos:'), data('gamaCards', CARDS), ...text('Reserva aquí:'),
      data('buttons', { web: 'https://web.test' }), ...text('¿Algo más?'),
    ]])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([[T('Modelos:'), CARDS_C, T('Reserva aquí:'), ACTIONS_C, T('¿Algo más?')]])
    expect(bubbles[0]!.classList.contains('has-cards')).toBe(true)

    const assistantId = instance.messages.value.at(-1)!.id
    await w.findAll('.cc-card')[0]!.trigger('click')
    expect(instance.replyTo.value).toEqual({
      label: 'Chevrolet Onix · Gama F',
      context: '[El cliente responde sobre el modelo Chevrolet Onix de la Gama F.]',
      author: 'Asesora',
      preview: 'Chevrolet Onix · Gama F',
      image: 'https://img.test/onix.webp',
      targetId: assistantId,
    })
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('SCEN-E4 — v2 sede cards render in place', () => {
  // The original "tapping a sede card does nothing" clause is superseded by the owner
  // decision in chat-sede-reply.scenarios.md (SCEN-E11): tapping now quotes the sede.
  it('renders [text, 2 sede cards, text]; name emphasized, schedule below; tapping quotes the sede', async () => {
    const instance = await converse([[MARKER, ...text('Sedes en Bogotá:'), data('sedeCards', SEDES), ...text('¿Cuál te queda mejor?')]])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([[
      T('Sedes en Bogotá:'),
      {
        kind: 'sedes',
        sedes: [
          { name: 'Bogotá Aeropuerto', schedule: 'Lun-Dom 6am-10pm' },
          { name: 'Bogotá Centro', schedule: 'Lun-Sáb 8am-6pm' },
        ],
      },
      T('¿Cuál te queda mejor?'),
    ]])

    const cards = w.findAll('.cc-sede')
    expect(cards).toHaveLength(2)
    for (const card of cards) {
      const name = card.element.querySelector('.cc-sede-name')!
      expect(name.tagName).toBe('STRONG')
      expect(name.nextElementSibling?.classList.contains('cc-sede-horario')).toBe(true)
    }
    await cards[0]!.trigger('click')
    expect(instance.replyTo.value).toEqual(sedeQuote('Bogotá Aeropuerto', instance.messages.value.at(-1)!.id))
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('SCEN-E5 — consecutive text blocks still split bubbles', () => {
  it.each([
    ['without marker', [] as unknown[]],
    ['with v2', [MARKER]],
  ])('%s → 2 bubbles "Hola" and "¿Ciudad?"', async (_label, prefix) => {
    const instance = await converse([[...prefix, ...text('Hola'), ...text('¿Ciudad?')]])
    const w = await render(instance)
    expect(assistantBubbles(w).map(structure)).toEqual([[T('Hola')], [T('¿Ciudad?')]])
  })
})

describe('SCEN-E7 — v2 order survives reload', () => {
  it('a new instance over the same storage renders the same single bubble', async () => {
    const config = cfg()
    const first = await converse([[MARKER, ...text('Te cotizo:'), data('quoteTable', QUOTE), ...text('¿Cuál te gusta?')]], config)
    const w1 = await render(first)
    const before = assistantBubbles(w1).map(structure)
    w1.unmount()
    wrapper = null

    const reloaded = createChatConversation(config)
    const w2 = await render(reloaded)
    const after = assistantBubbles(w2).map(structure)
    expect(after).toEqual([[T('Te cotizo:'), QUOTE_C, T('¿Cuál te gusta?')]])
    expect(after).toEqual(before)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('SCEN-E8 — empty sede cards and unknown data pieces render nothing', () => {
  it('v2: rejected sede cards between texts render nothing and open no bubble', async () => {
    const instance = await converse([[
      MARKER, ...text('Antes.'),
      data('sedeCards', {}), data('sedeCards', { sedes: [] }),
      ...text('Después.'),
    ]])
    const w = await render(instance)
    expect(w.find('.cc-sedes').exists()).toBe(false)
    expect(assistantBubbles(w).map(structure)).toEqual([[T('Antes.'), T('Después.')]])
    expect(consoleError).not.toHaveBeenCalled()
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  it('v2: an unknown data piece stays ignored — text → unknown → text = 2 bubbles', async () => {
    const instance = await converse([[
      MARKER, ...text('Antes.'), data('somethingUnknown', { x: 1 }), ...text('Después.'),
    ]])
    const w = await render(instance)
    expect(assistantBubbles(w).map(structure)).toEqual([[T('Antes.')], [T('Después.')]])
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('v2 repeated data pieces render each one in place', () => {
  it('text → gamaCards C → text → gamaCards F = 1 bubble with both card sets in order', async () => {
    const cardsC = { gama: 'C', descripcion: 'Económico', modelos: [{ nombre: 'Kia Picanto', imagen: '' }] }
    const cardsF = { gama: 'F', descripcion: 'Sedán mecánico', modelos: [{ nombre: 'Chevrolet Onix', imagen: '' }] }
    const instance = await converse([[
      MARKER, ...text('Gama C:'), data('gamaCards', cardsC), ...text('Y la Gama F:'), data('gamaCards', cardsF),
    ]])
    const w = await render(instance)
    const bubbles = assistantBubbles(w)
    expect(bubbles.map(structure)).toEqual([[T('Gama C:'), CARDS_C, T('Y la Gama F:'), CARDS_C]])
    const titles = Array.from(bubbles[0]!.querySelectorAll(':scope > .cc-cards > .cc-cards-title')).map((t) =>
      (t.textContent ?? '').replace(/\s+/g, ' ').trim(),
    )
    expect(titles).toEqual(['Modelos de la Gama C · Económico', 'Modelos de la Gama F · Sedán mecánico'])
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Card sizing (CSS, invisible to jsdom — pinned at source level)
// ─────────────────────────────────────────────────────────────────────────

describe('SCEN-E9 — gama photo sizing guards', () => {
  // jsdom replaces the global URL, so resolve by path instead of import.meta.url.
  const source = readFileSync(join(__dirname, '..', 'ChatConversation.vue'), 'utf8')

  it('reserves a 3:2 box before the lazy photo loads, then uses its own ratio (no crop)', () => {
    expect(source).toMatch(/\.cc-card-img \{ width: 100%; height: auto; aspect-ratio: auto 3 \/ 2; object-fit: contain; \}/)
  })

  it('caps the card bubble outside phone widths while still filling it', () => {
    expect(source).toMatch(/\.cc-msg\.has-cards \{ width: 85%; max-width: min\(85%, 26rem\); \}/)
  })
})

describe('Two text blocks in one v2 bubble are spaced, not glued', () => {
  const source = readFileSync(join(__dirname, '..', 'ChatConversation.vue'), 'utf8')

  it('separates adjacent .cc-text blocks like text after a data piece', () => {
    expect(source).toMatch(/\.cc-text \+ \.cc-text \{ margin-top: 0\.5rem; \}/)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Reopen with unread replies: a late gama photo must not yank the list away
// from the "Mensajes nuevos" separator. jsdom has no layout, so the list's
// scroll geometry is defined by hand.
// ─────────────────────────────────────────────────────────────────────────

describe('Reopen keeps the "Mensajes nuevos" separator when a photo loads late', () => {
  const list = { top: 0, height: 2000, client: 500 }
  const GEOMETRY = ['scrollHeight', 'clientHeight', 'scrollTop'] as const
  const isList = (el: Element) => el.classList.contains('cc-messages')

  beforeEach(() => {
    Object.assign(list, { top: 0, height: 2000, client: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() { return isList(this) ? list.height : 0 },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() { return isList(this) ? list.client : 0 },
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get() { return isList(this) ? list.top : 0 },
      set(v: number) { if (isList(this)) list.top = v },
    })
  })

  afterEach(() => {
    for (const p of GEOMETRY) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[p]
  })

  // Stored transcript whose reply has a photo card; `lastRead` decides whether it is unread.
  function reopen(lastRead: string) {
    const config = cfg()
    const now = Date.now()
    localStorage.setItem(config.messagesKey, JSON.stringify([
      { id: 'u1', role: 'user', text: 'modelos', createdAt: now - 2000 },
      { id: 'a1', role: 'assistant', text: 'Mira:', createdAt: now - 1000, gamaCards: CARDS },
    ]))
    localStorage.setItem(config.lastReadKey, lastRead)
    return createChatConversation(config)
  }

  it('unread reply positioned away from the bottom → photo load does not jump to the bottom', async () => {
    const w = await render(reopen('u1'))
    await new Promise((r) => setTimeout(r))
    expect(w.find('.cc-new-sep').exists()).toBe(true)
    // scrollIntoView (a no-op here) left the list where the separator is: no scroll event fired.
    expect(list.top).toBe(0)

    list.height = 2600
    await w.find('.cc-card-img').trigger('load')
    expect(list.top).toBe(0)
  })

  it('no unread replies → the list sits at the bottom and a late photo keeps it there', async () => {
    const w = await render(reopen('a1'))
    await new Promise((r) => setTimeout(r))
    expect(w.find('.cc-new-sep').exists()).toBe(false)
    expect(list.top).toBe(2000)

    list.height = 2600
    await w.find('.cc-card-img').trigger('load')
    expect(list.top).toBe(2600)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// chat-sede-reply.scenarios.md: sede cards are replyable like gama model cards
// ─────────────────────────────────────────────────────────────────────────

const CALI_TURN = [
  MARKER, ...text('Sedes en Cali:'),
  data('sedeCards', { sedes: [{ code: 'ACCLO', nombre: 'Cali Aeropuerto', horario: 'Lun-Dom 6am-10pm' }] }),
]

// jsdom's TouchEvent rejects plain `touches`; the swipe handlers only read clientX/Y.
function touch(el: Element, type: 'touchstart' | 'touchmove' | 'touchend', clientX: number) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  const points = [{ clientX, clientY: 0 }]
  Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : points })
  Object.defineProperty(e, 'changedTouches', { value: points })
  el.dispatchEvent(e)
}

describe('SCEN-E11 — tapping a sede card quotes it and the sent message carries the context', () => {
  it('composer shows the quote, the request text is exact and the sent bubble shows it', async () => {
    const fetchMock = sseFetch([CALI_TURN, text('Perfecto, Cali Aeropuerto.')])
    vi.stubGlobal('fetch', fetchMock)
    const instance = createChatConversation(cfg())
    instance.input.value = 'sedes en cali'
    await instance.submit()
    const assistantId = instance.messages.value.at(-1)!.id

    const w = await render(instance)
    const card = w.find('.cc-sede')
    expect(card.attributes('role')).toBe('button')
    expect(card.attributes('aria-label')).toBe('Responder sobre la sede Cali Aeropuerto')
    await card.trigger('click')

    // Before sending: the reply card above the composer.
    expect(instance.replyTo.value).toEqual(sedeQuote('Cali Aeropuerto', assistantId))
    const bar = w.find('.cc-reply-bar')
    expect(bar.exists()).toBe(true)
    expect(bar.find('.cc-reply-author').text()).toBe('Asesora')
    expect(bar.find('.cc-reply-preview').text()).toBe('Sede Cali Aeropuerto')

    await w.find('.cc-input input').setValue('esta')
    await w.find('form.cc-input').trigger('submit')
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(instance.isStreaming.value).toBe(false)
    })
    await w.vm.$nextTick()

    const request = (fetchMock.mock.calls as unknown as Array<[string, { body: string }]>)[1]![1]
    const sent = JSON.parse(request.body).messages.at(-1)
    expect(sent.role).toBe('user')
    expect(sent.parts[0].text).toBe('[El cliente responde sobre la sede Cali Aeropuerto.]\nesta')

    const userBubbles = w.findAll('.cc-msg.is-user')
    expect(userBubbles.at(-1)!.find('.cc-reply-preview').text()).toBe('Sede Cali Aeropuerto')
    expect(instance.messages.value.at(-2)!.replyTo).toEqual(sedeQuote('Cali Aeropuerto', assistantId))
    expect(w.find('.cc-reply-bar').exists()).toBe(false)
    expect(consoleError).not.toHaveBeenCalled()
  })
})

describe('SCEN-E11b — swiping a sede card and keyboard activation quote it the same way', () => {
  it('Enter on the focused card and a right swipe past the threshold each produce the SCEN-E11 quote', async () => {
    const instance = await converse([CALI_TURN])
    const assistantId = instance.messages.value.at(-1)!.id
    const w = await render(instance)
    const card = w.find('.cc-sede')
    expect(card.attributes('tabindex')).toBe('0')

    await card.trigger('keydown', { key: 'Enter' })
    expect(instance.replyTo.value).toEqual(sedeQuote('Cali Aeropuerto', assistantId))
    await w.vm.$nextTick()
    expect(w.find('.cc-reply-bar .cc-reply-preview').text()).toBe('Sede Cali Aeropuerto')

    instance.replyTo.value = null
    touch(card.element, 'touchstart', 0)
    touch(card.element, 'touchmove', 60)
    touch(card.element, 'touchend', 60)
    expect(instance.replyTo.value).toEqual(sedeQuote('Cali Aeropuerto', assistantId))
    expect(consoleError).not.toHaveBeenCalled()
  })
})
