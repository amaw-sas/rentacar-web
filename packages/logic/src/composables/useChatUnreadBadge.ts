import { onBeforeUnmount, onMounted, ref } from 'vue'

const CHAT_UNREAD_EVENT = 'rentacar-chat:unread'

export interface StoredChatMessage {
  id?: string
  role?: string
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

/** Lightweight persisted badge state for the always-visible contact FAB. */
export function useChatUnreadBadge(brand: string) {
  const unread = ref(0)
  const announce = ref('')

  function restore() {
    try {
      const raw = localStorage.getItem(`rentacar-chat:${brand}:messages`)
      const lastRead = localStorage.getItem(`rentacar-chat:${brand}:lastReadMessageId`)
      const messages = raw ? JSON.parse(raw) as StoredChatMessage[] : []
      unread.value = countStoredChatUnread(messages, lastRead)
    } catch {
      unread.value = 0
    }
  }

  function onUnread(event: Event) {
    const detail = (event as CustomEvent<ChatUnreadDetail>).detail
    if (!detail || detail.brand !== brand) return
    unread.value = detail.unread
    announce.value = detail.announce
  }

  onMounted(() => {
    restore()
    window.addEventListener(CHAT_UNREAD_EVENT, onUnread)
  })
  onBeforeUnmount(() => window.removeEventListener(CHAT_UNREAD_EVENT, onUnread))

  return {
    unread,
    announce,
    clearUnread: () => { unread.value = 0 },
  }
}
