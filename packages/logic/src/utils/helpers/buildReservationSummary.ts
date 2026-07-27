import type { MonthlyMileage } from '../types/type/MonthlyMileage';

// Issue #368 hallazgo 1 — snapshot inmutable de lo reservado, congelado en el
// submit. Los datos de la reserva nunca llegan del servidor (el endpoint solo
// devuelve `{ exists }`), así que la confirmación los lee de este snapshot en
// sesión. Ver docs/specs/2026-07-27-issue-368-confirmacion-design.md.

/** Campos del formulario ya resueltos por el llamador (con `.value` en submitForm). */
export interface ReservationSummaryFields {
  pickupDate: string | null;
  pickupTime: string | null;
  returnDate: string | null;
  returnTime: string | null;
  /** Nombre de sede (BranchData.name), no el objeto ni el código. */
  pickupBranch: string | null;
  pickupCity: string | null;
  returnBranch: string | null;
  returnCity: string | null;
  days: number | null;
  haveTotalInsurance: boolean;
  haveMonthlyReservation: boolean;
  monthlyMileage: MonthlyMileage | null;
}

/**
 * Nombre y total se toman de la instancia viva de useCategory
 * (`useStoreSearchData().selectedCategory`). Se tipan YA DESENVUELTOS: ese ref
 * es profundo, así que en runtime `.value` auto-desenvuelve los refs anidados y
 * el tipo (UnwrapRef) también — leerlos con `.value` daría `undefined` y además
 * error de tipo. Patrón de WizardSummary.vue:296.
 */
export interface ReservationSummaryCategory {
  categoryDescription: string;
  currencyTotalToPayWithAdditionals: string;
}

export interface ReservationSummary extends ReservationSummaryFields {
  /** El código de reserva del backend (bearer de la URL /reservado/{code}). */
  code: string;
  categoryName: string | null;
  total: string | null;
}

/**
 * Congela el snapshot. `categoryName`/`total` caen a `null` si no hay categoría
 * viva; la confirmación oculta el recap por completitud en vez de pintar
 * `undefined`.
 */
export function buildReservationSummary(
  code: string,
  category: ReservationSummaryCategory | null | undefined,
  fields: ReservationSummaryFields,
): ReservationSummary {
  return {
    code,
    categoryName: category?.categoryDescription ?? null,
    total: category?.currencyTotalToPayWithAdditionals ?? null,
    ...fields,
  };
}
