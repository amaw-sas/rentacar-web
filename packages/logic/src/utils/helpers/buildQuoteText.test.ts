import { describe, it, expect } from 'vitest';
import { buildQuoteText, type QuoteTextInput } from './buildQuoteText';

const BENEFITS = [
  '*Beneficios de reservar*',
  '1. Reservas con 4 datos.',
  '2. Congelas el precio.',
  '3. No realizas ningún pago.',
  '4. Cancelas cuando quieras.',
  '5. No bloqueamos cupo de tarjeta.',
  '6. Pagas al recoger el carro.',
].join('\n');

const base = (over: Partial<QuoteTextInput> = {}): QuoteTextInput => ({
  pickupBranch: 'Cali Aeropuerto',
  returnBranch: 'Cali Aeropuerto',
  pickupDateTime: 'viernes 16 oct. 7:30am',
  returnDateTime: 'domingo 18 oct. 8:00am',
  days: 2,
  extraHours: 0,
  monthly: false,
  totalCoverage: false,
  rows: [{ code: 'C', description: 'Compacto mecánico', price: 406000 }],
  babySeat: null,
  ...over,
});

describe('buildQuoteText', () => {
  it('matches the owner bot sample byte for byte (regular, same branch)', () => {
    const text = buildQuoteText(
      base({
        rows: [
          { code: 'C', description: 'Compacto mecánico', price: 406000 },
          { code: 'CX', description: 'Compacto automático', price: 432000 },
          { code: 'F', description: 'Sedán mecánico', price: 430000 },
          { code: 'FU', description: 'Sedán automático híbrido sin pico y placa', price: 574000 },
          { code: 'FX', description: 'Sedán automático', price: 494000 },
          { code: 'GC', description: 'Camioneta automática', price: 670000 },
          { code: 'G4', description: 'Camioneta mecánica 4x4', price: 698000 },
          { code: 'GY', description: 'Camioneta automática híbrida 7 puestos sin pico y placa', price: 1808000 },
        ],
      }),
    );

    expect(text).toBe(
      `*Recoges:*
Cali Aeropuerto
viernes 16 oct. 7:30am

*Entregas:*
Cali Aeropuerto
domingo 18 oct. 8:00am

*Total: 2 días*

cotización
2 día(s)
· Cali Aeropuerto
C    Compacto mecánico    $406.000
CX    Compacto automático    $432.000
F    Sedán mecánico    $430.000
FU    Sedán automático híbrido sin pico y placa    $574.000
FX    Sedán automático    $494.000
GC    Camioneta automática    $670.000
G4    Camioneta mecánica 4x4    $698.000
GY    Camioneta automática híbrida 7 puestos sin pico y placa    $1.808.000
Esta cotización estará disponible durante 20 minutos; luego se debe recotizar.
Los precios son dinámicos e incluyen IVA, seguro básico y kilometraje ilimitado.

${BENEFITS}`,
    );
  });

  it('uses the singular for one day', () => {
    const text = buildQuoteText(base({ days: 1 }));
    expect(text).toContain('*Total: 1 día*\n');
    expect(text).toContain('\n1 día(s)\n');
  });

  it('lists both branches and the one-way note when they differ', () => {
    const text = buildQuoteText(base({ returnBranch: 'Bogotá Norte' }));
    expect(text).toContain('*Entregas:*\nBogotá Norte\n');
    expect(text).toContain('\n· Recoge en Cali Aeropuerto, entrega en Bogotá Norte\n');
    expect(text).not.toContain('\n· Cali Aeropuerto\n');
    expect(text).toContain('Cada precio incluye el cargo por entregar en otra sede.\n');
  });

  it('adds extra hours to header, detail and note', () => {
    const text = buildQuoteText(base({ extraHours: 3 }));
    expect(text).toContain('*Total: 2 días y 3 horas extra*');
    expect(text).toContain('\n2 día(s) + 3 hora(s) extra\n');
    expect(text).toContain('Cada precio incluye las horas extra.\n');
  });

  it('uses the singular for one extra hour', () => {
    expect(buildQuoteText(base({ extraHours: 1 }))).toContain('*Total: 2 días y 1 hora extra*');
  });

  it('puts the extra-hours note before the other-branch note', () => {
    const text = buildQuoteText(base({ extraHours: 2, returnBranch: 'Bogotá Norte' }));
    expect(text.indexOf('Cada precio incluye las horas extra.')).toBeLessThan(
      text.indexOf('Cada precio incluye el cargo por entregar'),
    );
  });

  it('swaps header and footer when Seguro Total is requested and quotable', () => {
    const text = buildQuoteText(base({ totalCoverage: true }));
    expect(text).toContain('\n· Cali Aeropuerto\n· Con Seguro Total (deducible $0)\nC    Compacto mecánico    $406.000\n');
    expect(text).toContain('incluyen IVA, Seguro Total y kilometraje ilimitado.');
    expect(text).not.toContain('seguro básico');
  });

  it('marks only the rows that cannot be quoted with Seguro Total', () => {
    const text = buildQuoteText(
      base({
        totalCoverage: true,
        rows: [
          { code: 'C', description: 'Compacto mecánico', price: 406000 },
          { code: 'GY', description: 'Camioneta', price: 1808000, withoutTotalCoverage: true },
        ],
      }),
    );
    expect(text).toContain('· Con Seguro Total (deducible $0)');
    expect(text).toContain('\nC    Compacto mecánico    $406.000\n');
    expect(text).toContain('\nGY    Camioneta    $1.808.000 (sin Seguro Total)\n');
  });

  it('qualifies the footer when some rows are marked «sin Seguro Total»', () => {
    const text = buildQuoteText(
      base({
        totalCoverage: true,
        rows: [
          { code: 'C', description: 'Compacto mecánico', price: 406000 },
          { code: 'GY', description: 'Camioneta', price: 1808000, withoutTotalCoverage: true },
        ],
      }),
    );
    expect(text).toContain(
      '\nLos precios son dinámicos e incluyen IVA, Seguro Total (salvo las gamas marcadas «sin Seguro Total») y kilometraje ilimitado.\n',
    );
  });

  it('drops the Seguro Total header and footer when no row can be quoted with it', () => {
    const text = buildQuoteText(
      base({
        totalCoverage: true,
        rows: [{ code: 'C', description: 'Compacto', price: 406000, withoutTotalCoverage: true }],
      }),
    );
    expect(text).not.toContain('Con Seguro Total');
    expect(text).toContain('\nC    Compacto    $406.000 (sin Seguro Total)\n');
    expect(text).toContain('incluyen IVA, seguro básico y kilometraje ilimitado.');
  });

  it('emits no Seguro Total text when the checkbox is off', () => {
    const text = buildQuoteText(base({ totalCoverage: false }));
    expect(text).not.toContain('Seguro Total');
    expect(text).not.toContain('(sin Seguro Total)');
  });

  it('states a shared monthly plan once', () => {
    const text = buildQuoteText(
      base({
        monthly: true,
        days: 30,
        rows: [
          { code: 'C', description: 'Compacto', price: 2500000, plan: '1k_kms' },
          { code: 'F', description: 'Sedán', price: 2900000, plan: '1k_kms' },
        ],
      }),
    );
    expect(text).toContain('*Total: 30 días*');
    expect(text).toContain('\n· Plan mensual de 1.000 km\n');
    expect(text).toContain('\nC    Compacto    $2.500.000\n');
    expect(text).not.toContain('(plan');
  });

  it('suffixes each row when monthly plans differ', () => {
    const text = buildQuoteText(
      base({
        monthly: true,
        days: 30,
        rows: [
          { code: 'C', description: 'Compacto', price: 2500000, plan: '1k_kms' },
          { code: 'F', description: 'Sedán', price: 3100000, plan: '2k_kms' },
        ],
      }),
    );
    expect(text).not.toContain('· Plan mensual');
    expect(text).toContain('\nC    Compacto    $2.500.000 (plan 1.000 km)\n');
    expect(text).toContain('\nF    Sedán    $3.100.000 (plan 2.000 km)\n');
  });

  // El plan mensual trae un tope de km: el pie no puede prometer kilometraje ilimitado.
  it('replaces «kilometraje ilimitado» with the monthly plan in the footer', () => {
    const shared = buildQuoteText(
      base({
        monthly: true,
        days: 30,
        totalCoverage: true,
        rows: [{ code: 'C', description: 'Compacto', price: 2500000, plan: '2k_kms' }],
      }),
    );
    expect(shared).toContain('\nLos precios son dinámicos e incluyen IVA, Seguro Total y 2.000 km al mes.\n');
    expect(shared).not.toContain('ilimitado');

    const mixed = buildQuoteText(
      base({
        monthly: true,
        days: 30,
        rows: [
          { code: 'C', description: 'Compacto', price: 2500000, plan: '1k_kms' },
          { code: 'F', description: 'Sedán', price: 3100000, plan: '2k_kms' },
        ],
      }),
    );
    expect(mixed).toContain(
      '\nLos precios son dinámicos e incluyen IVA, seguro básico y los km del plan de cada gama.\n',
    );
    expect(mixed).not.toContain('ilimitado');
  });

  it('prints the regular baby seat line', () => {
    const text = buildQuoteText(base({ babySeat: { total: 24000, dailyPrice: 12000, monthly: false } }));
    expect(text).toContain('Silla de bebé: $24.000 (2 días × $12.000), se paga al recoger.\n');
    expect(text.indexOf('Silla de bebé')).toBeLessThan(text.indexOf('Esta cotización estará'));
  });

  it('uses the singular day in the baby seat line', () => {
    const text = buildQuoteText(base({ days: 1, babySeat: { total: 12000, dailyPrice: 12000, monthly: false } }));
    expect(text).toContain('Silla de bebé: $12.000 (1 día × $12.000), se paga al recoger.');
  });

  it('prints the monthly baby seat line', () => {
    const text = buildQuoteText(
      base({
        monthly: true,
        days: 30,
        rows: [{ code: 'C', description: 'Compacto', price: 2500000, plan: '1k_kms' }],
        babySeat: { total: 100000, dailyPrice: 3333, monthly: true },
      }),
    );
    expect(text).toContain('Silla de bebé: $100.000 el mes, se paga al recoger.\n');
  });

  it('groups thousands with dots, also for four-digit amounts', () => {
    const text = buildQuoteText(
      base({ rows: [{ code: 'C', description: 'X', price: 2500 }, { code: 'F', description: 'Y', price: 25000 }] }),
    );
    expect(text).toContain('C    X    $2.500\n');
    expect(text).toContain('F    Y    $25.000\n');
  });

  it('trims the description', () => {
    const text = buildQuoteText(base({ rows: [{ code: 'C', description: '  Compacto mecánico ', price: 406000 }] }));
    expect(text).toContain('\nC    Compacto mecánico    $406.000\n');
  });
});
