import { onMounted, ref } from 'vue'

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
  const { rentacarPublicApiBase } = useRuntimeConfig().public

  onMounted(async () => {
    enabled.value = await fetchChatEnabled(rentacarPublicApiBase as string, brand)
  })

  return { enabled }
}
