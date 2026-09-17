// @vitest-environment jsdom
//
// SCEN-R3 (docs/specs/2026-09-17-chat-reply-ttl-clear): typing while the bot answers
// keeps the draft and does not send. A REAL conversation instance streams from a
// stubbed fetch whose body stays open until the test releases it, so the component
// is observed mid-stream. jsdom has no implicit Enter submission: pressing Enter is
// modelled as the form's `submit` event (real Enter is runtime QA).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import {
  createChatConversation,
  type ChatConversation as ChatInstance,
} from '@rentacar-main/logic/composables/useChatConversation'
import ChatConversation from '../ChatConversation.vue'

const sse = (events: unknown[]) =>
  new TextEncoder().encode(events.map((e) => `data: ${JSON.stringify(e)}\n`).join(''))
const text = (id: string, s: string) => [
  { type: 'text-start', id },
  { type: 'text-delta', id, delta: s },
  { type: 'text-end', id },
]

// First call streams one delta and then hangs until `release()`; later calls answer at once.
// `blocked()` turns true once the engine is waiting on the held chunk (text only reaches
// the bubble when the turn flushes, so the transcript cannot signal "mid-stream").
function heldFetch() {
  let release!: () => void
  const gate = new Promise<void>((r) => { release = r })
  let calls = 0
  let blocked = false
  const fn = vi.fn(() => {
    const first = calls++ === 0
    const chunks: Array<() => Promise<{ done: boolean; value?: Uint8Array }>> = first
      ? [
          () => Promise.resolve({ done: false, value: sse([{ type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'Te cuento' }]) }),
          () => {
            blocked = true
            return gate.then(() => ({ done: false, value: sse([{ type: 'text-delta', id: 't', delta: ' todo.' }, { type: 'text-end', id: 't' }]) }))
          },
          () => Promise.resolve({ done: true }),
        ]
      : [
          () => Promise.resolve({ done: false, value: sse(text('r', 'Claro.')) }),
          () => Promise.resolve({ done: true }),
        ]
    return Promise.resolve({
      ok: true,
      headers: { get: () => null },
      body: { getReader: () => ({ read: () => (chunks.shift() ?? (() => Promise.resolve({ done: true })))() }) },
    })
  })
  return { fn, release: () => release(), blocked: () => blocked }
}

let brandSeq = 0
function newInstance(): ChatInstance {
  const brand = `sd-ui-${brandSeq++}`
  return createChatConversation({
    brand,
    api: 'http://api.test/api/chat',
    messagesKey: `rentacar-chat:${brand}:messages`,
    conversationKey: `rentacar-chat:${brand}:conversationId`,
    lastReadKey: `rentacar-chat:${brand}:lastReadMessageId`,
  })
}

let wrapper: VueWrapper | null = null
let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  localStorage.clear()
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}
  if (typeof globalThis.CSS === 'undefined') vi.stubGlobal('CSS', { escape: (s: string) => s })
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// Starts a turn and leaves it streaming, with the component mounted over it.
async function streaming() {
  const held = heldFetch()
  vi.stubGlobal('fetch', held.fn)
  const abort = vi.spyOn(AbortController.prototype, 'abort')
  const instance = newInstance()
  vi.stubGlobal('useChatConversation', () => instance)
  // Attached: jsdom only submits a form from a button click when it is in the document.
  wrapper = mount(ChatConversation, { props: { variant: 'page', active: true }, attachTo: document.body })
  instance.input.value = 'hola'
  const turn = instance.submit()
  await vi.waitFor(() => {
    expect(instance.status.value).toBe('streaming')
    expect(held.blocked()).toBe(true)
  })
  await wrapper.vm.$nextTick()
  return { w: wrapper, instance, held, abort, turn }
}

const userBubbles = (w: VueWrapper) => w.findAll('.cc-msg.is-user')

describe('SCEN-R3 — typing while the bot answers keeps the draft and does not send', () => {
  it('Enter during the stream: one request, no new bubble, draft kept, send button disabled and not brand-coloured, no stop control', async () => {
    const { w, instance, held, abort, turn } = await streaming()
    expect(held.fn).toHaveBeenCalledTimes(1)
    expect(userBubbles(w)).toHaveLength(1)

    await w.find('.cc-input input').setValue('otra pregunta')
    await w.find('form.cc-input').trigger('submit')
    await w.vm.$nextTick()

    expect(held.fn).toHaveBeenCalledTimes(1)
    expect(userBubbles(w)).toHaveLength(1)
    expect((w.find('.cc-input input').element as HTMLInputElement).value).toBe('otra pregunta')
    expect(instance.input.value).toBe('otra pregunta')

    const send = w.find('button.cc-send')
    expect(send.exists()).toBe(true)
    expect(send.attributes('type')).toBe('submit')
    expect(send.attributes('aria-label')).toBe('Enviar mensaje')
    expect((send.element as HTMLButtonElement).disabled).toBe(true)
    expect(send.classes()).not.toContain('cc-send-active')
    // Focus on the input (which paints the send button in WA brands) must not recolour it mid-stream.
    await w.find('.cc-input input').trigger('focus')
    expect(w.find('button.cc-send').classes()).not.toContain('cc-send-active')
    expect(w.findAll('button.cc-send')).toHaveLength(1)
    expect(w.find('[data-testid="chat-stop-test"]').exists()).toBe(false)
    expect(w.find('[aria-label="Detener respuesta"]').exists()).toBe(false)

    // Tapping the disabled button does nothing: the reply keeps streaming. A dispatched
    // native click (VTU's trigger() silently skips disabled elements, proving nothing).
    send.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await w.vm.$nextTick()
    expect(instance.status.value).toBe('streaming')
    expect(abort).not.toHaveBeenCalled()
    expect(held.fn).toHaveBeenCalledTimes(1)

    held.release()
    await turn
    await w.vm.$nextTick()
    expect(instance.messages.value.at(-1)?.text).toBe('Te cuento todo.')
    expect(abort).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('once the stream ends the button enables and Enter sends the draft', async () => {
    const { w, instance, held, turn } = await streaming()
    await w.find('.cc-input input').setValue('otra pregunta')
    held.release()
    await turn
    await w.vm.$nextTick()

    const send = w.find('button.cc-send')
    expect((send.element as HTMLButtonElement).disabled).toBe(false)

    await w.find('form.cc-input').trigger('submit')
    await vi.waitFor(() => expect(held.fn).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(instance.isStreaming.value).toBe(false))
    await w.vm.$nextTick()
    expect(userBubbles(w)).toHaveLength(2)
    expect(userBubbles(w).at(-1)!.text()).toContain('otra pregunta')
    expect(instance.input.value).toBe('')
  })

  it('once the stream ends a tap on the button sends the draft', async () => {
    const { w, instance, held, turn } = await streaming()
    await w.find('.cc-input input').setValue('otra pregunta')
    held.release()
    await turn
    await w.vm.$nextTick()

    ;(w.find('button.cc-send').element as HTMLButtonElement).click()
    await vi.waitFor(() => expect(held.fn).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(instance.isStreaming.value).toBe(false))
    await w.vm.$nextTick()
    expect(userBubbles(w).at(-1)!.text()).toContain('otra pregunta')
  })
})
