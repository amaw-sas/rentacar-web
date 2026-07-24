import { describe, it, expect } from 'vitest'

import {
  SEARCH_PARAM_NOTICE_KEY,
  SEARCH_PARAM_NOTICES,
  withNoticeCode,
  readNoticeCodes,
} from '../searchParamNotices'

// Issue #406 — the carrier that survives the middleware's 302.
//
// The middleware corrects a broken deep-link and redirects; a redirect carries
// no payload, so a toast created during that server pass never reaches a
// client. The correction travels as a CODE in the redirect target's query and
// is translated here, at the drain point.
//
// Holdout: docs/specs/issue-406-middleware-route-notices/scenarios/middleware-route-notices.scenarios.md

describe('searchParamNotices — the notice catalog (#406)', () => {
  it('every code maps to the copy the middleware used to emit', () => {
    // Same wording as the five createMessage sites this replaces. #406 is about
    // the notice ARRIVING, not about rewording it.
    expect(SEARCH_PARAM_NOTICES.sede.message).toBe(
      'Ubicación inválida. Se ajustó a la sede por defecto.',
    )
    expect(SEARCH_PARAM_NOTICES['sede-ciudad'].message).toBe(
      'La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.',
    )
    expect(SEARCH_PARAM_NOTICES.hora.message).toBe(
      'Formato de hora inválido. Se ajustó al valor por defecto.',
    )
    expect(SEARCH_PARAM_NOTICES.parametros.message).toBe(
      'Parámetros inválidos. Se ajustaron a los valores por defecto.',
    )
    expect(SEARCH_PARAM_NOTICES.duracion.message).toBe(
      'La fecha de devolución ha sido ajustada a 30 días después de la fecha de recogida.',
    )
  })

  describe('withNoticeCode — accumulating across chained redirects', () => {
    it('adds the code to an empty query', () => {
      expect(withNoticeCode({}, 'sede')).toEqual({ [SEARCH_PARAM_NOTICE_KEY]: 'sede' })
    })

    it('preserves the query keys already present', () => {
      expect(withNoticeCode({ utm_source: 'newsletter' }, 'duracion')).toEqual({
        utm_source: 'newsletter',
        [SEARCH_PARAM_NOTICE_KEY]: 'duracion',
      })
    })

    // SCEN-406-05. A city-foreign pickup branch keeps the user's dates, so it
    // can chain into the 30-day cap. Overwriting would drop the branch notice —
    // the very silence this issue closes, reintroduced by its own fix.
    it('accumulates instead of overwriting when a second correction fires', () => {
      const first = withNoticeCode({}, 'sede-ciudad')
      const second = withNoticeCode(first, 'duracion')

      expect(second[SEARCH_PARAM_NOTICE_KEY]).toBe('sede-ciudad,duracion')
    })

    it('does not repeat a code that is already carried', () => {
      const once = withNoticeCode({}, 'sede')
      expect(withNoticeCode(once, 'sede')[SEARCH_PARAM_NOTICE_KEY]).toBe('sede')
    })

    it('caps the chain so a redirect loop cannot grow the URL without bound', () => {
      let query: Record<string, unknown> = {}
      for (const code of ['sede', 'sede-ciudad', 'hora', 'parametros', 'duracion'] as const) {
        query = withNoticeCode(query, code)
      }

      expect(String(query[SEARCH_PARAM_NOTICE_KEY]).split(',')).toHaveLength(3)
    })

    // What the URL already carries is attacker-writable, so the cap can arrive
    // pre-filled. The correction being raised right now must never be the one
    // that falls off — otherwise a planted `?aviso=` silences a real change to
    // the user's booking, which is the exact failure #406 exists to remove.
    it('never drops the code being raised in favour of ones the URL carried', () => {
      const planted = { aviso: 'sede,hora,parametros' }

      const result = withNoticeCode(planted, 'duracion')

      const carried = String(result[SEARCH_PARAM_NOTICE_KEY]).split(',')
      expect(carried).toHaveLength(3)
      expect(carried).toContain('duracion')
      expect(carried[carried.length - 1]).toBe('duracion')
      // The oldest inherited code is the one that gives way.
      expect(carried).not.toContain('sede')
    })
  })

  describe('readNoticeCodes — whitelist translation', () => {
    it('reads a single code', () => {
      expect(readNoticeCodes('sede')).toEqual(['sede'])
    })

    it('reads an accumulated chain in order', () => {
      expect(readNoticeCodes('sede-ciudad,duracion')).toEqual(['sede-ciudad', 'duracion'])
    })

    // SCEN-406-04. The param is user-writable: anything that is not a known
    // code is dropped, and the raw value never reaches a message.
    it('drops anything that is not a known code', () => {
      expect(readNoticeCodes('<img src=x onerror=alert(1)>')).toEqual([])
      expect(readNoticeCodes('sede,inventado')).toEqual(['sede'])
      expect(readNoticeCodes('')).toEqual([])
      expect(readNoticeCodes(undefined)).toEqual([])
      expect(readNoticeCodes(null)).toEqual([])
    })

    // A duplicated query key (?aviso=a&aviso=b) arrives as an array — same trap
    // firstQueryValue guards against in useSearchByQueryParams (#402).
    it('takes the first value when the key is duplicated', () => {
      expect(readNoticeCodes(['duracion', 'sede'])).toEqual(['duracion'])
    })

    it('caps what it honours even if the URL was hand-stuffed', () => {
      expect(
        readNoticeCodes('sede,sede-ciudad,hora,parametros,duracion'),
      ).toHaveLength(3)
    })

    it('never returns a code without an entry in the catalog', () => {
      for (const code of readNoticeCodes('sede,sede-ciudad,duracion')) {
        expect(SEARCH_PARAM_NOTICES[code]).toBeDefined()
      }
    })
  })
})
