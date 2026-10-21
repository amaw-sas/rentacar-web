import { formatQuoteDateTimeShort } from '../../useDateFunctions';
import { deriveFacts, money, planKm, plural, rowSuffix, trimmed, type QuoteTextInput } from './model';

export function buildAlquicarrosText(input: QuoteTextInput): string {
  const facts = deriveFacts(input);
  const { days, extraHours, monthly, babySeat } = input;

  const summary = [
    `${plural(days, 'día', 'días')}${facts.hasExtraHours ? ` + ${extraHours} h extra` : ''}`,
    facts.sharedPlan && `plan ${planKm(facts.sharedPlan)}/mes`,
    facts.quotableTotal ? 'Seguro Total' : 'Seguro básico',
  ]
    .filter(Boolean)
    .join(' · ');

  const mileage = !monthly
    ? 'km ilimitado'
    : facts.sharedPlan
      ? `${planKm(facts.sharedPlan)}/mes`
      : 'km del plan de cada gama';
  const includes = ['IVA', facts.hasExtraHours && 'horas extra', facts.returnFee && 'otra sede', mileage]
    .filter((x): x is string => typeof x === 'string')
    .join(', ');

  const lines: (string | false | null)[] = [
    'Tu cotización Alquicarros 👇',
    '',
    `${input.pickupBranch} → ${input.returnBranch}`,
    `${formatQuoteDateTimeShort(input.pickupDate, input.pickupTime)} → ${formatQuoteDateTimeShort(input.returnDate, input.returnTime)}`,
    summary,
    '',
    ...input.rows.map((row) => `• ${trimmed(row)} ${money(row.price)}${rowSuffix(input, facts, row)}`),
    '',
    `Incluye: ${includes}.`,
    babySeat &&
      (babySeat.monthly
        ? `+ Silla de bebé ${money(babySeat.total)} el mes (pagas al recoger)`
        : `+ Silla de bebé ${money(babySeat.total)} (pagas al recoger)`),
    'Precio por 20 min.',
    '',
    'Sin pagos hoy · sin cupo bloqueado · cancelas gratis · pagas al recoger · reservas con 4 datos · precio congelado.',
  ];
  return lines.filter((l): l is string => typeof l === 'string').join('\n');
}
