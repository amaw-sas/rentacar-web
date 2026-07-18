import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Asks the dashboard whether the chat is enabled for a brand:
 * `GET {apiBase}/api/chat/status?brand=` → `{ enabled }`. Awaitable, works on SSR
 * and client. `apiBase` is passed in so `useRuntimeConfig()` is read in the caller's
 * synchronous setup scope (never after an await). Fail-closed: any error → `false`.
 */
export async function fetchChatEnabled(apiBase: string, brand: string): Promise<boolean> {
  if (!brand) return false
  try {
    const res = await $fetch<{ brand: string; enabled: boolean }>(
      `${apiBase}/api/chat/status`,
      { query: { brand } },
    )
    return res?.enabled === true
  } catch {
    return false
  }
}

/**
 * Per-brand chat visibility for the contact FAB, driven by the dashboard's on/off
 * switch (the dashboard toggle is the source of truth: on/off there shows/hides the
 * chat with no redeploy). Client-only fetch (the widget is wrapped in <ClientOnly>);
 * starts `false` and only flips `true` when the backend confirms it. Never throws.
 */
export function useChatStatus(brand: string) {
  const enabled = ref(false)
  const resolved = ref(false)
  const { rentacarPublicApiBase } = useRuntimeConfig().public
  let refreshGeneration = 0

  async function refresh() {
    const generation = ++refreshGeneration
    const nextEnabled = await fetchChatEnabled(rentacarPublicApiBase as string, brand)
    // A slow earlier request must never overwrite a newer focus revalidation.
    if (generation !== refreshGeneration) return
    enabled.value = nextEnabled
    resolved.value = true
  }

  // Revalidate when a visitor returns to an already-open tab. This makes an OFF
  // toggle close an open surface instead of leaving stale chat UI alive forever.
  function onFocus() {
    void refresh()
  }

  onMounted(() => {
    void refresh()
    if (import.meta.client) window.addEventListener('focus', onFocus)
  })
  onBeforeUnmount(() => {
    if (import.meta.client) window.removeEventListener('focus', onFocus)
  })

  return { enabled, resolved, refresh }
}
