import type { MonthlyMileage } from '../types/type/MonthlyMileage';

// Texto de cotización para copiar y pegar en WhatsApp (modo asesor). Módulo puro:
// recibe valores ya resueltos —precios con IVA y fechas ya formateadas— y solo
// compone líneas. El cálculo de precios vive en el composable que lo llama.

export interface QuoteTextRow {
  code: string;
  /** Se recorta aquí; el llamador la pasa tal cual. */
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
  /** Ya formateado con formatQuoteDateTime. */
  pickupDateTime: string;
  returnDateTime: string;
  /** 30 en mensual. */
  days: number;
  /** 0 cuando no hay. */
  extraHours: number;
  monthly: boolean;
  /** Estado del checkbox. */
  totalCoverage: boolean;
  rows: QuoteTextRow[];
  babySeat: null | { total: number; dailyPrice: number; monthly: boolean };
}

const SEP = '    ';

const BENEFITS = [
  '*Beneficios de reservar*',
  '1. Reservas con 4 datos.',
  '2. Congelas el precio.',
  '3. No realizas ningún pago.',
  '4. Cancelas cuando quieras.',
  '5. No bloqueamos cupo de tarjeta.',
  '6. Pagas al recoger el carro.',
];

// Agrupación de miles manual: Intl con 'es-CO' no agrupa los números de 4 cifras
// ("2500"), y la cotización debe leerse igual para $2.500 que para $25.000.
const money = (value: number): string =>
  `$${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

const planLabel = (plan: '1k_kms' | '2k_kms'): string => (plan === '1k_kms' ? '1.000 km' : '2.000 km');

function coverageLabel(quotableTotal: boolean, partialTotal: boolean): string {
  if (partialTotal) return 'Seguro Total (salvo las gamas marcadas «sin Seguro Total»)';
  if (quotableTotal) return 'Seguro Total';
  return 'seguro básico';
}

// El plan mensual trae un tope de km: en mensual el pie no promete kilometraje ilimitado.
function mileageLabel(monthly: boolean, sharedPlan: QuoteTextRow['plan']): string {
  if (!monthly) return 'kilometraje ilimitado';
  if (sharedPlan) return `${planLabel(sharedPlan)} al mes`;
  return 'los km del plan de cada gama';
}

export function buildQuoteText(input: QuoteTextInput): string {
  const { pickupBranch, returnBranch, days, extraHours, monthly, rows, babySeat } = input;
  const differentBranch = pickupBranch !== returnBranch;

  const quotableTotal = input.totalCoverage && rows.some((row) => !row.withoutTotalCoverage);
  const partialTotal = quotableTotal && rows.some((row) => row.withoutTotalCoverage);
  const coverage = coverageLabel(quotableTotal, partialTotal);

  const sharedPlan =
    monthly && rows.length > 0 && rows.every((row) => row.plan === rows[0]!.plan) ? rows[0]!.plan : undefined;

  const mileage = mileageLabel(monthly, sharedPlan);

  const totalHeader = `*Total: ${plural(days, 'día', 'días')}${extraHours > 0 ? ` y ${plural(extraHours, 'hora', 'horas')} extra` : ''}*`;

  const lines: (string | false | null | undefined)[] = [
    '*Recoges:*',
    pickupBranch,
    input.pickupDateTime,
    '',
    '*Entregas:*',
    returnBranch,
    input.returnDateTime,
    '',
    totalHeader,
    '',
    'cotización',
    `${days} día(s)${extraHours > 0 ? ` + ${extraHours} hora(s) extra` : ''}`,
    differentBranch ? `· Recoge en ${pickupBranch}, entrega en ${returnBranch}` : `· ${pickupBranch}`,
    sharedPlan && `· Plan mensual de ${planLabel(sharedPlan)}`,
    quotableTotal && '· Con Seguro Total (deducible $0)',
    ...rows.map((row) => {
      const planSuffix = monthly && !sharedPlan && row.plan ? ` (plan ${planLabel(row.plan)})` : '';
      const noTotalSuffix = input.totalCoverage && row.withoutTotalCoverage ? ' (sin Seguro Total)' : '';
      return [row.code, row.description.trim(), `${money(row.price)}${planSuffix}${noTotalSuffix}`].join(SEP);
    }),
    extraHours > 0 && 'Cada precio incluye las horas extra.',
    differentBranch && 'Cada precio incluye el cargo por entregar en otra sede.',
    babySeat &&
      (babySeat.monthly
        ? `Silla de bebé: ${money(babySeat.total)} el mes, se paga al recoger.`
        : `Silla de bebé: ${money(babySeat.total)} (${plural(days, 'día', 'días')} × ${money(babySeat.dailyPrice)}), se paga al recoger.`),
    'Esta cotización estará disponible durante 20 minutos; luego se debe recotizar.',
    `Los precios son dinámicos e incluyen IVA, ${coverage} y ${mileage}.`,
    '',
    ...BENEFITS,
  ];

  return lines.filter((line): line is string => typeof line === 'string').join('\n');
}
