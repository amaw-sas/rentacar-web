import { describe, it, expect } from 'vitest';
import { categoryReadingRank } from '../categoryReadingOrder';

const r = categoryReadingRank;

describe('categoryReadingRank', () => {
  it('groups by class: all compactos < all sedanes < all camionetas', () => {
    const compactos = ['C', 'CX'];
    const sedanes = ['F', 'FL', 'FX', 'FU'];
    const camionetas = ['G4', 'GY', 'LU', 'GC', 'GL', 'LE'];
    const maxC = Math.max(...compactos.map(r));
    const minS = Math.min(...sedanes.map(r));
    const maxS = Math.max(...sedanes.map(r));
    const minCam = Math.min(...camionetas.map(r));
    expect(maxC).toBeLessThan(minS);
    expect(maxS).toBeLessThan(minCam);
  });

  it('within a class, mecánico < híbrido < automático', () => {
    expect(r('C')).toBeLessThan(r('CX'));                 // compacto mec < auto
    expect(Math.max(r('F'), r('FL'))).toBeLessThan(Math.min(r('FX'), r('FU'))); // sedán mec < auto
    expect(r('G4')).toBeLessThan(r('GY'));                // camioneta mec < híbrida
    expect(r('GY')).toBeLessThan(r('GC'));                // camioneta híbrida < auto
    expect(r('LU')).toBeLessThan(r('GL'));
  });

  it('full sort by (rank, price) yields the expected grouping', () => {
    // price acts as the real tiebreak; use ascending prices per code
    const rows = [
      { code: 'LE', price: 341 }, { code: 'GY', price: 461 }, { code: 'CX', price: 151 },
      { code: 'FU', price: 208 }, { code: 'C', price: 142 }, { code: 'GC', price: 257 },
      { code: 'F', price: 157 }, { code: 'G4', price: 268 }, { code: 'FX', price: 180 },
      { code: 'GL', price: 288 }, { code: 'LU', price: 368 }, { code: 'FL', price: 187 },
    ];
    const sorted = rows
      .sort((a, b) => r(a.code) - r(b.code) || a.price - b.price)
      .map((x) => x.code);
    expect(sorted).toEqual(['C', 'CX', 'F', 'FL', 'FX', 'FU', 'G4', 'LU', 'GY', 'GC', 'GL', 'LE']);
  });

  it('is case-insensitive', () => {
    expect(r('gc')).toBe(r('GC'));
  });

  it('puts an unknown code in the middle (visible), not last', () => {
    expect(r('ZZ')).toBeGreaterThan(r('C'));
    expect(r('ZZ')).toBeLessThan(r('LE'));
  });
});
