import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

import useDelayedClose from '../useDelayedClose'

// Scenarios captured: an operator-facing tooltip on category-card total price
// must remain visible for closeDelayMs after the trigger loses hover/focus,
// so the operator has time to read price details. Reka UI / Nuxt UI Tooltip
// has no native close-delay prop — this composable wraps the controlled
// `open` state with a delayed close timer.
//
//   S1  When opener requests open=true, `open` becomes true synchronously
//       (no opening delay — that is owned by Reka's `delay-duration`).
//   S2  When opener requests open=false, `open` stays true for closeDelayMs,
//       then flips to false.
//   S3  If opener re-requests open=true within the close delay window, the
//       pending close timer is cancelled and `open` stays true.
//   S4  When the owning effect scope is disposed with a pending close timer,
//       the timer is cleared (no leak, no late mutation).
//   S5  When the opener requests open=false while already closed, no close
//       timer is scheduled (idempotent) — `open` stays false with no pending
//       work.

describe('useDelayedClose', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('S1 — open=true is applied synchronously', () => {
    const scope = effectScope()
    scope.run(() => {
      const { open, onOpenChange } = useDelayedClose(3000)
      expect(open.value).toBe(false)
      onOpenChange(true)
      expect(open.value).toBe(true)
    })
    scope.stop()
  })

  it('S2 — open=false is delayed by closeDelayMs before applying', async () => {
    const scope = effectScope()
    scope.run(() => {
      const { open, onOpenChange } = useDelayedClose(3000)
      onOpenChange(true)
      expect(open.value).toBe(true)

      onOpenChange(false)
      expect(open.value).toBe(true)

      vi.advanceTimersByTime(2999)
      expect(open.value).toBe(true)

      vi.advanceTimersByTime(1)
      expect(open.value).toBe(false)
    })
    scope.stop()
  })

  it('S3 — re-opening within the close window cancels the timer', () => {
    const scope = effectScope()
    scope.run(() => {
      const { open, onOpenChange } = useDelayedClose(3000)
      onOpenChange(true)
      onOpenChange(false)
      vi.advanceTimersByTime(1500)
      expect(open.value).toBe(true)

      onOpenChange(true)
      vi.advanceTimersByTime(5000)
      expect(open.value).toBe(true)
    })
    scope.stop()
  })

  it('S4 — disposing the scope clears a pending close timer', () => {
    const scope = effectScope()
    let openRef: { value: boolean } | undefined
    scope.run(() => {
      const { open, onOpenChange } = useDelayedClose(3000)
      openRef = open
      onOpenChange(true)
      onOpenChange(false)
    })

    scope.stop()
    vi.advanceTimersByTime(10000)
    expect(openRef!.value).toBe(true)
  })

  it('S5 — requesting close while already closed schedules no timer', () => {
    const scope = effectScope()
    scope.run(() => {
      const { open, onOpenChange } = useDelayedClose(3000)
      expect(open.value).toBe(false)

      // Redundant close on an already-closed tooltip is a no-op: no timer
      // is armed, so advancing past the delay changes nothing.
      onOpenChange(false)
      expect(vi.getTimerCount()).toBe(0)

      vi.advanceTimersByTime(5000)
      expect(open.value).toBe(false)
    })
    scope.stop()
  })
})
