import { describe, it, expect } from 'vitest';
import { latestOpenDayOnOrBefore } from '../scheduleAvailability';
import {
  MAX_RENTAL_DAYS,
  createDateFromString,
  createDateTimeFromString,
  rentalDayCount,
} from '../useDateFunctions';
import type { LocationSchedule } from '../index';

// Holdout: docs/specs/max-rental-days/scenarios/max-rental-days.scenarios.md
//
// Regla dura: un alquiler no puede superar MAX_RENTAL_DAYS días FACTURABLES
// (rentalDayCount, que suma un día cuando el sobrante pasa GRACE_HOURS = 4).
//
// nearestOpenDay prueba primero hacia ADELANTE, así que recortar la devolución a
// pickup+30 sobre un día cerrado saltaría a +31 y volvería a violar el tope. De ahí
// latestOpenDayOnOrBefore: el gemelo que solo retrocede.

// Sede de referencia: lun-vie 08:00-18:00, sáb 08:00-13:00, dom y festivos cerrado.
const A: LocationSchedule = {
  mon: ['08:00-18:00'], tue: ['08:00-18:00'], wed: ['08:00-18:00'],
  thu: ['08:00-18:00'], fri: ['08:00-18:00'], sat: ['08:00-13:00'],
  sun: [], hol: [],
};

// 2026: Jan 1 = jueves. 2026-01-04 = domingo; 2026-01-05 = lunes.
const SUNDAY = createDateFromString('2026-01-04');
const MONDAY = createDateFromString('2026-01-05');
const SATURDAY = createDateFromString('2026-01-10');

describe('MAX_RENTAL_DAYS', () => {
  it('es 30 — el tope de negocio, en un solo sitio', () => {
    expect(MAX_RENTAL_DAYS).toBe(30);
  });
});

describe('latestOpenDayOnOrBefore', () => {
  it('devuelve el mismo día cuando ya está abierto', () => {
    const floor = createDateFromString('2026-01-01');
    expect(latestOpenDayOnOrBefore(A, MONDAY, floor)?.toString()).toBe('2026-01-05');
  });

  it('RETROCEDE desde un día cerrado, nunca avanza', () => {
    // Domingo 4 cerrado → sábado 3 (abierto). Avanzar daría lunes 5, que excede el tope.
    const floor = createDateFromString('2026-01-01');
    expect(latestOpenDayOnOrBefore(A, SUNDAY, floor)?.toString()).toBe('2026-01-03');
  });

  it('atraviesa una cadena de días cerrados', () => {
    // Sábado 10 abierto; forzamos una sede que solo abre lunes-viernes.
    const weekdaysOnly: LocationSchedule = { ...A, sat: [], sun: [], hol: [] };
    const floor = createDateFromString('2026-01-01');
    // Sábado 10 cerrado, domingo 11 no aplica (retrocedemos) → viernes 9.
    expect(latestOpenDayOnOrBefore(weekdaysOnly, SATURDAY, floor)?.toString()).toBe('2026-01-09');
  });

  it('devuelve null si no hay día abierto en o antes del floor', () => {
    const closed: LocationSchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [], hol: [] };
    const floor = createDateFromString('2026-01-03');
    expect(latestOpenDayOnOrBefore(closed, SUNDAY, floor)).toBeNull();
  });

  it('nunca devuelve una fecha anterior al floor', () => {
    const floor = createDateFromString('2026-01-05'); // lunes: el propio floor
    // Domingo 4 está por debajo del floor → no hay candidato válido.
    expect(latestOpenDayOnOrBefore(A, SUNDAY, floor)).toBeNull();
  });

  it('una sede sin horario configurado es permisiva: el día pedido sirve', () => {
    const floor = createDateFromString('2026-01-01');
    expect(latestOpenDayOnOrBefore(undefined, SUNDAY, floor)?.toString()).toBe('2026-01-04');
  });

  it('con floor = pickup + 1, una sede cerrada toda la ventana devuelve null, no la recogida', () => {
    // La ventana [pickup+1, pickup+30] entera cerrada. Devolver `pickup` daría una
    // reserva de 0 días facturables; el caller prefiere null y conserva el techo.
    const allClosed: LocationSchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [], hol: [] };
    const pickup = createDateFromString('2026-08-15');
    const floor = pickup.copy().add({ days: 1 });
    const ceiling = pickup.copy().add({ days: 30 });
    expect(latestOpenDayOnOrBefore(allClosed, ceiling, floor)).toBeNull();
  });

  it('el floor corta el retroceso antes de agotar maxRadius', () => {
    const closedExceptPickup: LocationSchedule = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [], hol: [],
    };
    const pickup = createDateFromString('2026-08-15');
    const floor = pickup.copy().add({ days: 1 });
    // Aun con un radio absurdo, nunca baja del floor.
    expect(latestOpenDayOnOrBefore(closedExceptPickup, pickup.copy().add({ days: 30 }), floor, 999)).toBeNull();
  });
});

describe('rentalDayCount — la frontera de MAX_RENTAL_DAYS', () => {
  const pickup = createDateTimeFromString('2026-08-15T12:00:00');

  it('30 días exactos a la misma hora cuentan 30', () => {
    expect(rentalDayCount(pickup, createDateTimeFromString('2026-09-14T12:00:00'))).toBe(30);
  });

  it('devolver antes de la hora de recogida el día 30 sigue contando 30', () => {
    expect(rentalDayCount(pickup, createDateTimeFromString('2026-09-14T10:00:00'))).toBe(30);
  });

  it('+4h sobre el día 30 (la ventana de gracia) sigue contando 30', () => {
    expect(rentalDayCount(pickup, createDateTimeFromString('2026-09-14T16:00:00'))).toBe(30);
  });

  it('+5h sobre el día 30 rompe la gracia y cuenta 31 — el bug del holdout', () => {
    expect(rentalDayCount(pickup, createDateTimeFromString('2026-09-14T17:00:00'))).toBe(31);
  });

  it('un día natural de más cuenta 31', () => {
    expect(rentalDayCount(pickup, createDateTimeFromString('2026-09-15T12:00:00'))).toBe(31);
  });
});
