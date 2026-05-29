import { ref, onScopeDispose } from 'vue'

export default function useDelayedClose(closeDelayMs: number) {
  const open = ref(false)
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  function clearCloseTimer() {
    if (closeTimer !== null) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
  }

  function onOpenChange(value: boolean) {
    clearCloseTimer()
    if (value) {
      open.value = true
      return
    }
    // Idempotency: already closed (so no timer can be pending — `open` stays
    // true until the timer fires). Scheduling here would be a redundant
    // close timer with nothing to close.
    if (!open.value) return
    closeTimer = setTimeout(() => {
      open.value = false
      closeTimer = null
    }, closeDelayMs)
  }

  onScopeDispose(clearCloseTimer)

  return { open, onOpenChange }
}
