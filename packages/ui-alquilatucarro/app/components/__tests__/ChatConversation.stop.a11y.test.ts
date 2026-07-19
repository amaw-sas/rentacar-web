import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatConversation.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X04 (issue #322), surface half: while a reply streams there must be
// a visible "detener" control that aborts the in-flight turn on demand. The
// watchdog half (chunk-inactivity abort into the error branch) is covered
// functionally in packages/logic useChatConversation.watchdog.test.ts.
describe('SCEN-322-X04 — visible stop control while streaming', () => {
  it('renders a stop button gated by isStreaming that calls stop()', () => {
    expect(source).toMatch(/v-if="isStreaming"[\s\S]{0,200}@click="stop"/)
    expect(source).toMatch(/aria-label="Detener respuesta"/)
    expect(source).toMatch(/data-testid="chat-stop-test"/)
  })

  it('destructures stop from the chat singleton', () => {
    expect(source).toMatch(/\n  stop,\n/)
  })

  it('preserves the unmount invariant: never aborts the stream on unmount', () => {
    // The singleton keeps streaming in background; only the active surface unmounts.
    expect(source).toMatch(/onUnmounted\(\(\) => \{ if \(props\.active\) onSurfaceUnmounted\(\) \}\)/)
    expect(source).not.toMatch(/onUnmounted\([\s\S]{0,120}stop\(\)/)
  })
})
