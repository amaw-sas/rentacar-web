import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as utils from '../../index'

// SCEN-322-X07 (issue #322): the flight branch of the reservation form was dead
// code — no template ever collected aerolinea/numeroVueloIda, so the
// *WithFlight* schemas were a validation trap that could reject a submit over
// fields the user had no way to fill. This pins the removal at three levels:
// barrel exports, deleted modules, and the store/payload sources.

const src = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

describe('SCEN-322-X07 — the flight branch does not exist', () => {
  it('the utils barrel exports no flight schema or type', () => {
    expect(Object.keys(utils).filter((k) => /flight/i.test(k))).toEqual([])
  })

  it('the flight validation modules are deleted', () => {
    for (const f of [
      '../flightForm.ts',
      '../reservationWithFlightForm.ts',
      '../userInformationWithFlightForm.ts',
    ]) {
      expect(existsSync(fileURLToPath(new URL(f, import.meta.url))), f).toBe(false)
    }
  })

  it('the reservation store carries no flight state', () => {
    const store = src('../../../stores/useStoreReservationForm.ts')
    expect(store).not.toMatch(/const haveFlight|const aerolinea|const numeroVueloIda/)
    expect(store).not.toMatch(/WithFlightFormValidationSchema/)
  })

  it('the record payload cannot send flight fields the form never collected', () => {
    const record = src('../../../composables/useRecordReservationForm.ts')
    expect(record).not.toMatch(/aeroline:/)
    expect(record).not.toMatch(/flight_number:/)
    // The wire flag stays, hardcoded to "no flight" for dashboard compatibility.
    expect(record).toMatch(/flight:\s*0/)
  })
})
