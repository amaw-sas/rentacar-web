import { describe, it, expect } from 'vitest';
import { extractStructuredError } from './extractStructuredError';

describe('extractStructuredError', () => {
  it('returns forward payload when FetchError carries a structured body with "error" key', () => {
    const fe = {
      status: 500,
      statusText: 'Internal Server Error',
      data: {
        error: 'out_of_schedule_return_date_error',
        message: 'El día de devolución está por fuera del horario',
        shortText: 'LLNRAG017',
      },
    };
    const forward = extractStructuredError(fe);
    expect(forward).not.toBeNull();
    expect(forward!.status).toBe(500);
    expect(forward!.statusText).toBe('Internal Server Error');
    expect(forward!.body).toEqual({
      error: 'out_of_schedule_return_date_error',
      message: 'El día de devolución está por fuera del horario',
      shortText: 'LLNRAG017',
    });
  });

  it('defaults status to 500 when FetchError has no status', () => {
    const fe = { data: { error: 'unknown_error', message: 'boom' } };
    const forward = extractStructuredError(fe);
    expect(forward!.status).toBe(500);
  });

  it('returns null when data is missing (network failure, non-HTTP error)', () => {
    expect(extractStructuredError(new Error('ECONNREFUSED'))).toBeNull();
    expect(extractStructuredError({ status: 502 })).toBeNull();
  });

  it('returns null when data is present but has no "error" key (opaque body)', () => {
    expect(extractStructuredError({ status: 500, data: { foo: 'bar' } })).toBeNull();
  });

  it('returns null when data is a string (HTML error page, plain text)', () => {
    expect(extractStructuredError({ status: 502, data: '<html>...</html>' })).toBeNull();
  });

  it('returns null for primitive / nullish inputs', () => {
    expect(extractStructuredError(null)).toBeNull();
    expect(extractStructuredError(undefined)).toBeNull();
    expect(extractStructuredError('error')).toBeNull();
    expect(extractStructuredError(42)).toBeNull();
  });
});
