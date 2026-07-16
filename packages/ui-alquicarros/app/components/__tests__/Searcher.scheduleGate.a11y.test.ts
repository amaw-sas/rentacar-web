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
  it('keeps the schedule gate on the button disabled state', () => {
    expect(source).toMatch(/:disabled="[^"]*!isSelectionWithinSchedule"/)
  })

  it('renders a persistent inline message while the selection is out of schedule', () => {
    expect(source).toMatch(/v-if="!isSelectionWithinSchedule"/)
    expect(source).toMatch(/id="schedule-gate-message"/)
    expect(source).toMatch(/fuera del horario de atención de la sucursal/)
  })

  it('links the message to the button via aria-describedby (only while invalid)', () => {
    expect(source).toMatch(
      /:aria-describedby="!isSelectionWithinSchedule \? 'schedule-gate-message' : undefined"/,
    )
  })
})
