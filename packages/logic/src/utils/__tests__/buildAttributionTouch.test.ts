import { describe, it, expect } from 'vitest';
import { buildAttributionTouch } from '@rentacar-main/logic/utils';

const HOST = 'alquilatucarro.com';

describe('buildAttributionTouch — signal extraction', () => {
  it('SCEN-W1: captures gclid from the query string', () => {
    const { attribution, isTouch } = buildAttributionTouch('?gclid=ABC', '', HOST);
    expect(attribution.gclid).toBe('ABC');
    expect(isTouch).toBe(true);
  });

  it('SCEN-W2: maps every click-id and utm to its field', () => {
    const search =
      '?utm_source=facebook&utm_medium=cpc&gclid=g1&gad_source=1&fbclid=fb1&ttclid=tt1&msclkid=ms1';
    const { attribution, isTouch } = buildAttributionTouch(search, '', HOST);
    expect(attribution).toEqual({
      attribution_version: 2,
      utm_source: 'facebook',
      utm_medium: 'cpc',
      gclid: 'g1',
      gad_source: '1',
      fbclid: 'fb1',
      ttclid: 'tt1',
      msclkid: 'ms1',
    });
    expect(isTouch).toBe(true);
  });

  it('accepts a URLSearchParams instance as input', () => {
    const params = new URLSearchParams({ msclkid: 'bing123' });
    const { attribution } = buildAttributionTouch(params, '', HOST);
    expect(attribution.msclkid).toBe('bing123');
  });

  it('trims surrounding whitespace and ignores empty params', () => {
    const { attribution, isTouch } = buildAttributionTouch('?gclid=%20%20&fbclid=%20fb%20', '', HOST);
    expect(attribution.gclid).toBeUndefined(); // whitespace-only → dropped
    expect(attribution.fbclid).toBe('fb');
    expect(isTouch).toBe(true);
  });

  it('includes an EXTERNAL referrer and flags a touch', () => {
    const { attribution, isTouch } = buildAttributionTouch('', 'https://www.google.com/', HOST);
    expect(attribution.referrer).toBe('https://www.google.com/');
    expect(isTouch).toBe(true);
  });

  it('excludes a same-host referrer (internal navigation is not a touch)', () => {
    const { attribution, isTouch } = buildAttributionTouch(
      '',
      'https://alquilatucarro.com/bogota/buscar-vehiculos',
      HOST,
    );
    expect(attribution.referrer).toBeUndefined();
    expect(isTouch).toBe(false);
  });

  it('treats www and apex as the same host', () => {
    const { isTouch } = buildAttributionTouch('', 'https://www.alquilatucarro.com/', HOST);
    expect(isTouch).toBe(false);
  });

  it('ignores a malformed referrer', () => {
    const { attribution, isTouch } = buildAttributionTouch('', 'not-a-url', HOST);
    expect(attribution.referrer).toBeUndefined();
    expect(isTouch).toBe(false);
  });

  it('SCEN-W5: no params and no external referrer → empty object, not a touch', () => {
    const { attribution, isTouch } = buildAttributionTouch('', '', HOST);
    expect(attribution).toEqual({});
    expect(isTouch).toBe(false);
  });

  it('still captures utm when a click-id is absent', () => {
    const { attribution, isTouch } = buildAttributionTouch('?utm_source=newsletter&utm_medium=email', '', HOST);
    expect(attribution).toEqual({
      attribution_version: 2,
      utm_source: 'newsletter',
      utm_medium: 'email',
    });
    expect(isTouch).toBe(true);
  });

  it('captures the complete v2 contract with campaign fields, modern click IDs, and entry metadata', () => {
    const search = new URLSearchParams({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'cars',
      utm_term: 'rental',
      utm_content: 'creative-a',
      gclid: 'g',
      gad_source: '1',
      gbraid: 'gb',
      wbraid: 'wb',
      dclid: 'dc',
      fbclid: 'fb',
      ttclid: 'tt',
      twclid: 'tw',
      msclkid: 'ms',
    });
    const { attribution, isTouch } = buildAttributionTouch(
      search,
      'https://google.com/',
      HOST,
      {
        landingUrl: '/bogota',
        capturedAt: '2026-07-18T17:00:00.000Z',
        brand: 'alquilatucarro',
      },
    );

    expect(isTouch).toBe(true);
    expect(attribution).toEqual({
      attribution_version: 2,
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'cars',
      utm_term: 'rental',
      utm_content: 'creative-a',
      gclid: 'g',
      gad_source: '1',
      gbraid: 'gb',
      wbraid: 'wb',
      dclid: 'dc',
      fbclid: 'fb',
      ttclid: 'tt',
      twclid: 'tw',
      msclkid: 'ms',
      referrer: 'https://google.com/',
      landing_url: '/bogota',
      captured_at: '2026-07-18T17:00:00.000Z',
      brand: 'alquilatucarro',
    });
  });

  it('does not fabricate v2 entry metadata on a direct/internal non-touch', () => {
    const { attribution, isTouch } = buildAttributionTouch('', '', HOST, {
      landingUrl: '/reservas',
      capturedAt: '2026-07-18T17:00:00.000Z',
      brand: 'alquilatucarro',
    });
    expect(isTouch).toBe(false);
    expect(attribution).toEqual({});
  });
});
