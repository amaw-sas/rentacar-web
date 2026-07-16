import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// SCEN-322-T03/T04/T05 (wiring) — issue #322 PR7.
//
// The behavioral cases live in utils/__tests__/returnDateForPickupChange.test.ts
// (pure function, simulates the user's sequence of changes). This pins that the
// fechaRecogida watcher actually delegates to it with the PREVIOUS pickup and
// the CURRENT return — the ingredients duration preservation needs — instead of
// rebuilding the old pickup+1 collapse inline. Source-text structure, same
// precedent as useSearch.maxRentalDays.test.ts.

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)

/** SOLO el cuerpo del watcher de fechaRecogida (hasta el watcher siguiente). */
function pickupDateWatcher(): string {
  const start = source.indexOf('watch(fechaRecogida')
  if (start === -1) throw new Error('no existe el watcher `watch(fechaRecogida`')
  const end = source.indexOf('watch(selectedPickupDate', start)
  if (end === -1) throw new Error('no encuentro el final del watcher de fechaRecogida')
  return source.slice(start, end)
}

describe('useSearch — el watcher de recogida preserva la duración elegida', () => {
  it('delegates to returnDateForPickupChange (the tested pure rule)', () => {
    expect(pickupDateWatcher()).toMatch(/returnDateForPickupChange\(/)
  })

  it('feeds the PREVIOUS pickup value (duration needs the old anchor)', () => {
    // The watcher callback must receive and use Vue's previous value.
    expect(pickupDateWatcher()).toMatch(/previousPickup/)
  })

  it('feeds the CURRENT return date (the user\'s chosen end)', () => {
    expect(pickupDateWatcher()).toMatch(/selectedReturnDate\.value|currentReturn/)
  })

  it('no longer hardcodes the +1 collapse inline', () => {
    // The old body computed `pickup + 1 day` and passed the PICKUP itself as
    // nearestOpenDay's floor (same-day return bug). Both moved into the pure
    // function, whose floor is pickup + 1.
    expect(pickupDateWatcher()).not.toMatch(/nearestOpenDay\(/)
  })

  it('keeps flush: sync (runs before the availability-reset debounce)', () => {
    expect(pickupDateWatcher()).toMatch(/flush:\s*['"]sync['"]/)
  })
})
