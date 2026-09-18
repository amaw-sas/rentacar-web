import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatConversation.vue', import.meta.url)),
  'utf8',
)

// WhatsApp-style reply-to (spec docs/specs/2026-07-17-chat-reply-whatsapp):
// quote CARD in the composer (color bar, author, preview, X), tinted quote block
// inside the sent bubble, and tap-quote → scroll to the original with a flash.
// Since docs/specs/2026-09-17-chat-reply-ttl-clear only gama rows and sede cards
// are replyable (SCEN-R1/R2, mounted in ChatConversation.partsOrder.mount.test.ts);
// SCEN-203/204 and the SCEN-201 thumbnail are retired by owner decision.
// Gesture/visual halves are browser QA; these anchors pin the structure.
describe('SCEN-201 — composer reply card', () => {
  it('renders author, preview and dismiss inside a card', () => {
    expect(source).toMatch(/class="cc-reply-card"/)
    expect(source).toMatch(/class="cc-reply-author">\{\{ replyTo\.author \|\| 'Referencia' \}\}/)
    expect(source).toMatch(/class="cc-reply-preview">\{\{ replyTo\.preview \|\| replyTo\.label \}\}/)
    expect(source).toMatch(/class="cc-reply-bar-x" aria-label="Quitar referencia"/)
  })

  it('styles the card with the colored bar and rounded corners', () => {
    expect(source).toMatch(/\.cc-reply-card \{[\s\S]{0,260}border-left: 4px solid var\(--ui-primary, #cc022b\);/)
    expect(source).toMatch(/\.cc-reply-author \{[\s\S]{0,160}color: var\(--ui-primary, #cc022b\);/)
  })
})

describe('SCEN-202 — in-bubble quote block', () => {
  it('renders author + preview with label fallback for legacy transcripts', () => {
    expect(source).toMatch(/v-if="m\.replyTo"[\s\S]{0,40}class="cc-reply-quote"/)
    expect(source).toMatch(/class="cc-reply-author">\{\{ m\.replyTo\.author \|\| 'Referencia' \}\}/)
    expect(source).toMatch(/class="cc-reply-preview">\{\{ m\.replyTo\.preview \|\| m\.replyTo\.label \}\}/)
  })

  it('tints the block over the bubble with the colored bar', () => {
    expect(source).toMatch(/\.cc-reply-quote \{[\s\S]{0,300}border-left: 4px solid var\(--ui-primary, #cc022b\);/)
    expect(source).toMatch(/\.cc-reply-quote \{[\s\S]{0,300}background: rgba\(11, 20, 26, 0\.06\);/)
  })
})

// SCEN-R1/R2 dead-code guard: the retired reply surfaces (bubble swipe/hover,
// model cards, composer thumbnail) leave nothing behind in the component.
describe('SCEN-R1/R2 — retired reply surfaces are gone from the source', () => {
  it.each([
    'replyToBubble',
    'replyToModelo',
    'cc-swipe-hint',
    'cc-bubble-reply-btn',
    'cc-reply-thumb',
    '--cc-sdx',
    'replyTo.image',
  ])('no %s', (token) => {
    expect(source).not.toContain(token)
  })

  it('assistant bubbles carry no swipe handlers', () => {
    expect(source).not.toMatch(/@touchstart\.passive="onSwipeStart"/)
    expect(source).not.toMatch(/\.cc-msg\.is-assistant \{ touch-action: pan-y; \}/)
  })
})

describe('SCEN-205 — tap quote scrolls to the original', () => {
  it('marks bubbles with data-mid and implements scrollToQuoted with a flash', () => {
    expect(source).toMatch(/:data-mid="m\.id"/)
    expect(source).toMatch(/function scrollToQuoted\(/)
    expect(source).toMatch(/querySelector\(`\[data-mid="\$\{CSS\.escape\(target\)\}"\]`\)/)
    expect(source).toMatch(/@keyframes cc-flash/)
  })

  it('honors reduced motion for the flash animation', () => {
    expect(source).toMatch(/prefers-reduced-motion: reduce[\s\S]{0,400}\.cc-flash \{ animation: none; \}/)
  })
})
