import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Asks the dashboard whether the chat is enabled for a brand:
 * `GET {apiBase}/api/chat/status?brand=` → `{ enabled }`. Awaitable, works on SSR
 * and client. `apiBase` is passed in so `useRuntimeConfig()` is read in the caller's
 * synchronous setup scope (never after an await). `null` means the request failed,
 * allowing callers to distinguish a transient error from an authoritative OFF.
 */
export async function fetchChatEnabled(apiBase: string, brand: string): Promise<boolean | null> {
  if (!brand) return null
  try {
    const res = await $fetch<{ brand: string; enabled: boolean }>(
      `${apiBase}/api/chat/status`,
      { query: { brand } },
    )
    return typeof res?.enabled === 'boolean' ? res.enabled : null
  } catch {
    return null
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
    // Before the first successful response, enabled stays at its fail-closed
    // default. Afterwards a transient error preserves the last authoritative
    // ON/OFF value instead of tearing down a live chat surface.
    if (nextEnabled === null) return
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
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus)
  })
  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus)
  })

  return { enabled, resolved, refresh }
}
