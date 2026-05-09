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
    closeTimer = setTimeout(() => {
      open.value = false
      closeTimer = null
    }, closeDelayMs)
  }

  onScopeDispose(clearCloseTimer)

  return { open, onOpenChange }
}
