import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../Searcher.vue', import.meta.url)),
  'utf8',
)

// SCEN-322-X03 (issue #322): when the schedule gate disables BUSCAR already at
// mount (deep-link with an out-of-schedule selection) the useSearch transition
// toast never fires, leaving a silently dead button. A persistent inline
// message must explain the reason and be wired to the button via
// aria-describedby.
describe('SCEN-322-X03 — disabled-by-schedule BUSCAR explains itself on screen', () => {
  // Issue #387 rewired the button: `:disabled` is now `!canSearch` and the
  // aria-describedby is a computed. The schedule-gate invariant is PRESERVED —
  // canSearch ANDs isSelectionWithinSchedule (so an out-of-schedule selection
  // still disables), and ctaDescribedBy still points at the schedule message —
  // it is just expressed through canSearch/ctaDescribedBy instead of inline.
  it('keeps the schedule gate wired into the disabled state via canSearch', () => {
    expect(source).toMatch(/:disabled="!canSearch"/)
    const match = source.match(/const canSearch\s*=\s*computed\(\(\)\s*=>([\s\S]*?)\)\s*;/)
    expect(match, 'canSearch computed not found').toBeTruthy()
    expect(match![1]!).toMatch(/isSelectionWithinSchedule\.value/)
  })

  it('renders a persistent inline message while the selection is out of schedule', () => {
    expect(source).toMatch(/v-if="!isSelectionWithinSchedule"/)
    expect(source).toMatch(/id="schedule-gate-message"/)
    expect(source).toMatch(/fuera del horario de atención de la sucursal/)
  })

  it('links the message to the button via a describedby computed that prefers the schedule gate', () => {
    expect(source).toMatch(/:aria-describedby="ctaDescribedBy"/)
    const match = source.match(/const ctaDescribedBy\s*=\s*computed\(\(\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;/)
    expect(match, 'ctaDescribedBy computed not found').toBeTruthy()
    const body = match![1]!
    expect(body).toMatch(/!isSelectionWithinSchedule\.value/)
    expect(body).toMatch(/return 'schedule-gate-message'/)
  })
})
