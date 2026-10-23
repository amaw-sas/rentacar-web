import type { MonthlyMileage } from '../../types/type/MonthlyMileage';

// Modelo común de las cotizaciones por marca. Módulo puro: recibe valores ya
// resueltos (precios con IVA, fechas crudas) y cada plantilla formatea lo suyo.

export type QuoteFranchise = 'alquilame' | 'alquilatucarro' | 'alquicarros';

export interface QuoteTextRow {
  /** Descripción de la gama que muestra la tarjeta, sin el código. */
  description: string;
  /** COP con IVA. */
  price: number;
  /** Seguro Total pedido pero no cotizable para esta fila. */
  withoutTotalCoverage?: boolean;
  /** Solo mensual. */
  plan?: Extract<MonthlyMileage, '1k_kms' | '2k_kms'>;
}

export interface QuoteTextInput {
  pickupBranch: string;
  returnBranch: string;
  /** YYYY-MM-DD */
  pickupDate: string;
  /** HH:mm o HH:mm:ss */
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  /** 30 en mensual. */
  days: number;
  /** 0 cuando no hay. */
  extraHours: number;
  monthly: boolean;
  /** Alguna gama cobra cargo por devolver en otra sede. */
  returnFee: boolean;
  /** Estado del checkbox. */
  totalCoverage: boolean;
  rows: QuoteTextRow[];
  babySeat: null | { total: number; dailyPrice: number; monthly: boolean };
  /** Silla y lavado del catálogo, siempre calculados (la plantilla de Alquilatucarro los muestra sin casilla). */
  optionalExtras?: null | {
    babySeat: { total: number; dailyPrice: number; monthly: boolean };
    washPrice: number;
  };
}

export interface QuoteFacts {
  hasExtraHours: boolean;
  /** Cargo por devolver en otra sede (no basta con que los nombres difieran). */
  returnFee: boolean;
  /** Seguro Total pedido y cotizable en al menos una gama. */
  quotableTotal: boolean;
  /** Seguro Total solo en algunas gamas. */
  partialTotal: boolean;
  /** Plan mensual común a todas las gamas, si lo hay. */
  sharedPlan: QuoteTextRow['plan'];
}

export function deriveFacts(input: QuoteTextInput): QuoteFacts {
  const { rows, monthly } = input;
  const quotableTotal = input.totalCoverage && rows.some((row) => !row.withoutTotalCoverage);
  return {
    hasExtraHours: input.extraHours > 0,
    returnFee: input.returnFee,
    quotableTotal,
    partialTotal: quotableTotal && rows.some((row) => row.withoutTotalCoverage),
    sharedPlan:
      monthly && rows.length > 0 && rows.every((row) => row.plan === rows[0]!.plan) ? rows[0]!.plan : undefined,
  };
}

// Agrupación de miles manual: Intl con 'es-CO' no agrupa los números de 4 cifras.
export const money = (value: number): string =>
  `$${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;

export const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export const planKm = (plan: NonNullable<QuoteTextRow['plan']>): string =>
  plan === '1k_kms' ? '1.000 km' : '2.000 km';

/** Sufijos por fila comunes a las 3 marcas: plan propio y gama sin Seguro Total. */
export function rowSuffix(input: QuoteTextInput, facts: QuoteFacts, row: QuoteTextRow): string {
  const plan = input.monthly && !facts.sharedPlan && row.plan ? ` (plan ${planKm(row.plan)})` : '';
  const noTotal = input.totalCoverage && row.withoutTotalCoverage ? ' (sin Seguro Total)' : '';
  return `${plan}${noTotal}`;
}

/** «a, b y c» */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

export const trimmed = (row: QuoteTextRow): string => row.description.trim();
