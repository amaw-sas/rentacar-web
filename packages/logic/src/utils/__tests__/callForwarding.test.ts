import { describe, it, expect, vi } from 'vitest';
import {
  buildPhoneConversionConfig,
  resolveCallPhone,
  toTelHref,
} from '../callForwarding';

// Spec: docs/specs/2026-09-23-website-call-forwarding/design.md
const REAL = '+57 301 672 9250';

describe('toTelHref', () => {
  it('SCEN-003: the real number becomes a dialable tel: link', () => {
    expect(toTelHref(REAL)).toBe('tel:+573016729250');
  });

  it('strips spaces, dashes and parentheses from a forwarding number', () => {
    expect(toTelHref('+57 (601) 555-0100')).toBe('tel:+576015550100');
  });
});

describe('buildPhoneConversionConfig', () => {
  it('SCEN-006: tells Google which number on the page to swap', () => {
    const config = buildPhoneConversionConfig(REAL, () => {});
    expect(config.phone_conversion_number).toBe(REAL);
    expect(typeof config.phone_conversion_callback).toBe('function');
  });

  it('SCEN-001: hands the forwarding number to the page when Google returns one', () => {
    const onNumber = vi.fn();
    const config = buildPhoneConversionConfig(REAL, onNumber);
    config.phone_conversion_callback('+57 601 555 0100', '+576015550100');
    expect(onNumber).toHaveBeenCalledWith({
      display: '+57 601 555 0100',
      tel: '+576015550100',
    });
  });

  it('SCEN-003: ignores an empty answer so the real number stays', () => {
    const onNumber = vi.fn();
    const config = buildPhoneConversionConfig(REAL, onNumber);
    config.phone_conversion_callback('', '');
    config.phone_conversion_callback(undefined as unknown as string, undefined as unknown as string);
    config.phone_conversion_callback('+', '+');
    config.phone_conversion_callback('+57', '+57');
    expect(onNumber).not.toHaveBeenCalled();
  });

  it('SCEN-003: a failing page update never throws back into Google’s tag', () => {
    const config = buildPhoneConversionConfig(REAL, () => {
      throw new Error('boom');
    });
    expect(() => config.phone_conversion_callback('+57 601 555 0100', '+576015550100')).not.toThrow();
  });
});

describe('resolveCallPhone', () => {
  it('SCEN-003: with no forwarding number, shows and dials the real one', () => {
    expect(resolveCallPhone(REAL, null)).toEqual({
      display: REAL,
      tel: '+573016729250',
      telHref: 'tel:+573016729250',
    });
  });

  it('SCEN-001/002: with a forwarding number, shows and dials Google’s', () => {
    expect(
      resolveCallPhone(REAL, { display: '+57 601 555 0100', tel: '+576015550100' }),
    ).toEqual({ display: '+57 601 555 0100', tel: '+576015550100', telHref: 'tel:+576015550100' });
  });
});
