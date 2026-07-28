/**
 * SCEN-X7: la consulta a rental_companies pide las columnas mensuales.
 *
 * El `select` lista columnas explícitas, no `*`. Si alguien añade la columna en
 * Supabase y la lee en `useCategory` pero olvida esta lista, PostgREST devuelve
 * la fila sin el campo, `transformExtras` lo vuelve `null` y el precio cae al
 * respaldo en silencio. El síntoma sería "funciona" — hasta que Diego cambie el
 * precio en base de datos y no pase nada.
 */
import { describe, it, expect } from 'vitest'
import { fetchRentacarData } from '../rentacarDataFetch'

const OK = { data: [], error: null }

/** Captura la cadena que cada tabla recibe en `.select()`. */
function makeSupabase(selects: Record<string, string>) {
  const build = (table: string) => {
    const q: Record<string, unknown> = {}
    q.select = (cols: string) => {
      selects[table] = cols
      return q
    }
    for (const m of ['order', 'single', 'eq', 'abortSignal']) q[m] = () => q
    q.then = (resolve: (v: unknown) => void) => Promise.resolve(OK).then(resolve)
    return q
  }
  return { from: (table: string) => build(table) } as never
}

describe('SCEN-X7: rental_companies trae los precios mensuales de los extras', () => {
  it('el select incluye extra_driver_month_price y baby_seat_month_price', async () => {
    const selects: Record<string, string> = {}
    await fetchRentacarData(makeSupabase(selects))

    const cols = selects['rental_companies']
    expect(cols, 'no se consultó rental_companies').toBeDefined()
    expect(cols).toContain('extra_driver_month_price')
    expect(cols).toContain('baby_seat_month_price')
  })

  it('sigue trayendo los precios diarios — el flujo de 1 a 29 días los necesita', async () => {
    const selects: Record<string, string> = {}
    await fetchRentacarData(makeSupabase(selects))

    const cols = selects['rental_companies']
    expect(cols).toContain('extra_driver_day_price')
    expect(cols).toContain('baby_seat_day_price')
  })
})
