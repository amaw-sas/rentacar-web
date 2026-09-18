// @vitest-environment jsdom
//
// SCEN-R6/R7/R8 (docs/specs/2026-09-17-chat-reply-ttl-clear): holding the header title
// area for 2 s clears the conversation and the draft; shorter, moved, left or cancelled
// presses do nothing; the hit area is invisible to assistive tech. A REAL conversation
// instance over seeded localStorage, pointer events and fake timers. The real long
// press on iOS/Android is runtime QA.

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

const sse = (events: unknown[]) =>
  new TextEncoder().encode(events.map((e) => `data: ${JSON.stringify(e)}\n`).join(''))

type FetchInit = { body: string; signal?: AbortSignal }

// Answers every turn at once with a short text reply.
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

// Streams one delta, then hangs until the request is aborted (rejects like a real fetch body).
function heldFetch() {
  let blocked = false
  const fn = vi.fn((_url: string, init: FetchInit) => {
    const chunks: Array<() => Promise<{ done: boolean; value?: Uint8Array }>> = [
      () => Promise.resolve({ done: false, value: sse([{ type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Te cuento' }]) }),
      () => new Promise((_resolve, reject) => {
        blocked = true
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }),
    ]
    return Promise.resolve({
      ok: true,
      headers: { get: (h: string) => (h === 'x-conversation-id' ? 'conv-1' : null) },
      body: { getReader: () => ({ read: () => (chunks.shift() ?? (() => Promise.resolve({ done: true })))() }) },
    })
  })
  return { fn, blocked: () => blocked }
}

let brandSeq = 0
function cfg(): ChatConversationConfig {
  const brand = `cg-ui-${brandSeq++}`
  return {
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  }
}

// A stored conversation with a conversationId and a read-marker, as a returning customer has.
function seeded(config: ChatConversationConfig): ChatInstance {
  const now = Date.now()
  localStorage.setItem(config.messagesKey, JSON.stringify([
    { id: 'u1', role: 'user', text: 'hola', createdAt: now - 60_000 },
    { id: 'a1', role: 'assistant', text: '¿En qué ciudad recoges?', createdAt: now - 50_000 },
  ]))
  localStorage.setItem(config.conversationKey, 'conv-1')
  localStorage.setItem(config.lastReadKey, 'a1')
  const instance = createChatConversation(config)
  expect(instance.messages.value).toHaveLength(2)
  expect(instance.conversationId.value).toBe('conv-1')
  return instance
}

let wrapper: VueWrapper | null = null
let consoleError: ReturnType<typeof vi.spyOn>

async function render(instance: ChatInstance) {
  vi.stubGlobal('useChatConversation', () => instance)
  wrapper = mount(ChatConversation, { props: { variant: 'page', active: true }, attachTo: document.body })
  await wrapper.vm.$nextTick()
  return wrapper
}

const hitArea = (w: VueWrapper) => w.find('.cc-titlewrap .cc-clear-hit')

function pointer(el: Element, type: string, clientX = 20, clientY = 20, button = 0) {
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX, clientY, pointerId: 1, button }))
}

// The observable "conversation is gone" contract of SCEN-R6.
function expectCleared(config: ChatConversationConfig, instance: ChatInstance, w: VueWrapper) {
  expect(instance.messages.value).toEqual([])
  expect(instance.conversationId.value).toBeNull()
  expect(instance.input.value).toBe('')
  expect((w.find('.cc-input input').element as HTMLInputElement).value).toBe('')
  expect(w.findAll('.cc-msg')).toHaveLength(0)
  expect(localStorage.getItem(config.conversationKey)).toBeNull()
  expect(localStorage.getItem(config.lastReadKey)).toBeNull()
  expect([null, '[]']).toContain(localStorage.getItem(config.messagesKey))
}

// Reload restores nothing, and the next message goes out without a conversationId.
async function expectFreshStart(config: ChatConversationConfig) {
  const reloaded = createChatConversation(config)
  expect(reloaded.messages.value).toEqual([])
  expect(reloaded.conversationId.value).toBeNull()

  const fetchMock = replyFetch()
  vi.stubGlobal('fetch', fetchMock)
  reloaded.input.value = 'quiero cotizar'
  await reloaded.submit()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
  expect(body).not.toHaveProperty('conversationId')
  expect(body.messages).toHaveLength(1)
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}
  if (typeof globalThis.CSS === 'undefined') vi.stubGlobal('CSS', { escape: (s: string) => s })
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('SCEN-R6 — holding the title area for 2 s clears the conversation', () => {
  it('idle chat with a draft: messages, draft, conversationId and read-marker are gone; reload restores nothing; next send has no conversationId', async () => {
    const config = cfg()
    const instance = seeded(config)
    const w = await render(instance)
    await w.find('.cc-input input').setValue('borrador')
    instance.announce.value = '1 mensaje nuevo en el chat'
    expect(w.findAll('.cc-msg')).toHaveLength(2)

    pointer(hitArea(w).element, 'pointerdown')
    vi.advanceTimersByTime(2000)
    await w.vm.$nextTick()

    expectCleared(config, instance, w)
    expect(instance.announce.value).toBe('')
    pointer(hitArea(w).element, 'pointerup')
    await expectFreshStart(config)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('a second pointerdown mid-hold restarts the 2 s count', async () => {
    const config = cfg()
    const instance = seeded(config)
    const w = await render(instance)
    const el = hitArea(w).element

    pointer(el, 'pointerdown')
    vi.advanceTimersByTime(1500)
    pointer(el, 'pointerdown')
    vi.advanceTimersByTime(1500)
    await w.vm.$nextTick()
    expect(instance.messages.value).toHaveLength(2)

    vi.advanceTimersByTime(500)
    await w.vm.$nextTick()
    expectCleared(config, instance, w)
  })

  it('a hold that wobbles within 10 px still clears', async () => {
    const config = cfg()
    const instance = seeded(config)
    const w = await render(instance)

    pointer(hitArea(w).element, 'pointerdown', 20, 20)
    vi.advanceTimersByTime(800)
    pointer(hitArea(w).element, 'pointermove', 26, 27)
    vi.advanceTimersByTime(1200)
    await w.vm.$nextTick()
    expectCleared(config, instance, w)
  })

  it('while a reply is streaming: the stream stops and nothing of the conversation survives', async () => {
    const config = cfg()
    const instance = seeded(config)
    const held = heldFetch()
    vi.stubGlobal('fetch', held.fn)
    const abort = vi.spyOn(AbortController.prototype, 'abort')
    const w = await render(instance)

    instance.input.value = 'cotiza bogotá'
    const turn = instance.submit()
    await vi.waitFor(() => {
      expect(instance.status.value).toBe('streaming')
      expect(held.blocked()).toBe(true)
    })
    await w.find('.cc-input input').setValue('borrador')

    pointer(hitArea(w).element, 'pointerdown')
    vi.advanceTimersByTime(2000)
    await w.vm.$nextTick()
    expect(abort).toHaveBeenCalledTimes(1)
    expect(instance.isStreaming.value).toBe(false)
    expectCleared(config, instance, w)

    // The aborted turn settles afterwards (its persist() may write `[]`): still cleared.
    await turn
    await w.vm.$nextTick()
    expectCleared(config, instance, w)
    expect(w.find('.cc-error').exists()).toBe(false)
    await expectFreshStart(config)
  })
})

describe('SCEN-R7 — short, moved or interrupted presses do nothing', () => {
  const interruptions: Array<[string, (el: Element) => void]> = [
    ['a tap', (el) => { pointer(el, 'pointerdown'); vi.advanceTimersByTime(120); pointer(el, 'pointerup') }],
    ['a 1.9 s hold released', (el) => { pointer(el, 'pointerdown'); vi.advanceTimersByTime(1900); pointer(el, 'pointerup') }],
    ['moving more than 10 px', (el) => { pointer(el, 'pointerdown', 20, 20); vi.advanceTimersByTime(500); pointer(el, 'pointermove', 31, 20) }],
    ['the pointer leaving', (el) => { pointer(el, 'pointerdown'); vi.advanceTimersByTime(500); pointer(el, 'pointerleave') }],
    ['a pointercancel', (el) => { pointer(el, 'pointerdown'); vi.advanceTimersByTime(500); pointer(el, 'pointercancel') }],
    ['a 2 s hold with the right mouse button', (el) => { pointer(el, 'pointerdown', 20, 20, 2); vi.advanceTimersByTime(2000) }],
  ]

  it.each(interruptions)('%s keeps the messages, draft and storage', async (_label, act) => {
    const config = cfg()
    const instance = seeded(config)
    const w = await render(instance)
    await w.find('.cc-input input').setValue('borrador')

    act(hitArea(w).element)
    vi.advanceTimersByTime(5000)
    await w.vm.$nextTick()

    expect(instance.messages.value).toHaveLength(2)
    expect(w.findAll('.cc-msg')).toHaveLength(2)
    expect(instance.input.value).toBe('borrador')
    expect(instance.conversationId.value).toBe('conv-1')
    expect(localStorage.getItem(config.conversationKey)).toBe('conv-1')
    expect(localStorage.getItem(config.lastReadKey)).toBe('a1')
  })

  it('a hold in progress when the surface unmounts never fires', async () => {
    const config = cfg()
    const instance = seeded(config)
    const w = await render(instance)
    pointer(hitArea(w).element, 'pointerdown')
    vi.advanceTimersByTime(1000)
    w.unmount()
    wrapper = null
    vi.advanceTimersByTime(5000)
    expect(instance.messages.value).toHaveLength(2)
    expect(localStorage.getItem(config.conversationKey)).toBe('conv-1')
  })

  it('the close button still closes with a single tap', async () => {
    const instance = seeded(cfg())
    const w = await render(instance)
    await w.find('.cc-dismiss').trigger('click')
    expect(w.emitted('dismiss')).toHaveLength(1)
    expect(instance.messages.value).toHaveLength(2)
  })
})

describe('SCEN-R8 — the hidden control is invisible', () => {
  it('is aria-hidden, not focusable, and a long press opens no context menu', async () => {
    const instance = seeded(cfg())
    const w = await render(instance)
    const hit = hitArea(w)
    expect(hit.exists()).toBe(true)
    expect(hit.attributes('aria-hidden')).toBe('true')
    expect(hit.attributes('tabindex')).toBeUndefined()
    expect(hit.attributes('role')).toBeUndefined()
    expect(hit.text()).toBe('')
    ;(hit.element as HTMLElement).focus()
    expect(document.activeElement).not.toBe(hit.element)

    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    hit.element.dispatchEvent(menu)
    expect(menu.defaultPrevented).toBe(true)
  })

  it('covers the title block and blocks selection, callout and browser touch gestures', () => {
    // jsdom has no layout: the CSS contract is pinned at source level.
    const source = readFileSync(join(__dirname, '..', 'ChatConversation.vue'), 'utf8')
    const wrap = source.match(/\.cc-titlewrap \{([^}]*)\}/)?.[1] ?? ''
    // The title text sits under the hit area: iOS must not select it or open its callout either.
    for (const decl of ['position: relative;', 'user-select: none;', '-webkit-user-select: none;', '-webkit-touch-callout: none;']) {
      expect(wrap).toContain(decl)
    }
    const rule = source.match(/\.cc-clear-hit \{([^}]*)\}/)?.[1] ?? ''
    for (const decl of ['position: absolute;', 'inset: 0;', 'touch-action: none;', 'user-select: none;', '-webkit-user-select: none;', '-webkit-touch-callout: none;']) {
      expect(rule).toContain(decl)
    }
  })
})
