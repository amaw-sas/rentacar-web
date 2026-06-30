import { describe, it, expect } from 'vitest';
import { classifyOneWayDistanceError } from './classifyOneWayDistanceError';
import type LocalizaErrorResponse from '../types/data/LocalizaErrorResponse';

// Localiza responds unknown_error/shortText=LLNRRE003 ("Distância entre cidades
// não cadastrada") when it can't price a one-way because the inter-city distance
// isn't registered. The helper reclassifies THAT case —and only it— so the toast
// can explain it. See docs/specs/2026-06-30-one-way-distance-message-design.md
// and rentacar-dashboard#205.

const llnrre003 = (extra: Partial<LocalizaErrorResponse> = {}): LocalizaErrorResponse =>
  ({
    error: 'unknown_error',
    message: 'Ha ocurrido un error inesperado, por favor contacte a nuestros asesores',
    shortText: 'LLNRRE003',
    ...extra,
  } as LocalizaErrorResponse);

describe('classifyOneWayDistanceError', () => {
  it('reclassifies LLNRRE003 on a one-way search (pickup ≠ return) to one_way_not_available', () => {
    const result = classifyOneWayDistanceError(llnrre003(), 'ACBAN', 'AABAN');
    expect(result.error).toBe('one_way_not_available');
  });

  it('preserves the original message and shortText when reclassifying', () => {
    const result = classifyOneWayDistanceError(llnrre003(), 'ACBAN', 'AABAN');
    expect(result.shortText).toBe('LLNRRE003');
    expect(result.message).toBe(
      'Ha ocurrido un error inesperado, por favor contacte a nuestros asesores',
    );
  });

  it('leaves LLNRRE003 untouched on a round-trip search (pickup === return) — SCEN-OW-02', () => {
    const result = classifyOneWayDistanceError(llnrre003(), 'ACBAN', 'ACBAN');
    expect(result.error).toBe('unknown_error');
  });

  it('leaves a generic unknown_error WITHOUT shortText untouched on one-way — SCEN-OW-03', () => {
    const infra = { error: 'unknown_error', message: 'boom' } as LocalizaErrorResponse;
    const result = classifyOneWayDistanceError(infra, 'ACBAN', 'AABAN');
    expect(result.error).toBe('unknown_error');
  });

  it('leaves an error with a DIFFERENT shortText untouched on one-way — SCEN-OW-03', () => {
    const result = classifyOneWayDistanceError(llnrre003({ shortText: 'LLNRRE010' }), 'ACBAN', 'AABAN');
    expect(result.error).toBe('unknown_error');
  });

  it('is idempotent: an already-classified one_way_not_available stays classified — SCEN-OW-05a', () => {
    const already = llnrre003({ error: 'one_way_not_available' });
    const result = classifyOneWayDistanceError(already, 'ACBAN', 'AABAN');
    expect(result.error).toBe('one_way_not_available');
  });

  it('does not classify when returnLocation is null — SCEN-OW-05b', () => {
    const result = classifyOneWayDistanceError(llnrre003(), 'ACBAN', null);
    expect(result.error).toBe('unknown_error');
  });

  it('does not classify when pickupLocation is null — SCEN-OW-05c', () => {
    const result = classifyOneWayDistanceError(llnrre003(), null, 'AABAN');
    expect(result.error).toBe('unknown_error');
  });
});
