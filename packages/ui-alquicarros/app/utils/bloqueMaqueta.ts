/**
 * MAQUETA — la regla del bloque, portada de la implementación que se ejecutó
 * contra el calendario colombiano de 2026.
 *
 * Tres reglas, en este orden:
 *  1. El bloque es la próxima racha de DOS o más días libres seguidos
 *     (sábado, domingo o festivo). Un festivo suelto entre semana es racha de
 *     uno y no cuenta — por eso el martes 8 de diciembre no forma bloque.
 *  2. Se recoge la víspera del primer día libre y se devuelve el día siguiente
 *     al último. Nunca en el pasado: si la víspera ya pasó, la recogida es hoy.
 *  3. Si al bloque le queda un solo día, salta al siguiente — un bloque de un
 *     día es exactamente la ranura «Hoy», y dos ranuras iguales no informan.
 *
 * La etiqueta sale del propio bloque: con tres o más días libres es «Puente
 * festivo» y lleva el nombre del festivo; si no, es un fin de semana corriente.
 * Por eso no hace falta una pestaña de puente: la del medio se renombra sola.
 */

/** Festivos de Colombia 2026: 8 de fecha fija y 10 movibles (Pascua + Ley Emiliani). */
export const FESTIVOS_2026: Record<string, string> = {
  '2026-01-01': 'Año Nuevo',
  '2026-01-12': 'Epifanía',
  '2026-03-23': 'San José',
  '2026-04-02': 'Jueves Santo',
  '2026-04-03': 'Viernes Santo',
  '2026-05-01': 'Día del Trabajo',
  '2026-05-18': 'Ascensión',
  '2026-06-08': 'Corpus Christi',
  '2026-06-15': 'Sagrado Corazón',
  '2026-06-29': 'San Pedro y San Pablo',
  '2026-07-13': 'Virgen del Carmen',
  '2026-07-20': 'Independencia',
  '2026-08-07': 'Batalla de Boyacá',
  '2026-08-17': 'Asunción',
  '2026-10-12': 'Diversidad Étnica',
  '2026-11-02': 'Todos los Santos',
  '2026-11-16': 'Independencia de Cartagena',
  '2026-12-08': 'Inmaculada',
  '2026-12-25': 'Navidad',
}

const DIA_MS = 86_400_000
const AB = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const iso = (d: Date) => d.toISOString().slice(0, 10)
const mas = (d: Date, n: number) => new Date(d.getTime() + n * DIA_MS)
const libre = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6 || iso(d) in FESTIVOS_2026

/** «vie 9 oct» */
export const fmtCorto = (d: Date) => `${AB[d.getUTCDay()]} ${d.getUTCDate()} ${MES[d.getUTCMonth()]}`

/** Primera racha de ≥2 días libres que termina en o después de `desde`. */
function racha(desde: Date): { ini: Date; fin: Date } | null {
  let x = desde
  for (let i = 0; i < 400; i++) {
    if (libre(x)) {
      let ini = x
      while (libre(mas(ini, -1))) ini = mas(ini, -1)
      let fin = x
      while (libre(mas(fin, 1))) fin = mas(fin, 1)
      if ((fin.getTime() - ini.getTime()) / DIA_MS + 1 >= 2) return { ini, fin }
      x = mas(fin, 1)
      continue
    }
    x = mas(x, 1)
  }
  return null
}

export type Bloque = {
  etiqueta: string
  recogida: Date
  devolucion: Date
  dias: number
  festivos: string[]
  esPuente: boolean
}

export function bloqueDe(hoy: Date): Bloque | null {
  let r = racha(hoy)
  let recogida: Date
  let devolucion: Date
  let dias = 0
  while (r) {
    recogida = new Date(Math.max(mas(r.ini, -1).getTime(), hoy.getTime()))
    devolucion = mas(r.fin, 1)
    dias = Math.round((devolucion.getTime() - recogida.getTime()) / DIA_MS)
    if (dias >= 2) break
    r = racha(mas(r.fin, 2))
  }
  if (!r) return null

  const total = Math.round((r.fin.getTime() - r.ini.getTime()) / DIA_MS) + 1
  const festivos: string[] = []
  let libres = 0
  for (let i = 0; i < total; i++) {
    const d = mas(r.ini, i)
    if (libre(d)) libres++
    const f = FESTIVOS_2026[iso(d)]
    if (f) festivos.push(f)
  }
  const esPuente = libres >= 3
  const empiezaHoy = recogida!.getTime() === hoy.getTime()

  return {
    etiqueta: esPuente ? 'Puente festivo' : empiezaHoy ? 'Este fin de semana' : 'Fin de semana',
    recogida: recogida!,
    devolucion: devolucion!,
    dias,
    festivos,
    esPuente,
  }
}


/**
 * Primer día en el que TODAVÍA se puede recoger.
 *
 * Las sedes cierran temprano — Bogotá Centro Nuestro a las 16:00 — así que a las
 * 17:30 «hoy» ya no existe. Los propios clientes lo saben: a las 23:00, cero de
 * 1.876 búsquedas piden recogida para hoy.
 *
 * El corte va a las 15:00 y no a las 16:00 a propósito. La home se sirve con
 * `isr: 3600`, así que un snapshot puede llegar hasta una hora tarde; con una
 * hora de margen el desfase del caché nunca alcanza a prometer un día imposible.
 *
 * Se usa el horario más restrictivo de la red. El dato fino, sede por sede,
 * pertenece a las páginas de ciudad, no a la home.
 */
export const CIERRE_CONSERVADOR_H = 15

export function primeraRecogida(ahora: Date): { fecha: Date; rodo: boolean } {
  const horaBogota = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      hour12: false,
    }).format(ahora),
  )
  const hoyBogota = new Date(
    `${new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(ahora)}T00:00:00.000Z`,
  )
  const rodo = horaBogota >= CIERRE_CONSERVADOR_H
  return { fecha: rodo ? mas(hoyBogota, 1) : hoyBogota, rodo }
}
