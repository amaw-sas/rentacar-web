import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ChatConversation.vue', import.meta.url)),
  'utf8',
)

// WhatsApp-style bubbles (plan revisa-las-2-ultimas-wild-prism): tail ("piquito")
// on the first bubble of each same-sender run, timestamp tucked inline into the
// bottom-right corner, uniform 7.5px radius + subtle shadow on both roles.
// Visual halves (no overlap, no horizontal scroll) are covered by browser QA.
describe('SCEN-101 — piquito on first bubble of a same-sender run', () => {
  it('binds is-group-start on user, typing and assistant bubbles', () => {
    expect(source).toMatch(/is-user" :class="\{ 'has-time': !!m\.createdAt, 'is-group-start': isGroupStart\(msgIdx\) \}"/)
    expect(source).toMatch(/!m\.text && isStreaming" class="cc-msg is-assistant" :class="\{ 'is-group-start': isGroupStart\(msgIdx\) \}"/)
    expect(source).toMatch(/'is-group-start': i === 0 && isGroupStart\(msgIdx\),/)
  })

  it('detects run start by comparing the previous message role', () => {
    expect(source).toMatch(/function isGroupStart\(idx: number\): boolean \{\n  return messages\.value\[idx - 1\]\?\.role !== messages\.value\[idx\]\?\.role\n\}/)
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
    expect(source).toMatch(/\.cc-msg\.is-user\.has-time::after,\n\.cc-msg\.is-assistant\.has-time \.cc-text::after \{[\s\S]{0,120}display: inline-block;\n  width: 4\.25em;/)
  })

  it('falls back to an own-row time on bubbles with structured parts', () => {
    expect(source).toMatch(/'has-parts': i === bubblesFor\(m\)\.length - 1 && !!\(m\.quoteTable \|\| m\.gamaCards \|\| m\.actions\),/)
    expect(source).toMatch(/\.cc-msg\.has-parts \.cc-time \{ position: static; display: block; margin-top: 0\.25rem; text-align: right; \}/)
    expect(source).toMatch(/\.cc-msg\.has-parts \.cc-text::after \{ content: none; \}/)
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
