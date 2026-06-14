import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Contract boundary (issue #121 / Apéndice A de rentacar-dashboard#113): the
// record payload must ALWAYS carry an `attribution` object — `{}` means
// "Directo", an absent key would mean "Desconocido". These source-level checks
// mirror the existing `total_insurance` test approach (fully mocking Nuxt
// auto-imports + Pinia + ofetch in the node env is not worth it here); the real
// runtime payload is asserted separately via agent-browser.

const recordSource = readFileSync(
  fileURLToPath(new URL('../useRecordReservationForm.ts', import.meta.url)),
  'utf8',
);

const fieldsSource = readFileSync(
  fileURLToPath(new URL('../../utils/types/fields/FormRecordFields.ts', import.meta.url)),
  'utf8',
);

describe('useRecordReservationForm — attribution payload', () => {
  it('reads attribution from the store via storeToRefs', () => {
    expect(recordSource).toMatch(/attribution,/);
    expect(recordSource).toContain('storeToRefs(storeForm)');
  });

  it('always assigns an object: store value, then storage fallback, then {} (Directo)', () => {
    expect(recordSource).toContain(
      'partialData.attribution = attribution.value ?? readStoredAttribution() ?? {};',
    );
  });

  it('never sends attribution as null (would be "Desconocido", not "Directo")', () => {
    expect(recordSource).not.toMatch(/attribution\s*=\s*attribution\.value\s*\?\?\s*null/);
  });

  it('assigns attribution BEFORE both reservation branches so the spread keeps it', () => {
    const assignIdx = recordSource.indexOf('partialData.attribution =');
    const monthlyIdx = recordSource.indexOf('haveMonthlyReservation.value');
    const regularIdx = recordSource.indexOf('// reserva regular');
    expect(assignIdx).toBeGreaterThan(-1);
    expect(assignIdx).toBeLessThan(monthlyIdx);
    expect(assignIdx).toBeLessThan(regularIdx);
    // both branches build formData by spreading partialData → attribution rides along
    expect(recordSource).toMatch(/\.\.\.partialData,[\s\S]*\.\.\.partialData,/);
  });
});

describe('FormRecordFields — attribution type', () => {
  it('declares an optional attribution field of type AttributionInput', () => {
    expect(fieldsSource).toMatch(/attribution\?:\s*AttributionInput/);
  });
});
