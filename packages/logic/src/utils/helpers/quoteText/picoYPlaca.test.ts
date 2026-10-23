import { describe, expect, it } from 'vitest';
import { buildBrandQuoteText } from './index';
import type { QuoteTextInput } from './model';

// SCEN-030/031 (docs/specs/cotizacion-por-asesor/scenarios/gamas-sin-pico-y-placa.scenarios.md):
// Bogotá lists GC and GL both as «Camioneta Automática»; GL is exempt, so the quote names it apart.
const input = (exempt?: boolean): QuoteTextInput => ({
  pickupBranch: 'Bogotá Aeropuerto', returnBranch: 'Bogotá Aeropuerto',
  pickupDate: '2026-10-23', pickupTime: '12:00', returnDate: '2026-10-30', returnTime: '12:00',
  days: 7, extraHours: 0, monthly: false, totalCoverage: false, returnFee: false,
  rows: [
    { description: 'Camioneta Automática', price: 2191000 },
    { description: 'Camioneta Automática', price: 2457000, ...(exempt !== undefined && { picoyplacaExempt: exempt }) },
  ],
  babySeat: null,
  optionalExtras: null,
} as QuoteTextInput);

describe('gamas exentas de pico y placa en la cotización', () => {
  it.each([
    ['alquilame', '🚙 Camioneta AT sin pico y placa\n*$2.457.000 COP*', '🚙 Camioneta AT\n*$2.191.000 COP*'],
    ['alquilatucarro', '*Camioneta AT sin pico y placa:*\n$2.457.000 COP', '*Camioneta AT:*\n$2.191.000 COP'],
    ['alquicarros', '• Camioneta Automática sin pico y placa $2.457.000 COP', '• Camioneta Automática $2.191.000 COP'],
  ] as const)('SCEN-030 %s: the exempt gama is named apart, the other is unchanged', (brand, exemptLine, plainLine) => {
    const text = buildBrandQuoteText(input(true), brand);
    expect(text).toContain(exemptLine);
    expect(text).toContain(plainLine);
  });

  it.each(['alquilame', 'alquilatucarro', 'alquicarros'] as const)('SCEN-031 %s: false or absent flag leaves the name as is', (brand) => {
    expect(buildBrandQuoteText(input(false), brand)).not.toContain('pico y placa');
    expect(buildBrandQuoteText(input(), brand)).not.toContain('pico y placa');
  });
});
