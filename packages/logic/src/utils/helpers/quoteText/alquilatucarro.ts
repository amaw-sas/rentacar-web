import { formatQuoteDateTime } from '../../useDateFunctions';
import { deriveFacts, money, plural, rowSuffix, trimmed, type QuoteTextInput, type QuoteTextRow } from './model';

// Solo las camionetas abrevian la transmisión: «Camioneta Mecánica 4X4» -> «Camioneta MT 4X4».
function rowName(row: QuoteTextRow): string {
  const name = trimmed(row);
  if (!/^camioneta\b/i.test(name)) return name;
  return name.replace(/\bMec[aá]nic[ao]\b/gi, 'MT').replace(/\bAutom[aá]tic[ao]\b/gi, 'AT');
}

export function buildAlquilatucarroText(input: QuoteTextInput): string {
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
        '*OPCIONAL*',
        '*Silla de bebé:*',
        `${money(optionalExtras.babySeat.total)} ${
          optionalExtras.babySeat.monthly ? 'por el mes' : `por ${plural(days, 'día', 'días')}`
        }`,
        '*Lavada prepagada:*',
        money(optionalExtras.washPrice),
      ]
    : [];

  const lines: (string | false)[] = [
    'Le comparto la cotización solicitada:',
    '',
    '*RECOGIDA*',
    input.pickupBranch,
    formatQuoteDateTime(input.pickupDate, input.pickupTime),
    '*DEVOLUCIÓN*',
    input.returnBranch,
    formatQuoteDateTime(input.returnDate, input.returnTime),
    '',
    ...input.rows.flatMap((row) => [`*${rowName(row)}:*`, `${money(row.price)}${rowSuffix(input, facts, row)}`]),
    '',
    `*Cantidad:* ${quantity}`,
    `*Seguro:* ${facts.quotableTotal ? 'Total' : 'Básico'}`,
    '*Impuestos:* Incluidos',
    facts.returnFee && '*Devolución en otra sede:* Incluida en el precio',
    `*Kilometraje:* ${mileage}`,
    '*Precios:* Dinámicos, válidos por 20 minutos.',
    ...optional,
    '',
    '*¿Por qué reservar con Alquilatucarro?*',
    '•  El precio queda congelado',
    '•  No paga nada por adelantado',
    '•  Puede cancelar sin costo',
    '•  No bloqueamos cupo en su tarjeta',
    '•  Paga al recoger el vehículo',
  ];
  return lines.filter((l): l is string => typeof l === 'string').join('\n');
}
