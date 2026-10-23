// SCEN-008/009/010: the approved texts live in design.md; this ties each template to them.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it, expect } from 'vitest';
import { buildBrandQuoteText } from './index';

const design = readFileSync(resolve(__dirname, '../../../../../../docs/specs/cotizacion-por-asesor/design.md'), 'utf8');
// First fenced block after the heading (Alquilatucarro has prose before it).
const block = (h: string) => {
  const section = design.split(`### ${h}\n`)[1]!;
  const open = section.indexOf('```\n');
  return section.slice(open + 4).split('\n```')[0]!;
};
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
const alquilatucarroInput = {
  pickupBranch: 'Barranquilla Aeropuerto', returnBranch: 'Barranquilla Aeropuerto',
  pickupDate: '2026-10-23', pickupTime: '12:00', returnDate: '2026-10-30', returnTime: '12:00',
  days: 7, extraHours: 0, monthly: false, totalCoverage: true, returnFee: false,
  rows: [
    ['Compacto Mecánico', 1608195], ['Compacto Automático', 1692194], ['Sedán Mecánico', 1720824],
    ['Sedán Automático', 1909824], ['Sedán Automático Híbrido', 2147824], ['Camioneta Mecánica 4X4', 2740150],
    ['Camioneta Automática Híbrida', 3635639], ['Camioneta Automática Híbrida 7 puestos', 4258639],
    ['Camioneta Automática', 3397639],
  ].map(([description, price]) => ({ description, price })),
  babySeat: null,
  optionalExtras: { babySeat: { total: 84000, dailyPrice: 12000, monthly: false }, washPrice: 20000 },
};
it('Alquilatucarro reproduces the owner-approved text in design.md byte for byte', () => {
  expect(buildBrandQuoteText(alquilatucarroInput as never, 'alquilatucarro')).toBe(block('Alquilatucarro'));
});
for (const [h, f] of [['Alquilame', 'alquilame'], ['Alquicarros', 'alquicarros']] as const) {
  it(`${h} reproduces the owner-approved text in design.md byte for byte`, () => {
    const expected = block(h).replace(/\$XX\.XXX COP \(2 días × \$XX\.XXX COP\)/, '$30.000 COP (2 días × $15.000 COP)').replace(/\$XX\.XXX/g, '$30.000');
    expect(buildBrandQuoteText(input as never, f)).toBe(expected);
  });
}
