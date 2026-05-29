// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import useDelayedClose, { DEFAULT_CLOSE_DELAY_MS } from '../useDelayedClose'

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
//   S4  When the host component is unmounted with a pending close timer,
//       onScopeDispose clears it (no leaked timer, no late mutation) — proven
//       through the real component lifecycle with @vue/test-utils mount.
//   S5  When the opener requests open=false while already closed, no close
//       timer is scheduled (idempotent) — `open` stays false with no pending
//       work.
//   S6  forceClose() closes immediately (no delay) and cancels any pending
//       close timer — this is the dismiss path (Escape / outside-click /
//       sibling tooltip), distinct from a hover-leave which keeps the delay.
//   S7  Called with no argument, the close delay defaults to
//       DEFAULT_CLOSE_DELAY_MS (3000ms).

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

  it('S4 — unmounting the host component clears a pending close timer', () => {
    // Exercise the real Vue lifecycle: the composable runs inside a mounted
    // component, and unmount() must trigger onScopeDispose(clearCloseTimer).
    let api!: ReturnType<typeof useDelayedClose>
    const wrapper = mount(
      defineComponent({
        setup() {
          api = useDelayedClose(3000)
          return () => h('div')
        },
      }),
    )

    api.onOpenChange(true)
    api.onOpenChange(false) // arm the delayed-close timer
    expect(api.open.value).toBe(true)
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0) // onScopeDispose cleared it

    // No late mutation: the cleared timer never fires.
    vi.advanceTimersByTime(10000)
    expect(api.open.value).toBe(true)
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

  it('S6 — forceClose() closes immediately and cancels a pending timer', () => {
    const scope = effectScope()
    scope.run(() => {
      const { open, onOpenChange, forceClose } = useDelayedClose(3000)
      onOpenChange(true)
      onOpenChange(false) // hover-leave: arms the delayed-close timer
      expect(open.value).toBe(true)
      expect(vi.getTimerCount()).toBe(1)

      // Dismiss (Escape / outside-click): close now, drop the pending timer.
      forceClose()
      expect(open.value).toBe(false)
      expect(vi.getTimerCount()).toBe(0)

      // The delayed timer must not fire late and mutate state again.
      vi.advanceTimersByTime(5000)
      expect(open.value).toBe(false)
    })
    scope.stop()
  })

  it('S7 — close delay defaults to DEFAULT_CLOSE_DELAY_MS when omitted', () => {
    const scope = effectScope()
    scope.run(() => {
      const { open, onOpenChange } = useDelayedClose()
      onOpenChange(true)
      onOpenChange(false)

      vi.advanceTimersByTime(DEFAULT_CLOSE_DELAY_MS - 1)
      expect(open.value).toBe(true)

      vi.advanceTimersByTime(1)
      expect(open.value).toBe(false)
    })
    scope.stop()
  })
})
