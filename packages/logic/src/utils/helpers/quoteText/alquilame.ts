import { formatQuoteDateTime } from '../../useDateFunctions';
import { abbreviatedName, deriveFacts, money, plural, rowSuffix, seatPriceText, type QuoteTextInput, type QuoteTextRow } from './model';

const emoji = (row: QuoteTextRow): string => (/^camioneta\b/i.test(row.description.trim()) ? '🚙' : '🚗');

export function buildAlquilameText(input: QuoteTextInput): string {
  const facts = deriveFacts(input);
  const { days, extraHours, monthly, optionalExtras } = input;

  const quantity = `${plural(days, 'día', 'días')}${facts.hasExtraHours ? ` + ${plural(extraHours, 'hora', 'horas')} extra` : ''}`;
  const mileage = !monthly
    ? 'Ilimitado'
    : facts.sharedPlan
      ? `${facts.sharedPlan === '1k_kms' ? '1.000' : '2.000'} km al mes`
      : 'Según el plan de cada gama';

  const optional: string[] = optionalExtras
    ? [
        '',
        '*OPCIONALES*',
        '*Silla de bebé:*',
        seatPriceText(optionalExtras.babySeat, days),
        '*Lavada pago anticipado:*',
        money(optionalExtras.washPrice),
      ]
    : [];

  const lines: (string | false)[] = [
    'Esta es tu cotización:',
    '',
    '📍*Recoges:*',
    input.pickupBranch,
    formatQuoteDateTime(input.pickupDate, input.pickupTime),
    '📍*Entregas:*',
    input.returnBranch,
    formatQuoteDateTime(input.returnDate, input.returnTime),
    '',
    ...input.rows.flatMap((row) => [
      `${emoji(row)} ${abbreviatedName(row)}`,
      `*${money(row.price)}*${rowSuffix(input, facts, row)}`,
    ]),
    '',
    `*Cantidad:* ${quantity}`,
    `*Seguro:* ${facts.quotableTotal ? 'Seguro Total' : 'Seguro básico'}`,
    '*Impuestos:* Incluye IVA y Tax',
    facts.returnFee && '*Devolución en otra sede:* Incluida en el precio',
    `*Kilometraje:* ${mileage}`,
    '*Precio:* Se mantiene 20 minutos, luego debes recotizar',
    ...optional,
    '',
    '*Con Alquilame:*',
    '✅ Reservas con 4 datos y congelas el precio',
    '✅ No pagas nada hoy y no bloqueamos cupo de tarjeta',
    '✅ Cancelas cuando quieras y pagas al recoger',
  ];
  return lines.filter((l): l is string => typeof l === 'string').join('\n');
}
