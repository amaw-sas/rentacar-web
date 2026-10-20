import { describe, it, expect } from 'vitest';
import { buildBrandQuoteText, type QuoteFranchise, type QuoteTextInput } from './index';

const BRANDS: QuoteFranchise[] = ['alquilame', 'alquilatucarro', 'alquicarros'];

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
};

const make = (over: Partial<QuoteTextInput> = {}): QuoteTextInput => ({ ...base, ...over });
const text = (b: QuoteFranchise, over: Partial<QuoteTextInput> = {}) => buildBrandQuoteText(make(over), b);

const ALQUILAME = `¡Hola! Esta es tu cotización en Alquilame 🚗

📍 *Recoges:* Cali Aeropuerto, viernes 23 oct. 7:30am
📍 *Entregas:* Cali Norte Chipichape, domingo 25 oct. 10:30am
⏱️ 2 días y 3 horas extra, con Seguro Total

🚙 Económico — *$668.810 COP*
🚙 Sedán — *$932.301 COP*
🚙 Camioneta — *$1.894.620 COP*

El precio ya incluye IVA, las horas extra, la entrega en otra sede y kilometraje ilimitado.
Silla de bebé: $30.000 COP (2 días × $15.000 COP), se paga al recoger.
⚠️ Este precio se mantiene 20 minutos.

*Con Alquilame:*
✅ Reservas con 4 datos y congelas el precio
✅ No pagas nada hoy y no bloqueamos cupo de tarjeta
✅ Cancelas cuando quieras y pagas al recoger`;

const ALQUILATUCARRO = `Buen día. Le comparto la cotización solicitada:

*RECOGIDA*
Cali Aeropuerto
viernes 23 oct. 7:30am

*DEVOLUCIÓN*
Cali Norte Chipichape
domingo 25 oct. 10:30am

*Duración:* 2 días + 3 horas extra
*Cobertura:* Seguro Total

*Opciones disponibles*
1) Económico: $668.810 COP
2) Sedán: $932.301 COP
3) Camioneta: $1.894.620 COP

Valores con IVA incluido. Ya suman las horas extra, el cargo por devolver en otra sede y kilometraje ilimitado.
Silla de bebé (opcional): $30.000 COP por el alquiler, se paga en la oficina.
Precios dinámicos, válidos por 20 minutos.

*¿Por qué reservar con Alquilatucarro?*
- Solo necesita 4 datos
- El precio queda congelado
- No paga nada por adelantado
- Puede cancelar sin costo
- No bloqueamos cupo en su tarjeta
- Paga al recoger el vehículo`;

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
  it('alquilatucarro', () => expect(text('alquilatucarro')).toBe(ALQUILATUCARRO));
  it('alquicarros', () => expect(text('alquicarros')).toBe(ALQUICARROS));
});

const sameBranch = { returnBranch: 'Cali Aeropuerto', returnFee: false };
const monthlyRows = (plans: ('1k_kms' | '2k_kms')[]) =>
  plans.map((plan, i) => ({ description: ['Económico', 'Sedán', 'Camioneta'][i]!, price: 1000000 + i, plan }));

interface Case {
  name: string;
  over: Partial<QuoteTextInput>;
  expected: Record<QuoteFranchise, string[]>;
  absent?: Record<QuoteFranchise, string[]>;
}

const cases: Case[] = [
  {
    name: 'sin Seguro Total',
    over: { totalCoverage: false },
    expected: {
      alquilame: ['⏱️ 2 días y 3 horas extra, con seguro básico'],
      alquilatucarro: ['*Cobertura:* Seguro básico'],
      alquicarros: ['2 días + 3 h extra · Seguro básico'],
    },
    absent: { alquilame: ['Seguro Total'], alquilatucarro: ['Seguro Total'], alquicarros: ['Seguro Total'] },
  },
  {
    name: 'Seguro Total en algunas gamas',
    over: { rows: [{ description: 'Económico', price: 668810 }, { description: 'Sedán', price: 932301, withoutTotalCoverage: true }] },
    expected: {
      alquilame: ['🚙 Económico — *$668.810 COP*\n', '🚙 Sedán — *$932.301 COP* (sin Seguro Total)', 'con Seguro Total'],
      alquilatucarro: ['1) Económico: $668.810 COP\n', '2) Sedán: $932.301 COP (sin Seguro Total)', 'Seguro Total'],
      alquicarros: ['• Económico $668.810 COP\n', '• Sedán $932.301 COP (sin Seguro Total)', 'Seguro Total'],
    },
  },
  {
    name: 'sin horas extra',
    over: { extraHours: 0 },
    expected: {
      alquilame: ['⏱️ 2 días, con Seguro Total', 'El precio ya incluye IVA, la entrega en otra sede y kilometraje ilimitado.'],
      alquilatucarro: ['*Duración:* 2 días\n', 'Ya suman el cargo por devolver en otra sede y kilometraje ilimitado.'],
      alquicarros: ['2 días · Seguro Total', 'Incluye: IVA, otra sede, km ilimitado.'],
    },
    absent: { alquilame: ['hora'], alquilatucarro: ['hora'], alquicarros: ['h extra', 'horas'] },
  },
  {
    name: 'misma sede',
    over: sameBranch,
    expected: {
      alquilame: [
        '📍 *Recoges:* Cali Aeropuerto, viernes',
        '📍 *Entregas:* Cali Aeropuerto, domingo',
        'El precio ya incluye IVA, las horas extra y kilometraje ilimitado.',
      ],
      alquilatucarro: ['Valores con IVA incluido. Ya suman las horas extra y kilometraje ilimitado.'],
      alquicarros: ['Cali Aeropuerto → Cali Aeropuerto', 'Incluye: IVA, horas extra, km ilimitado.'],
    },
    absent: { alquilame: ['otra sede'], alquilatucarro: ['otra sede'], alquicarros: ['otra sede'] },
  },
  {
    name: 'ni horas extra ni otra sede',
    over: { extraHours: 0, ...sameBranch },
    expected: {
      alquilame: ['El precio ya incluye IVA y kilometraje ilimitado.'],
      alquilatucarro: ['Valores con IVA incluido. Incluyen kilometraje ilimitado.'],
      alquicarros: ['Incluye: IVA, km ilimitado.'],
    },
  },
  {
    name: 'mensual, mismo plan',
    over: { days: 30, extraHours: 0, monthly: true, rows: monthlyRows(['1k_kms', '1k_kms']), babySeat: null },
    expected: {
      alquilame: ['⏱️ 30 días, plan de 1.000 km al mes, con Seguro Total', 'IVA, la entrega en otra sede y 1.000 km al mes.'],
      alquilatucarro: ['*Duración:* 30 días, plan de 1.000 km al mes', 'Ya suman el cargo por devolver en otra sede y 1.000 km al mes.'],
      alquicarros: ['30 días · plan 1.000 km/mes · Seguro Total', 'Incluye: IVA, otra sede, 1.000 km/mes.'],
    },
    absent: { alquilame: ['ilimitado'], alquilatucarro: ['ilimitado'], alquicarros: ['ilimitado'] },
  },
  {
    name: 'mensual, planes distintos',
    over: { days: 30, extraHours: 0, monthly: true, rows: monthlyRows(['1k_kms', '2k_kms']), babySeat: null },
    expected: {
      alquilame: ['*$1.000.000 COP* (plan 1.000 km)', '*$1.000.001 COP* (plan 2.000 km)', 'los km del plan de cada gama.'],
      alquilatucarro: ['$1.000.000 COP (plan 1.000 km)', '$1.000.001 COP (plan 2.000 km)', 'los km del plan de cada gama.'],
      alquicarros: ['$1.000.000 COP (plan 1.000 km)', '$1.000.001 COP (plan 2.000 km)', 'km del plan de cada gama.'],
    },
    absent: { alquilame: ['ilimitado', 'plan de 1.000'], alquilatucarro: ['ilimitado', 'plan de 1.000'], alquicarros: ['ilimitado', 'plan 1.000 km/mes'] },
  },
  {
    name: 'silla mensual',
    over: { days: 30, monthly: true, rows: monthlyRows(['1k_kms']), babySeat: { total: 90000, dailyPrice: 3000, monthly: true } },
    expected: {
      alquilame: ['Silla de bebé: $90.000 COP el mes, se paga al recoger.'],
      alquilatucarro: ['Silla de bebé (opcional): $90.000 COP el mes, se paga en la oficina.'],
      alquicarros: ['+ Silla de bebé $90.000 COP el mes (pagas al recoger)'],
    },
    absent: { alquilame: ['×'], alquilatucarro: ['por el alquiler'], alquicarros: ['×'] },
  },
  {
    name: 'sin silla',
    over: { babySeat: null },
    expected: { alquilame: [], alquilatucarro: [], alquicarros: [] },
    absent: { alquilame: ['Silla'], alquilatucarro: ['Silla'], alquicarros: ['Silla'] },
  },
];

describe('variant table (SCEN-011)', () => {
  for (const c of cases) {
    for (const brand of BRANDS) {
      it(`${brand}: ${c.name}`, () => {
        const out = text(brand, c.over);
        for (const piece of c.expected[brand]) expect(out).toContain(piece);
        for (const piece of c.absent?.[brand] ?? []) expect(out).not.toContain(piece);
      });
    }
  }

  it('singular: 1 día + 1 hora extra', () => {
    expect(text('alquilame', { days: 1, extraHours: 1 })).toContain('⏱️ 1 día y 1 hora extra');
    expect(text('alquilatucarro', { days: 1, extraHours: 1 })).toContain('*Duración:* 1 día + 1 hora extra');
    expect(text('alquicarros', { days: 1, extraHours: 1 })).toContain('1 día + 1 h extra');
  });

  it('formats 4-digit amounts with thousands separator', () => {
    expect(text('alquilame', { rows: [{ description: 'Económico', price: 2500 }] })).toContain('*$2.500 COP*');
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
    alquilame: 'la entrega en otra sede',
    alquilatucarro: 'el cargo por devolver en otra sede',
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
