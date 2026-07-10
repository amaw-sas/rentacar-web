import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Holdout: docs/specs/max-rental-days/scenarios/max-rental-days.scenarios.md
//
// El tope de 30 días vivía solo en el :max-value del calendario. Una ruta hidratada
// (useSearchByRouteParams / useSearchByQueryParams) escribe las fechas crudas y llama
// doSearch, así que el tope debe imponerse en useSearch. Estructura como source-text,
// mismo precedente que useSearch.invertedRange.test.ts (la verificación behavioral es
// runtime + maxRentalDays.test.ts).

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)
const store = readFileSync(
  fileURLToPath(new URL('../../stores/useStoreReservationForm.ts', import.meta.url)),
  'utf8',
)

/**
 * SOLO el cuerpo del watcher de recorte. Anclar al archivo entero haría vacuas las
 * aserciones: `immediate: true`, `flush:'sync'` y `add({ days: 1 })` aparecen también en
 * los watchers vecinos (snap de hora, default de devolución), así que pasarían aunque el
 * recorte los perdiera.
 */
function clampWatcher(): string {
  const start = source.indexOf('watch(selectedDays')
  if (start === -1) throw new Error('no existe el watcher de recorte `watch(selectedDays`')
  const end = source.indexOf('const returnHourOptions', start)
  if (end === -1) throw new Error('no encuentro el final del watcher de recorte')
  return source.slice(start, end)
}

describe('useSearch — tope duro de MAX_RENTAL_DAYS', () => {
  it('importa la constante en vez de repetir el literal', () => {
    expect(source).toMatch(/MAX_RENTAL_DAYS/)
  })

  it('el filtro de horas de devolución es MONÓTONO (>=), no ===', () => {
    // Con === la restricción se apagaba justo cuando empezaba a hacer falta: subir la
    // hora sube selectedDays a 31 y la condición dejaba de cumplirse.
    expect(source).toMatch(/selectedDays\.value\s*>=\s*MAX_RENTAL_DAYS/)
    expect(source).not.toMatch(/selectedDays\.value\s*===\s*30/)
  })

  it('recorta la ventana cuando supera el tope', () => {
    expect(source).toMatch(/selectedDays\.value\s*<=\s*MAX_RENTAL_DAYS/)
    expect(source).toMatch(/latestOpenDayOnOrBefore/)
  })

  it('el recorte corre en la hidratación de la ruta (immediate) y en sync', () => {
    // Las composables de ruta fijan los refs ANTES de instanciar useSearch: un watcher
    // no-inmediato nunca vería el cambio.
    expect(clampWatcher()).toMatch(/immediate:\s*true/)
    expect(clampWatcher()).toMatch(/flush:\s*['"]sync['"]/)
  })

  it('el recorte iguala la hora de devolución a la de recogida', () => {
    expect(clampWatcher()).toMatch(/horaDevolucion\.value\s*=\s*horaRecogida\.value/)
  })

  it('la hora se fija SIEMPRE, aunque no haya hora de recogida', () => {
    // Con `if (horaRecogida.value)` una URL con horaRecogida=null y horaDevolucion
    // tardía dejaba la ventana en 31 días: la fecha ya estaba en el techo, así que
    // el watcher no volvía a dispararse. selectedDays usa medianoche como fallback;
    // el recorte debe usar el mismo.
    expect(clampWatcher()).toMatch(/horaDevolucion\.value\s*=\s*horaRecogida\.value\s*\?\?\s*['"]00:00['"]/)
    expect(clampWatcher()).not.toMatch(/if\s*\(horaRecogida\.value\)\s*horaDevolucion\.value/)
  })

  it('el suelo del snap es pickup + 1 día: la devolución nunca colapsa sobre la recogida', () => {
    // Con floor = pickup, una sede cerrada toda la ventana devolvía la propia fecha de
    // recogida ⇒ 0 días facturables ⇒ doSearch moría en "Revisa las fechas".
    expect(clampWatcher()).toMatch(/add\(\{\s*days:\s*1\s*\}\)/)
  })
})

describe('useStoreReservationForm — maxReturnDate usa la constante', () => {
  it('no deja el literal 30 suelto en maxReturnDate', () => {
    const block = store.slice(store.indexOf('const maxReturnDate'))
      .slice(0, 260)
    expect(block).toMatch(/MAX_RENTAL_DAYS/)
    expect(block).not.toMatch(/add\(\{\s*days:\s*30\s*\}\)/)
  })
})
