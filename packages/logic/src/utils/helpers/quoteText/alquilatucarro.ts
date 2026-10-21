import { formatQuoteDateTime } from '../../useDateFunctions';
import { deriveFacts, joinList, money, planKm, plural, rowSuffix, trimmed, type QuoteTextInput } from './model';

export function buildAlquilatucarroText(input: QuoteTextInput): string {
  const facts = deriveFacts(input);
  const { days, extraHours, monthly, babySeat } = input;

  const duration = [
    `${plural(days, 'día', 'días')}${facts.hasExtraHours ? ` + ${plural(extraHours, 'hora', 'horas')} extra` : ''}`,
    facts.sharedPlan && `plan de ${planKm(facts.sharedPlan)} al mes`,
  ]
    .filter(Boolean)
    .join(', ');

  const mileage = !monthly
    ? 'kilometraje ilimitado'
    : facts.sharedPlan
      ? `${planKm(facts.sharedPlan)} al mes`
      : 'los km del plan de cada gama';
  const extras = [facts.hasExtraHours && 'las horas extra', facts.returnFee && 'el cargo por devolver en otra sede']
    .filter((x): x is string => typeof x === 'string');
  const includes =
    extras.length > 0 ? `Ya suman ${joinList([...extras, mileage])}.` : `Incluyen ${mileage}.`;

  const lines: (string | false | null)[] = [
    'Buen día. Le comparto la cotización solicitada:',
    '',
    '*RECOGIDA*',
    input.pickupBranch,
    formatQuoteDateTime(input.pickupDate, input.pickupTime),
    '',
    '*DEVOLUCIÓN*',
    input.returnBranch,
    formatQuoteDateTime(input.returnDate, input.returnTime),
    '',
    `*Duración:* ${duration}`,
    `*Cobertura:* ${facts.quotableTotal ? 'Seguro Total' : 'Seguro básico'}`,
    '',
    '*Opciones disponibles*',
    ...input.rows.map((row, i) => `${i + 1}) ${trimmed(row)}: ${money(row.price)}${rowSuffix(input, facts, row)}`),
    '',
    `Valores con IVA incluido. ${includes}`,
    babySeat &&
      (babySeat.monthly
        ? `Silla de bebé (opcional): ${money(babySeat.total)} el mes, se paga en la oficina.`
        : `Silla de bebé (opcional): ${money(babySeat.total)} por el alquiler, se paga en la oficina.`),
    'Precios dinámicos, válidos por 20 minutos.',
    '',
    '*¿Por qué reservar con Alquilatucarro?*',
    '- Solo necesita 4 datos',
    '- El precio queda congelado',
    '- No paga nada por adelantado',
    '- Puede cancelar sin costo',
    '- No bloqueamos cupo en su tarjeta',
    '- Paga al recoger el vehículo',
  ];
  return lines.filter((l): l is string => typeof l === 'string').join('\n');
}
