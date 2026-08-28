/**
 * Holdout de la regla del bloque. Cada caso salió de ejecutar la regla contra el
 * calendario colombiano de 2026 y de revisarlo a mano; el port a TypeScript
 * tiene que reproducirlos exactamente.
 *
 * SCEN-B01 — fin de semana normal: viernes a lunes, 3 días
 * SCEN-B02 — el sábado el bloque encoge; el domingo salta al siguiente
 * SCEN-B03 — lunes festivo: 4 días, etiqueta «Puente»
 * SCEN-B04 — festivo suelto entre semana: NO forma bloque
 * SCEN-B05 — festivo de viernes: el bloque empieza el jueves
 * SCEN-B06 — Semana Santa: el bloque más largo del año
 *
 * SCEN-B04 es el que importa: la primera versión de la regla usaba un umbral de
 * 3 días libres y se saltaba TODOS los fines de semana normales hasta el
 * siguiente puente (un lunes de agosto proponía el 10 de octubre).
 */
import { describe, it, expect } from 'vitest'
import { bloqueDe, fmtCorto, primeraRecogida } from '../bloqueMaqueta'

const dia = (s: string) => new Date(`${s}T00:00:00.000Z`)

/** «vie 28 ago → lun 31 ago · 3 días · Fin de semana» */
function resolver(fecha: string) {
  const b = bloqueDe(dia(fecha))!
  return `${fmtCorto(b.recogida)} → ${fmtCorto(b.devolucion)} · ${b.dias} días · ${b.etiqueta}`
}

describe('SCEN-B01 — fin de semana normal', () => {
  it('de lunes a jueves apunta al mismo viernes, 3 días', () => {
    for (const d of ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27']) {
      expect(resolver(d)).toBe('vie 28 ago → lun 31 ago · 3 días · Fin de semana')
    }
  })

  it('el viernes es «este», con las mismas fechas', () => {
    expect(resolver('2026-08-28')).toBe('vie 28 ago → lun 31 ago · 3 días · Este fin de semana')
  })
})

describe('SCEN-B02 — el borde del propio fin de semana', () => {
  it('el sábado encoge a 2 días', () => {
    expect(resolver('2026-08-29')).toBe('sáb 29 ago → lun 31 ago · 2 días · Este fin de semana')
  })

  it('el domingo salta al siguiente, porque quedaría 1 día', () => {
    expect(resolver('2026-08-30')).toBe('vie 4 sep → lun 7 sep · 3 días · Fin de semana')
  })
})

describe('SCEN-B03 — lunes festivo', () => {
  it('Asunción alarga el bloque a 4 días y lo llama Puente', () => {
    expect(resolver('2026-08-13')).toBe('vie 14 ago → mar 18 ago · 4 días · Puente festivo')
    expect(bloqueDe(dia('2026-08-13'))!.festivos).toEqual(['Asunción'])
  })

  it('el propio lunes festivo salta al fin de semana siguiente', () => {
    expect(resolver('2026-08-17')).toBe('vie 21 ago → lun 24 ago · 3 días · Fin de semana')
  })
})

describe('SCEN-B04 — festivo suelto entre semana no forma bloque', () => {
  it('el martes 8 de diciembre no cambia la ranura', () => {
    expect(resolver('2026-12-08')).toBe('vie 11 dic → lun 14 dic · 3 días · Fin de semana')
  })

  it('y los días alrededor tampoco lo ven', () => {
    expect(resolver('2026-12-07')).toBe('vie 11 dic → lun 14 dic · 3 días · Fin de semana')
    expect(resolver('2026-12-09')).toBe('vie 11 dic → lun 14 dic · 3 días · Fin de semana')
  })
})

describe('SCEN-B05 — festivo de viernes', () => {
  it('Boyacá hace que el bloque empiece el jueves', () => {
    expect(resolver('2026-08-05')).toBe('jue 6 ago → lun 10 ago · 4 días · Puente festivo')
  })
})

describe('SCEN-B06 — Semana Santa', () => {
  it('jueves y viernes santos dan el bloque más largo, recogida el miércoles', () => {
    expect(resolver('2026-03-30')).toBe('mié 1 abr → lun 6 abr · 5 días · Puente festivo')
    expect(bloqueDe(dia('2026-03-30'))!.festivos).toEqual(['Jueves Santo', 'Viernes Santo'])
  })
})

describe('el puente de octubre — el caso que se va a enseñar', () => {
  it('desde principios de octubre apunta al 9, 4 días', () => {
    expect(resolver('2026-10-05')).toBe('vie 9 oct → mar 13 oct · 4 días · Puente festivo')
    expect(bloqueDe(dia('2026-10-05'))!.festivos).toEqual(['Diversidad Étnica'])
  })
})

describe('la regresión del umbral', () => {
  it('un lunes normal NO puede proponer un puente a mes y medio', () => {
    const b = bloqueDe(dia('2026-08-24'))!
    const distancia = (b.recogida.getTime() - dia('2026-08-24').getTime()) / 86_400_000
    expect(distancia).toBeLessThanOrEqual(7)
  })
})

/**
 * SCEN-B07 — la primera recogida rueda cuando las sedes ya cerraron.
 * Bogotá Centro cierra a las 16:00; el corte va a las 15:00 por el margen del
 * caché de una hora.
 */
describe('SCEN-B07 — el corte por hora de cierre', () => {
  const enBogota = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00.000-05:00`)

  it('por la mañana la primera recogida es hoy', () => {
    const r = primeraRecogida(enBogota('2026-08-27', '09:30'))
    expect(fmtCorto(r.fecha)).toBe('jue 27 ago')
    expect(r.rodo).toBe(false)
  })

  it('a las 14:59 todavía es hoy', () => {
    expect(primeraRecogida(enBogota('2026-08-27', '14:59')).rodo).toBe(false)
  })

  it('a las 15:00 ya rueda a mañana', () => {
    const r = primeraRecogida(enBogota('2026-08-27', '15:00'))
    expect(fmtCorto(r.fecha)).toBe('vie 28 ago')
    expect(r.rodo).toBe(true)
  })

  it('a las 17:30 — el caso del cliente que entra tarde — es mañana', () => {
    expect(fmtCorto(primeraRecogida(enBogota('2026-08-27', '17:30')).fecha)).toBe('vie 28 ago')
  })

  it('a las 23:00 sigue siendo el día siguiente, no dos días después', () => {
    expect(fmtCorto(primeraRecogida(enBogota('2026-08-27', '23:00')).fecha)).toBe('vie 28 ago')
  })
})
