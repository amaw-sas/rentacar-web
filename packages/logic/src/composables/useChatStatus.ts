import { onMounted, ref } from 'vue'

/**
 * Per-brand chat visibility, driven by the dashboard's on/off switch.
 *
 * Fetches `GET {rentacarPublicApiBase}/api/chat/status?brand=` (the dashboard's
 * public endpoint) and exposes `enabled`. The dashboard toggle is the source of
 * truth: turning a brand on/off there shows/hides the chat with no redeploy.
 *
 * Fail-closed: starts `false` and only flips `true` when the backend confirms it,
 * so a down / slow / CORS-blocked endpoint hides the chat instead of surfacing a
 * broken one. Client-only (the widget is wrapped in <ClientOnly>); never throws.
 */
export function useChatStatus(brand: string) {
  const enabled = ref(false)
  const { rentacarPublicApiBase } = useRuntimeConfig().public

  onMounted(async () => {
    if (!brand) return
    try {
      const res = await $fetch<{ brand: string; enabled: boolean }>(
        `${rentacarPublicApiBase}/api/chat/status`,
        { query: { brand } },
      )
      enabled.value = res?.enabled === true
    } catch {
      enabled.value = false
    }
  })

  return { enabled }
}
