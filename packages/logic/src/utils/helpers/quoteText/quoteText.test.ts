import { describe, it, expect } from 'vitest';
import { buildBrandQuoteText, type QuoteFranchise, type QuoteTextInput } from './index';

const BRANDS: QuoteFranchise[] = ['alquilame', 'alquilatucarro', 'alquicarros'];
type OldBrand = 'alquicarros';
const OLD_BRANDS: OldBrand[] = ['alquicarros'];

const base: QuoteTextInput = {
  pickupBranch: 'Cali Aeropuerto',
  returnBranch: 'Cali Norte Chipichape',
  pickupDate: '2026-10-23',
  pickupTime: '07:30:00',
  returnDate: '2026-10-25',
  returnTime: '10:30',
  days: 2,
  extraHours: 3,
  monthly: false,
  totalCoverage: true,
  returnFee: true,
  rows: [
    { description: 'Económico', price: 668810 },
    { description: 'Sedán', price: 932301 },
    { description: 'Camioneta', price: 1894620 },
  ],
  babySeat: { total: 30000, dailyPrice: 15000, monthly: false },
  optionalExtras: { babySeat: { total: 30000, dailyPrice: 15000, monthly: false }, washPrice: 20000 },
};

const make = (over: Partial<QuoteTextInput> = {}): QuoteTextInput => ({ ...base, ...over });
const text = (b: QuoteFranchise, over: Partial<QuoteTextInput> = {}) => buildBrandQuoteText(make(over), b);

const ALQUILAME = `Esta es tu cotización:

📍*Recoges:*
Cali Aeropuerto
viernes 23 oct. 7:30am
📍*Entregas:*
Cali Norte Chipichape
domingo 25 oct. 10:30am

🚗 Económico
*$668.810 COP*
🚗 Sedán
*$932.301 COP*
🚙 Camioneta
*$1.894.620 COP*

*Cantidad:* 2 días + 3 horas extra
*Seguro:* Seguro Total
*Impuestos:* Incluye IVA y Tax
*Devolución en otra sede:* Incluida en el precio
*Kilometraje:* Ilimitado
*Precio:* Se mantiene 20 minutos, luego debes recotizar

*OPCIONALES*
*Silla de bebé:*
$30.000 COP por 2 días
*Lavada pago anticipado:*
$20.000 COP

*Con Alquilame:*
✅ Reservas con 4 datos y congelas el precio
✅ No pagas nada hoy y no bloqueamos cupo de tarjeta
✅ Cancelas cuando quieras y pagas al recoger`;

const ALQUICARROS = `Tu cotización Alquicarros 👇

Cali Aeropuerto → Cali Norte Chipichape
vie 23 oct. 7:30am → dom 25 oct. 10:30am
2 días + 3 h extra · Seguro Total

• Económico $668.810 COP
• Sedán $932.301 COP
• Camioneta $1.894.620 COP

Incluye: IVA, horas extra, otra sede, km ilimitado.
+ Silla de bebé $30.000 COP (pagas al recoger)
Precio por 20 min.

Sin pagos hoy · sin cupo bloqueado · cancelas gratis · pagas al recoger · reservas con 4 datos · precio congelado.`;

describe('approved fixtures (SCEN-008/009/010)', () => {
  it('alquilame', () => expect(text('alquilame')).toBe(ALQUILAME));
  it('alquicarros', () => expect(text('alquicarros')).toBe(ALQUICARROS));
});

const sameBranch = { returnBranch: 'Cali Aeropuerto', returnFee: false };
const monthlyRows = (plans: ('1k_kms' | '2k_kms')[]) =>
  plans.map((plan, i) => ({ description: ['Económico', 'Sedán', 'Camioneta'][i]!, price: 1000000 + i, plan }));

interface Case {
  name: string;
  over: Partial<QuoteTextInput>;
  expected: Record<OldBrand, string[]>;
  absent?: Record<OldBrand, string[]>;
}

const cases: Case[] = [
  {
    name: 'sin Seguro Total',
    over: { totalCoverage: false },
    expected: {
      alquicarros: ['2 días + 3 h extra · Seguro básico'],
    },
    absent: { alquicarros: ['Seguro Total'] },
  },
  {
    name: 'Seguro Total en algunas gamas',
    over: { rows: [{ description: 'Económico', price: 668810 }, { description: 'Sedán', price: 932301, withoutTotalCoverage: true }] },
    expected: {
      alquicarros: ['• Económico $668.810 COP\n', '• Sedán $932.301 COP (sin Seguro Total)', 'Seguro Total'],
    },
  },
  {
    name: 'sin horas extra',
    over: { extraHours: 0 },
    expected: {
      alquicarros: ['2 días · Seguro Total', 'Incluye: IVA, otra sede, km ilimitado.'],
    },
    absent: { alquicarros: ['h extra', 'horas'] },
  },
  {
    name: 'misma sede',
    over: sameBranch,
    expected: {
      alquicarros: ['Cali Aeropuerto → Cali Aeropuerto', 'Incluye: IVA, horas extra, km ilimitado.'],
    },
    absent: { alquicarros: ['otra sede'] },
  },
  {
    name: 'ni horas extra ni otra sede',
    over: { extraHours: 0, ...sameBranch },
    expected: {
      alquicarros: ['Incluye: IVA, km ilimitado.'],
    },
  },
  {
    name: 'mensual, mismo plan',
    over: { days: 30, extraHours: 0, monthly: true, rows: monthlyRows(['1k_kms', '1k_kms']), babySeat: null },
    expected: {
      alquicarros: ['30 días · plan 1.000 km/mes · Seguro Total', 'Incluye: IVA, otra sede, 1.000 km/mes.'],
    },
    absent: { alquicarros: ['ilimitado'] },
  },
  {
    name: 'mensual, planes distintos',
    over: { days: 30, extraHours: 0, monthly: true, rows: monthlyRows(['1k_kms', '2k_kms']), babySeat: null },
    expected: {
      alquicarros: ['$1.000.000 COP (plan 1.000 km)', '$1.000.001 COP (plan 2.000 km)', 'km del plan de cada gama.'],
    },
    absent: { alquicarros: ['ilimitado', 'plan 1.000 km/mes'] },
  },
  {
    name: 'silla mensual',
    over: { days: 30, monthly: true, rows: monthlyRows(['1k_kms']), babySeat: { total: 90000, dailyPrice: 3000, monthly: true } },
    expected: {
      alquicarros: ['+ Silla de bebé $90.000 COP el mes (pagas al recoger)'],
    },
    absent: { alquicarros: ['×'] },
  },
  {
    name: 'sin silla',
    over: { babySeat: null },
    expected: { alquicarros: [] },
    absent: { alquicarros: ['Silla'] },
  },
];

describe('variant table (SCEN-011)', () => {
  for (const c of cases) {
    for (const brand of OLD_BRANDS) {
      it(`${brand}: ${c.name}`, () => {
        const out = text(brand, c.over);
        for (const piece of c.expected[brand]) expect(out).toContain(piece);
        for (const piece of c.absent?.[brand] ?? []) expect(out).not.toContain(piece);
      });
    }
  }

  it('singular: 1 día + 1 hora extra', () => {
    expect(text('alquilame', { days: 1, extraHours: 1 })).toContain('*Cantidad:* 1 día + 1 hora extra');
    expect(text('alquilatucarro', { days: 1, extraHours: 1 })).toContain('*Cantidad:* 1 día + 1 hora extra');
    expect(text('alquicarros', { days: 1, extraHours: 1 })).toContain('1 día + 1 h extra');
  });

  it('formats 4-digit amounts with thousands separator', () => {
    expect(text('alquilame', { rows: [{ description: 'Económico', price: 2500 }] })).toContain('\n*$2.500 COP*\n');
  });
});

describe('SCEN-012: three different texts, same figures', () => {
  const out = BRANDS.map((b) => text(b));
  it('texts differ', () => {
    expect(new Set(out).size).toBe(3);
  });
  it('same price figures in all three', () => {
    for (const figure of ['$668.810 COP', '$932.301 COP', '$1.894.620 COP', '$30.000 COP']) {
      for (const o of out) expect(o).toContain(figure);
    }
  });
});

describe('guards', () => {
  const inputs = [make(), make({ totalCoverage: false }), make({ days: 30, monthly: true, rows: monthlyRows(['1k_kms', '2k_kms']) })];
  for (const brand of BRANDS) {
    it(`${brand}: no deducible, link or gama code`, () => {
      for (const input of inputs) {
        const out = buildBrandQuoteText(input, brand);
        expect(out.toLowerCase()).not.toContain('deducible');
        expect(out).not.toContain('http');
        expect(out).not.toMatch(/\b[A-Z]{1,3}\d? {2,}/); // code + column separator
        expect(out).not.toMatch(/\b(GL|GY|LU|FU|C|F|G|GC|LE)\b\s+(Económico|Sedán|Camioneta)/);
      }
    });
  }

  it('does not print a code even if the row carries one', () => {
    const rows = [{ description: 'Económico', price: 1000, code: 'C' } as never];
    for (const brand of BRANDS) {
      expect(buildBrandQuoteText(make({ rows }), brand)).not.toMatch(/\bC\b/);
    }
  });
});

describe('returnFee wording', () => {
  const sentence: Record<QuoteFranchise, string> = {
    alquilame: 'Devolución en otra sede',
    alquilatucarro: 'Devolución en otra sede',
    alquicarros: 'otra sede',
  };
  it.each(BRANDS)('%s: different branch without fee -> no other-branch item, header keeps both names', (b) => {
    const out = text(b, { returnFee: false });
    expect(out).not.toContain(sentence[b]);
    expect(out).toContain('Cali Aeropuerto');
    expect(out).toContain('Cali Norte Chipichape');
  });
  it.each(BRANDS)('%s: different branch with fee -> item present', (b) => {
    expect(text(b, { returnFee: true })).toContain(sentence[b]);
  });
});

describe('Alquilatucarro v3 (SCEN-021/022/023)', () => {
  const att = (over: Partial<QuoteTextInput> = {}) =>
    text('alquilatucarro', { returnBranch: 'Cali Aeropuerto', returnFee: false, extraHours: 0, ...over });
  const lines = (t: string) => t.split('\n');

  it('SCEN-021: only camionetas abbreviate MT/AT', () => {
    const rows = [
      'Compacto Mecánico', 'Sedán Automático', 'Camioneta Mecánica 4X4', 'Camioneta Automática Híbrida 7 puestos', 'Camioneta Automática',
    ].map((description, i) => ({ description, price: 1000 + i }));
    const out = lines(att({ rows }));
    for (const name of ['Compacto Mecánico', 'Sedán Automático', 'Camioneta MT 4X4', 'Camioneta AT Híbrida 7 puestos', 'Camioneta AT']) {
      expect(out).toContain(`*${name}:*`);
    }
    expect(att({ rows })).not.toContain('Camioneta Mecánica');
    expect(buildBrandQuoteText(make({ rows: [{ description: 'Camioneta Automática', price: 1 }] }), 'alquicarros')).toContain('Camioneta Automática');
  });

  it('SCEN-022: OPCIONAL always, daily seat and prepaid wash', () => {
    const out = att({ days: 7, babySeat: null, optionalExtras: { babySeat: { total: 84000, dailyPrice: 12000, monthly: false }, washPrice: 20000 } });
    expect(out).toContain('*OPCIONAL*\n*Silla de bebé:*\n$84.000 COP por 7 días\n*Lavada prepagada:*\n$20.000 COP\n');
  });

  it('SCEN-022: singular day and monthly seat', () => {
    const one = att({ days: 1, optionalExtras: { babySeat: { total: 12000, dailyPrice: 12000, monthly: false }, washPrice: 20000 } });
    expect(one).toContain('$12.000 COP por 1 día\n');
    const monthly = att({
      days: 30, extraHours: 0, monthly: true, rows: monthlyRows(['1k_kms']),
      optionalExtras: { babySeat: { total: 100000, dailyPrice: 12000, monthly: true }, washPrice: 25000 },
    });
    expect(monthly).toContain('$100.000 COP por el mes\n');
    expect(monthly).toContain('$25.000 COP\n');
  });

  it('SCEN-022: the catalog prices drive the text; null omits the section', () => {
    expect(att({ optionalExtras: { babySeat: { total: 2, dailyPrice: 1, monthly: false }, washPrice: 9000 } })).toContain('$9.000 COP');
    expect(att({ optionalExtras: null })).not.toContain('OPCIONAL');
  });

  it('SCEN-023: extra hours', () => {
    expect(att({ days: 7, extraHours: 3 })).toContain('*Cantidad:* 7 días + 3 horas extra\n');
    expect(att({ days: 7, extraHours: 1 })).toContain('*Cantidad:* 7 días + 1 hora extra\n');
  });

  it('SCEN-023: Seguro Total vs Básico', () => {
    expect(att()).toContain('*Seguro:* Total\n');
    expect(att({ totalCoverage: false })).toContain('*Seguro:* Básico\n');
    expect(att({ totalCoverage: false })).not.toContain('sin Seguro Total');
  });

  it('SCEN-023: a gama without Seguro Total is flagged after the price', () => {
    const rows = [{ description: 'Económico', price: 668810 }, { description: 'Sedán', price: 932301, withoutTotalCoverage: true }];
    const out = att({ rows });
    expect(out).toContain('*Económico:*\n$668.810 COP\n');
    expect(out).toContain('*Sedán:*\n$932.301 COP (sin Seguro Total)\n');
  });

  it('SCEN-023: other-branch fee line only with a fee, right after Impuestos', () => {
    const withFee = att({ returnFee: true });
    expect(withFee).toContain('*Impuestos:* Incluidos\n*Devolución en otra sede:* Incluida en el precio\n*Kilometraje:*');
    expect(att({ returnFee: false })).not.toContain('Devolución en otra sede');
    expect(att({ returnFee: false, returnBranch: 'Cali Norte Chipichape' })).not.toContain('Devolución en otra sede');
  });

  it('SCEN-023: monthly with one plan', () => {
    const out = att({ days: 30, monthly: true, rows: monthlyRows(['1k_kms', '1k_kms']) });
    expect(out).toContain('*Cantidad:* 30 días\n');
    expect(out).toContain('*Kilometraje:* 1.000 km al mes\n');
    expect(out).not.toContain('Ilimitado');
    expect(out).not.toContain('(plan');
  });

  it('SCEN-023: monthly with different plans, per-gama plan suffix before the sin-Seguro suffix', () => {
    const rows = [
      { description: 'Económico', price: 1000000, plan: '1k_kms' as const },
      { description: 'Sedán', price: 1000001, plan: '2k_kms' as const, withoutTotalCoverage: true },
    ];
    const out = att({ days: 30, monthly: true, rows });
    expect(out).toContain('*Kilometraje:* Según el plan de cada gama\n');
    expect(out).toContain('$1.000.000 COP (plan 1.000 km)\n');
    expect(out).toContain('$1.000.001 COP (plan 2.000 km) (sin Seguro Total)\n');
  });

  it('SCEN-020: dropped pieces', () => {
    const out = att();
    for (const gone of ['Solo necesita 4 datos', 'http', 'Buen día']) expect(out).not.toContain(gone);
    expect(out).toContain('Le comparto la cotización solicitada:');
  });
});

describe('Alquilame v3 (SCEN-026/027/028)', () => {
  const alq = (over: Partial<QuoteTextInput> = {}) =>
    text('alquilame', { returnBranch: 'Cali Aeropuerto', returnFee: false, extraHours: 0, ...over });

  it('SCEN-026: emoji and camioneta abbreviation', () => {
    const rows = [
      'Compacto Mecánico', 'Sedán Automático Híbrido', 'Camioneta Mecánica 4X4', 'Camioneta Automática Híbrida 7 puestos', 'Camioneta Automática Especial',
    ].map((description, i) => ({ description, price: 1000 + i }));
    const out = alq({ rows });
    for (const line of [
      '🚗 Compacto Mecánico', '🚗 Sedán Automático Híbrido', '🚙 Camioneta MT 4X4', '🚙 Camioneta AT Híbrida 7 puestos', '🚙 Camioneta AT Especial',
    ]) {
      expect(out.split('\n')).toContain(line);
    }
    expect(out).not.toContain('Camioneta Mecánica');
    expect(out).not.toContain('Camioneta Automática');
  });

  it('SCEN-027: OPCIONALES always, daily seat and prepaid wash', () => {
    const out = alq({ days: 7, babySeat: null, optionalExtras: { babySeat: { total: 84000, dailyPrice: 12000, monthly: false }, washPrice: 20000 } });
    expect(out).toContain('*OPCIONALES*\n*Silla de bebé:*\n$84.000 COP por 7 días\n*Lavada pago anticipado:*\n$20.000 COP\n');
  });

  it('SCEN-027: monthly seat, catalog prices drive the text, null omits the section', () => {
    const monthly = alq({
      days: 30, monthly: true, rows: monthlyRows(['1k_kms']),
      optionalExtras: { babySeat: { total: 100000, dailyPrice: 12000, monthly: true }, washPrice: 25000 },
    });
    expect(monthly).toContain('$100.000 COP por el mes\n');
    expect(monthly).toContain('$25.000 COP\n');
    expect(alq({ optionalExtras: { babySeat: { total: 2, dailyPrice: 1, monthly: false }, washPrice: 9000 } })).toContain('$9.000 COP');
    expect(alq({ optionalExtras: null })).not.toContain('OPCIONALES');
  });

  it('SCEN-027: ignores the legacy babySeat checkbox value', () => {
    expect(alq({ babySeat: { total: 777, dailyPrice: 1, monthly: false } })).not.toContain('$777');
  });

  it('SCEN-028: Seguro Total vs básico', () => {
    expect(alq()).toContain('*Seguro:* Seguro Total\n');
    expect(alq({ totalCoverage: false })).toContain('*Seguro:* Seguro básico\n');
    expect(alq({ totalCoverage: false })).not.toContain('sin Seguro Total');
  });

  it('SCEN-028: a gama without Seguro Total is flagged after the bold price', () => {
    const rows = [{ description: 'Económico', price: 668810 }, { description: 'Sedán', price: 932301, withoutTotalCoverage: true }];
    const out = alq({ rows });
    expect(out).toContain('🚗 Económico\n*$668.810 COP*\n');
    expect(out).toContain('🚗 Sedán\n*$932.301 COP* (sin Seguro Total)\n');
  });

  it('SCEN-028: extra hours', () => {
    expect(alq({ days: 7, extraHours: 3 })).toContain('*Cantidad:* 7 días + 3 horas extra\n');
    expect(alq({ days: 7, extraHours: 1 })).toContain('*Cantidad:* 7 días + 1 hora extra\n');
  });

  it('SCEN-028: other-branch fee line only with a fee, right after Impuestos', () => {
    expect(alq({ returnFee: true })).toContain('*Impuestos:* Incluye IVA y Tax\n*Devolución en otra sede:* Incluida en el precio\n*Kilometraje:*');
    expect(alq({ returnFee: false })).not.toContain('Devolución en otra sede');
    expect(alq({ returnFee: false, returnBranch: 'Cali Norte Chipichape' })).not.toContain('Devolución en otra sede');
  });

  it('SCEN-028: monthly with one plan', () => {
    const out = alq({ days: 30, monthly: true, rows: monthlyRows(['1k_kms', '1k_kms']) });
    expect(out).toContain('*Cantidad:* 30 días\n');
    expect(out).toContain('*Kilometraje:* 1.000 km al mes\n');
    expect(out).not.toContain('Ilimitado');
    expect(out).not.toContain('(plan');
  });

  it('SCEN-028: monthly with different plans', () => {
    const rows = [
      { description: 'Económico', price: 1000000, plan: '1k_kms' as const },
      { description: 'Sedán', price: 1000001, plan: '2k_kms' as const, withoutTotalCoverage: true },
    ];
    const out = alq({ days: 30, monthly: true, rows });
    expect(out).toContain('*Kilometraje:* Según el plan de cada gama\n');
    expect(out).toContain('*$1.000.000 COP* (plan 1.000 km)\n');
    expect(out).toContain('*$1.000.001 COP* (plan 2.000 km) (sin Seguro Total)\n');
  });
});
