import { formatQuoteDateTime } from '../../useDateFunctions';
import { deriveFacts, joinList, money, planKm, plural, rowSuffix, trimmed, type QuoteTextInput } from './model';

export function buildAlquilameText(input: QuoteTextInput): string {
  const facts = deriveFacts(input);
  const { days, extraHours, monthly, babySeat } = input;

  const duration = [
    `${plural(days, 'día', 'días')}${facts.hasExtraHours ? ` y ${plural(extraHours, 'hora', 'horas')} extra` : ''}`,
    facts.sharedPlan && `plan de ${planKm(facts.sharedPlan)} al mes`,
    `con ${facts.quotableTotal ? 'Seguro Total' : 'seguro básico'}`,
  ]
    .filter(Boolean)
    .join(', ');

  const mileage = !monthly
    ? 'kilometraje ilimitado'
    : facts.sharedPlan
      ? `${planKm(facts.sharedPlan)} al mes`
      : 'los km del plan de cada gama';
  const includes = [
    'IVA',
    facts.hasExtraHours && 'las horas extra',
    facts.returnFee && 'la entrega en otra sede',
    mileage,
  ].filter((x): x is string => typeof x === 'string');

  const lines: (string | false | null)[] = [
    '¡Hola! Esta es tu cotización en Alquilame 🚗',
    '',
    `📍 *Recoges:* ${input.pickupBranch}, ${formatQuoteDateTime(input.pickupDate, input.pickupTime)}`,
    `📍 *Entregas:* ${input.returnBranch}, ${formatQuoteDateTime(input.returnDate, input.returnTime)}`,
    `⏱️ ${duration}`,
    '',
    ...input.rows.map((row) => `🚙 ${trimmed(row)} — *${money(row.price)}*${rowSuffix(input, facts, row)}`),
    '',
    `El precio ya incluye ${joinList(includes)}.`,
    babySeat &&
      (babySeat.monthly
        ? `Silla de bebé: ${money(babySeat.total)} el mes, se paga al recoger.`
        : `Silla de bebé: ${money(babySeat.total)} (${plural(days, 'día', 'días')} × ${money(babySeat.dailyPrice)}), se paga al recoger.`),
    '⚠️ Este precio se mantiene 20 minutos.',
    '',
    '*Con Alquilame:*',
    '✅ Reservas con 4 datos y congelas el precio',
    '✅ No pagas nada hoy y no bloqueamos cupo de tarjeta',
    '✅ Cancelas cuando quieras y pagas al recoger',
  ];
  return lines.filter((l): l is string => typeof l === 'string').join('\n');
}
