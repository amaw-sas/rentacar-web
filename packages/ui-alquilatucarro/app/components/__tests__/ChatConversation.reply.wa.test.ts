import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatConversation.vue', import.meta.url)),
  'utf8',
)

// WhatsApp-style reply-to (spec docs/specs/2026-07-17-chat-reply-whatsapp):
// quote CARD in the composer (color bar, author, preview, thumb, X), tinted
// quote block inside the sent bubble, any bot bubble replyable via swipe or
// hover, ↩ swipe hint, and tap-quote → scroll to the original with a flash.
// Gesture/visual halves are browser QA; these anchors pin the structure.
describe('SCEN-201 — composer reply card', () => {
  it('renders author, preview, optional thumbnail and dismiss inside a card', () => {
    expect(source).toMatch(/class="cc-reply-card"/)
    expect(source).toMatch(/class="cc-reply-author">\{\{ replyTo\.author \|\| 'Referencia' \}\}/)
    expect(source).toMatch(/class="cc-reply-preview">\{\{ replyTo\.preview \|\| replyTo\.label \}\}/)
    expect(source).toMatch(/v-if="replyTo\.image"[^>]*class="cc-reply-thumb"/)
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

describe('SCEN-203 — any bot bubble is replyable', () => {
  it('binds swipe handlers and a hover reply button on assistant text bubbles', () => {
    expect(source).toMatch(/@touchstart\.passive="onSwipeStart"[\s\S]{0,220}@touchend="onSwipeEnd\(\$event, \(\) => replyToBubble\(m, chunk\)\)"/)
    expect(source).toMatch(/class="cc-bubble-reply-btn"[^>]*aria-label="Responder a este mensaje"/)
  })

  it('builds the quote with markdown stripped and the target message id', () => {
    expect(source).toMatch(/function replyToBubble\(/)
    expect(source).toMatch(/replace\(\/\\\*\\\*\/g, ''\)/)
    expect(source).toMatch(/targetId: m\.id/)
  })

  it('keeps the wire contract: context is still the only server-facing field', () => {
    expect(source).toMatch(/context: `\[El cliente responde a este mensaje de la asesora: "\$\{preview\}"\]`/)
  })
})

describe('SCEN-204 — swipe reveals the ↩ hint', () => {
  it('renders the hint element on replyable surfaces and drives it with a CSS var', () => {
    expect(source).toMatch(/class="cc-swipe-hint" aria-hidden="true"/)
    expect(source).toMatch(/setProperty\('--cc-sdx'/)
    expect(source).toMatch(/\.cc-swipe-hint \{[\s\S]{0,320}opacity: var\(--cc-sdx, 0\);/)
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
