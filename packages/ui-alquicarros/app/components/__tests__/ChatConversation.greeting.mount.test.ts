// @vitest-environment jsdom
//
// SCEN-G1/G2/G3 (docs/specs/2026-10-06-chat-greeting-bubbles): an empty conversation greets
// with the teaser's two lines as assistant bubbles; the greeting is presentation only
// (never stored, never sent) and never shows over real messages. A REAL conversation
// instance over jsdom storage. SCEN-G4 (badge -> bubbles continuity) is runtime QA.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount, type VueWrapper } from '@vue/test-utils'
import {
  createChatConversation,
  type ChatConversation as ChatInstance,
  type ChatConversationConfig,
} from '@rentacar-main/logic/composables/useChatConversation'
import { TEASER_LINE_1, TEASER_LINE_2 } from '@rentacar-main/logic/utils/chatGreeting'
import ChatConversation from '../ChatConversation.vue'

const sse = (events: unknown[]) =>
  new TextEncoder().encode(events.map((e) => `data: ${JSON.stringify(e)}\n`).join(''))

type FetchInit = { body: string }

function replyFetch() {
  return vi.fn((_url: string, _init: FetchInit) => {
    const chunks = [
      { done: false, value: sse([{ type: 'text-start', id: 'r' }, { type: 'text-delta', id: 'r', delta: 'Listo.' }, { type: 'text-end', id: 'r' }]) },
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
function cfg(): ChatConversationConfig {
  const brand = `gr-ui-${brandSeq++}`
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  }
}

let wrapper: VueWrapper | null = null

async function render(instance: ChatInstance, variant: 'page' | 'panel' = 'page') {
  vi.stubGlobal('useChatConversation', () => instance)
  wrapper = mount(ChatConversation, { props: { variant, active: true }, attachTo: document.body })
  await wrapper.vm.$nextTick()
  return wrapper
}

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

describe('SCEN-G1 — an empty chat greets with the two teaser lines', () => {
  it.each(['page', 'panel'] as const)('%s variant: two assistant bubbles, verbatim, first with the group-start tail', async (variant) => {
    const w = await render(createChatConversation(cfg()), variant)
    const bubbles = w.findAll('.cc-msg.is-assistant[data-greeting]')
    expect(bubbles).toHaveLength(2)
    expect(bubbles[0]!.classes()).toContain('is-group-start')
    expect(bubbles[1]!.classes()).not.toContain('is-group-start')
    // Exact equality: `.cc-msg` is pre-wrap, so template indentation would show up here.
    expect(bubbles[0]!.element.textContent).toBe(TEASER_LINE_1)
    expect(bubbles[1]!.element.textContent).toBe(TEASER_LINE_2)
    expect(w.findAll('.cc-msg')).toHaveLength(2)
  })

  it('the old gray placeholder is gone', async () => {
    const w = await render(createChatConversation(cfg()))
    expect(w.find('.cc-empty').exists()).toBe(false)
    expect(w.text()).not.toContain('Pregúntame por ciudades')
  })
})

describe('SCEN-G2 — the greeting is presentation only', () => {
  it('after a real exchange the greeting is gone, storage holds only real messages and the payload carries no greeting', async () => {
    const config = cfg()
    const instance = createChatConversation(config)
    const fetchMock = replyFetch()
    vi.stubGlobal('fetch', fetchMock)
    const w = await render(instance)
    expect(w.findAll('[data-greeting]')).toHaveLength(2)

    instance.input.value = 'quiero cotizar'
    await instance.submit()
    await w.vm.$nextTick()

    expect(w.findAll('[data-greeting]')).toHaveLength(0)
    expect(w.findAll('.cc-msg').length).toBeGreaterThan(0)
    expect(w.text()).not.toContain(TEASER_LINE_1)
    expect(w.text()).not.toContain(TEASER_LINE_2)

    const stored = localStorage.getItem(config.messagesKey) ?? ''
    expect(JSON.parse(stored)).toHaveLength(2)
    for (const line of [TEASER_LINE_1, TEASER_LINE_2]) {
      expect(stored).not.toContain(line)
      expect(fetchMock.mock.calls[0]![1].body).not.toContain(line)
    }
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).messages).toHaveLength(1)
  })
})

describe('SCEN-G3 — existing conversations never greet', () => {
  it('seeded storage renders the real messages and no greeting bubble', async () => {
    const config = cfg()
    const now = Date.now()
    localStorage.setItem(config.messagesKey, JSON.stringify([
      { id: 'u1', role: 'user', text: 'hola', createdAt: now - 60_000 },
      { id: 'a1', role: 'assistant', text: '¿En qué ciudad recoges?', createdAt: now - 50_000 },
    ]))
    const instance = createChatConversation(config)
    expect(instance.messages.value).toHaveLength(2)
    const w = await render(instance)
    expect(w.findAll('[data-greeting]')).toHaveLength(0)
    expect(w.findAll('.cc-msg')).toHaveLength(2)
  })
})

// Aislamiento del chunk perezoso: el saludo importa el módulo mínimo
// chatGreeting, nunca useContactTeaser (analytics+storage del teaser) ni el
// barrel de utils. payload-bundle-contract cubre a ChatWidget; esto cubre a
// ChatConversation.
describe('chunk isolation — the greeting never drags the teaser module', () => {
  it('imports chatGreeting directly, not useContactTeaser or the utils barrel for the lines', () => {
    const src = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../ChatConversation.vue'), 'utf8')
    expect(src).toContain("from '@rentacar-main/logic/utils/chatGreeting'")
    expect(src).not.toContain('useContactTeaser')
  })
})
