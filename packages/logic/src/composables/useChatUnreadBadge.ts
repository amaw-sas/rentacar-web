import { onBeforeUnmount, onMounted, ref } from 'vue'
import { trackAnalyticsEvent, type ChatOpenSource } from '@rentacar-main/logic/utils'
import { isChatTranscriptExpired } from '../utils/chatTtl'

const CHAT_UNREAD_EVENT = 'rentacar-chat:unread'
const pendingOpenSources = new Map<string, ChatOpenSource>()

export interface StoredChatMessage {
  id?: string
  role?: string
  createdAt?: number
}

interface ChatUnreadDetail {
  brand: string
  unread: number
  announce: string
}

export function countStoredChatUnread(messages: StoredChatMessage[], lastRead: string | null): number {
  if (!lastRead || !messages.length) return 0
  const marker = messages.findIndex(message => message.id === lastRead)
  if (marker < 0) return 0
  return messages.slice(marker + 1).filter(message => message.role === 'assistant').length
}

export function publishChatUnread(detail: ChatUnreadDetail): void {
  if (
    typeof window === 'undefined' ||
    typeof window.dispatchEvent !== 'function' ||
    typeof CustomEvent === 'undefined'
  ) return
  window.dispatchEvent(new CustomEvent<ChatUnreadDetail>(CHAT_UNREAD_EVENT, { detail }))
}

/** Carries the open source across the lazy ChatConversation chunk boundary. */
export function takePreparedChatOpen(brand: string): ChatOpenSource | null {
  const source = pendingOpenSources.get(brand) ?? null
  pendingOpenSources.delete(brand)
  return source
}

/** Lightweight persisted badge state for the always-visible contact FAB. */
export function useChatUnreadBadge(brand: string) {
  const unread = ref(0)
  const announce = ref('')
  // Once the live engine for this brand publishes, it owns the count: storage
  // re-reads would race its in-memory state.
  let enginePublished = false

  function restore() {
    try {
      const raw = localStorage.getItem(`rentacar-chat:${brand}:messages`)
      const lastRead = localStorage.getItem(`rentacar-chat:${brand}:lastReadMessageId`)
      const messages = raw ? JSON.parse(raw) as StoredChatMessage[] : []
      // Same 24 h TTL as the engine: an expired conversation opens empty, so it
      // must not badge.
      unread.value = isChatTranscriptExpired(messages, Date.now())
        ? 0
        : countStoredChatUnread(messages, lastRead)
    } catch {
      unread.value = 0
    }
  }

  function onUnread(event: Event) {
    const detail = (event as CustomEvent<ChatUnreadDetail>).detail
    if (!detail || detail.brand !== brand) return
    enginePublished = true
    unread.value = detail.unread
    announce.value = detail.announce
  }

  // A tab left open with the chat never opened: drop yesterday's badge on return.
  function onVisibilityChange() {
    if (document.visibilityState === 'visible' && !enginePublished) restore()
  }

  onMounted(() => {
    restore()
    window.addEventListener(CHAT_UNREAD_EVENT, onUnread)
    document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onBeforeUnmount(() => {
    window.removeEventListener(CHAT_UNREAD_EVENT, onUnread)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
    unread,
    announce,
    clearUnread: () => { unread.value = 0 },
    prepareChatOpen: (source: ChatOpenSource) => pendingOpenSources.set(brand, source),
    emitReopenedFromBadge: () => trackAnalyticsEvent('chat_reopened_from_badge', { brand }),
  }
}
