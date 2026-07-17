import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatConversation.vue', import.meta.url)),
  'utf8',
)

// WhatsApp-style bubbles (spec docs/specs/2026-07-17-chat-bubbles-whatsapp):
// tail ("piquito") on the first bubble of each visible same-sender run,
// timestamp tucked inline into the bottom-right corner, uniform 7.5px radius
// + subtle shadow on both roles. Visual halves (no overlap, no horizontal
// scroll) are covered by browser QA.
describe('SCEN-101 — piquito on first bubble of a same-sender run', () => {
  it('binds is-group-start on user, typing and assistant bubbles', () => {
    expect(source).toMatch(/is-user"[^>]{0,60}:class="\{ 'has-time': !!m\.createdAt, 'is-group-start': isGroupStart\(msgIdx\) \}"/)
    expect(source).toMatch(/!m\.text && isStreaming" class="cc-msg is-assistant" :class="\{ 'is-group-start': isGroupStart\(msgIdx\) \}"/)
    expect(source).toMatch(/'is-group-start': i === 0 && isGroupStart\(msgIdx\),/)
  })

  it('detects run start by comparing against the previous message role', () => {
    expect(source).toMatch(/function isGroupStart\(idx: number\): boolean/)
    expect(source).toMatch(/return m\?\.role !== role/)
  })

  it('draws the tail as a border triangle matching each bubble background', () => {
    expect(source).toMatch(/\.cc-msg\.is-user\.is-group-start \{ border-top-right-radius: 0; \}/)
    expect(source).toMatch(/\.cc-msg\.is-user\.is-group-start::before \{[\s\S]{0,220}border-top: 10px solid #d9fdd3;[\s\S]{0,80}border-right: 8px solid transparent;/)
    expect(source).toMatch(/\.cc-msg\.is-assistant\.is-group-start \{ border-top-left-radius: 0; \}/)
    expect(source).toMatch(/\.cc-msg\.is-assistant\.is-group-start::before \{[\s\S]{0,220}border-top: 10px solid #fff;[\s\S]{0,80}border-left: 8px solid transparent;/)
  })
})

describe('SCEN-102 — timestamp tucked into the bottom-right corner', () => {
  it('positions cc-time absolutely inside the bubble', () => {
    expect(source).toMatch(/\.cc-time \{\n  position: absolute;\n  right: 0\.5rem;\n  bottom: 0\.3125rem;/)
  })

  it('reserves the time width with an inline spacer on the last text line', () => {
    expect(source).toMatch(/\.cc-msg\.is-user\.has-time::after,\n\.cc-msg\.is-assistant\.has-time \.cc-text::after \{[\s\S]{0,120}display: inline-block;\n  width: 4\.5em;/)
  })

  it('falls back to an own-row time on bubbles with structured parts', () => {
    expect(source).toMatch(/'has-parts': i === bubblesFor\(m\)\.length - 1 && !!\(m\.quoteTable \|\| m\.gamaCards \|\| m\.actions\),/)
    // Specificity guard: the opt-out selectors must carry the full
    // .cc-msg.is-assistant prefix — with fewer classes they LOSE (0,3,1) vs
    // the (0,4,1) spacer rule and the override becomes dead CSS.
    expect(source).toMatch(/\.cc-msg\.is-assistant\.has-parts \.cc-time \{ position: static; display: block; margin-top: 0\.25rem; text-align: right; \}/)
    expect(source).toMatch(/\.cc-msg\.is-assistant\.has-parts \.cc-text::after \{ content: none; \}/)
    expect(source).not.toMatch(/\.cc-msg\.has-parts \.cc-text::after/)
  })
})

describe('SCEN-103 — WhatsApp radius and shadow on both roles', () => {
  it('uses a uniform 7.5px radius with the tail corner squared only via is-group-start', () => {
    expect(source).toMatch(/\.cc-msg \{\n  position: relative;\n  max-width: 85%;\n  padding: 0\.5rem 0\.75rem;\n  border-radius: 7\.5px;/)
    expect(source).not.toMatch(/border-bottom-right-radius: 0\.25rem/)
    expect(source).not.toMatch(/border-bottom-left-radius: 0\.25rem/)
  })

  it('applies the subtle shadow on the shared bubble base', () => {
    expect(source).toMatch(/\.cc-msg \{[\s\S]{0,300}box-shadow: 0 1px 0\.5px rgba\(11, 20, 26, 0\.13\);\n\}/)
  })
})

describe('SCEN-104 — ghost assistant placeholders do not break runs', () => {
  it('walks back past assistant messages that render no bubble', () => {
    // Failed turns keep an empty persisted assistant message (no text, no
    // parts) that renders nothing; the next user bubble must NOT get a tail.
    expect(source).toMatch(/m\.role === 'assistant' && !m\.text && !m\.quoteTable && !m\.gamaCards && !m\.actions/)
  })
})

describe('SCEN-105 — chunk ending in a block markdown CTA', () => {
  it('drops the spacer and returns the time to its own row', () => {
    expect(source).toMatch(/\.cc-msg\.is-assistant\.has-time \.cc-text:has\(> \.cc-link-btn:last-child\)::after \{ content: none; \}/)
    expect(source).toMatch(/\.cc-msg\.is-assistant:has\(\.cc-text > \.cc-link-btn:last-child\) \.cc-time \{/)
  })
})
