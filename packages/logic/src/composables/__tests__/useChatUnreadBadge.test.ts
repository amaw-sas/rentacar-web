import { describe, expect, it } from 'vitest'
import { countStoredChatUnread } from '../useChatUnreadBadge'

describe('countStoredChatUnread', () => {
  const messages = [
    { id: 'u1', role: 'user' },
    { id: 'a1', role: 'assistant' },
    { id: 'u2', role: 'user' },
    { id: 'a2', role: 'assistant' },
    { id: 'a3', role: 'assistant' },
  ]

  it('counts only assistant messages after the stored read marker', () => {
    expect(countStoredChatUnread(messages, 'a1')).toBe(2)
  })

  it('treats legacy history without a marker as already read', () => {
    expect(countStoredChatUnread(messages, null)).toBe(0)
  })

  it('fails toward all-read when the marker was trimmed', () => {
    expect(countStoredChatUnread(messages, 'missing')).toBe(0)
  })
})
