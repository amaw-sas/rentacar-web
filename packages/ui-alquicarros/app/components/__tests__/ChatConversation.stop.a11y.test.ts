import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatConversation.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X04 (issue #322), surface half, as amended by SCEN-R3
// (docs/specs/2026-09-17-chat-reply-ttl-clear, owner decision 2026-09-17): the
// visible "detener" control is gone; while a reply streams the slot keeps the send
// button, disabled. The watchdog half (chunk-inactivity abort into the error branch)
// is covered functionally in packages/logic useChatConversation.watchdog.test.ts;
// the mounted behavior lives in ChatConversation.streamDraft.mount.test.ts.
describe('SCEN-R3 — no stop control; the send button is disabled while streaming', () => {
  it('renders no stop button', () => {
    expect(source).not.toContain('Detener respuesta')
    expect(source).not.toContain('chat-stop-test')
    expect(source).not.toMatch(/@click="stop"/)
  })

  it('does not destructure stop from the chat singleton', () => {
    expect(source).not.toMatch(/\n  stop,\n/)
  })

  it('disables the single submit button while streaming or with an empty draft', () => {
    expect(source).toMatch(/type="submit"[\s\S]{0,160}:disabled="isStreaming \|\| !input\.trim\(\)"/)
  })

  it('dims the disabled button and keeps the brand colour off while streaming', () => {
    expect(source).toMatch(/\.cc-send:disabled \{[^}]*opacity: 0\.7;/)
    // WA brands paint the button only when not streaming; alquilame has no cc-send-active at all.
    if (source.includes('cc-send-active')) {
      expect(source).toMatch(/:class="\{ 'cc-send-active': !isStreaming && \(inputFocused \|\| input\.trim\(\)\) \}"/)
    }
  })

  it('preserves the unmount invariant: never aborts the stream on unmount', () => {
    // The singleton keeps streaming in background; only the active surface unmounts.
    expect(source).toMatch(/onUnmounted\(\(\) => \{ if \(props\.active\) onSurfaceUnmounted\(\) \}\)/)
    expect(source).not.toMatch(/onUnmounted\([\s\S]{0,120}stop\(\)/)
  })
})
