import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Dogfood hallazgo #3: una URL con la devolución ANTES de la recogida
// (deep-link / URL stale que sortea el auto-bump de la UI) dejaba BUSCAR
// habilitado y, al enviar, salía solo el error genérico del backend. doSearch
// debe bloquear el rango invertido/cero con un mensaje claro ANTES de pegar al
// backend. selectedDays (rentalDayCount) es 0 exactamente cuando la devolución
// no es estrictamente posterior a la recogida (rentalDayCount.test.ts SCEN-008b).
// Encodamos la estructura como source-text (precedente useSearch.searchLinkParams);
// la verificación behavioral real es runtime + rentalDayCount.test.ts.

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)

describe('useSearch — doSearch blocks an inverted/zero date range', () => {
  it('destructures selectedReturnDate from the form store', () => {
    expect(source).toMatch(/selectedReturnDate/)
  })

  it('guards on selectedDays === 0 with both dates present', () => {
    expect(source).toMatch(/selectedPickupDate\.value\s*&&\s*selectedReturnDate\.value\s*&&\s*selectedDays\.value\s*===\s*0/)
  })

  it('shows a date-order message and stops the search', () => {
    expect(source).toMatch(/Revisa las fechas/)
    expect(source).toMatch(/devoluci[oó]n debe ser posterior a la fecha de recogida/i)
  })
})
