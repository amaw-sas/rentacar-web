// SCEN-008/009/010: the approved texts live in design.md; this ties each template to them.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it, expect } from 'vitest';
import { buildBrandQuoteText } from './index';

const design = readFileSync(resolve(__dirname, '../../../../../../docs/specs/cotizacion-por-asesor/design.md'), 'utf8');
const block = (h: string) => design.split(`### ${h}\n\n\`\`\`\n`)[1]!.split('\n```')[0]!;
const input = {
  pickupBranch: 'Cali Aeropuerto', returnBranch: 'Cali Norte Chipichape',
  pickupDate: '2026-10-23', pickupTime: '07:30', returnDate: '2026-10-25', returnTime: '10:30',
  days: 2, extraHours: 3, monthly: false, totalCoverage: true, returnFee: true,
  rows: [
    { description: 'Económico', price: 668810 },
    { description: 'Sedán', price: 932301 },
    { description: 'Camioneta', price: 1894620 },
  ],
  babySeat: { total: 30000, dailyPrice: 15000, monthly: false },
};
for (const [h, f] of [['Alquilame', 'alquilame'], ['Alquilatucarro', 'alquilatucarro'], ['Alquicarros', 'alquicarros']] as const) {
  it(`${h} reproduces the owner-approved text in design.md byte for byte`, () => {
    const expected = block(h).replace(/\$XX\.XXX COP \(2 días × \$XX\.XXX COP\)/, '$30.000 COP (2 días × $15.000 COP)').replace(/\$XX\.XXX/g, '$30.000');
    expect(buildBrandQuoteText(input as never, f)).toBe(expected);
  });
}
