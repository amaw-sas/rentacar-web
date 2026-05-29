import { ref, onScopeDispose } from 'vue'

/**
 * Default close delay (ms): how long an operator-facing tooltip stays open
 * after a hover-leave so the operator can move into it to read/select.
 */
export const DEFAULT_CLOSE_DELAY_MS = 3000

/**
 * Controlled `open` state for a tooltip with a delayed close.
 *
 * Reka UI / Nuxt UI Tooltip has no native close-delay: on hover-leave it
 * closes at once. This wraps `open` so a hover-leave (`onOpenChange(false)`)
 * waits `closeDelayMs` before closing, while a dismiss (`forceClose`) closes
 * immediately.
 *
 * @param closeDelayMs - Delay before a hover-leave close applies. Negative
 *   values are clamped to 0. Defaults to {@link DEFAULT_CLOSE_DELAY_MS}.
 * @returns `open` (reactive state), `onOpenChange` (hover-leave path,
 *   delayed) and `forceClose` (dismiss path, immediate).
 */
export default function useDelayedClose(closeDelayMs: number = DEFAULT_CLOSE_DELAY_MS) {
  const delayMs = Math.max(0, closeDelayMs)
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
    }, delayMs)
  }

  // Dismiss path: Escape, outside-click or a sibling tooltip opening must
  // close now, not after closeDelayMs (the delay only serves hover-leave, so
  // the operator can move into the tooltip to read/select it). Cancels any
  // pending hover-leave timer so it can't fire late.
  function forceClose() {
    clearCloseTimer()
    open.value = false
  }

  onScopeDispose(clearCloseTimer)

  return { open, onOpenChange, forceClose }
}
