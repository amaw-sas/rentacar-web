import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  analyticsPageType,
  createContactClickHandler,
  createSpaPageViewTracker,
  normalizeAnalyticsErrorReason,
  trackAnalyticsEvent,
  trackGenerateLead,
  trackReservationOutcome,
  type AnalyticsEventMap,
  type AnalyticsEventName,
} from '@rentacar-main/logic/utils';

type CapturedEvent = {
  name: AnalyticsEventName;
  params: AnalyticsEventMap[AnalyticsEventName];
};

function stubGtag() {
  const events: CapturedEvent[] = [];
  vi.stubGlobal('window', {
    gtag: (_command: string, name: AnalyticsEventName, params: AnalyticsEventMap[AnalyticsEventName]) => {
      events.push({ name, params });
    },
  });
  return events;
}

function storageMock(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('trackAnalyticsEvent', () => {
  it('no-ops without gtag and never throws', () => {
    expect(trackAnalyticsEvent('chat_open', { brand: 'alquilame', source: 'fab' })).toBe(false);
  });

  it('forwards the typed snake_case event and non-PII params', () => {
    const events = stubGtag();
    expect(trackAnalyticsEvent('contact_click', {
      brand: 'alquilatucarro',
      method: 'telephone',
      placement: 'header',
      page_type: 'city',
      city: 'bogota',
    })).toBe(true);
    expect(events).toEqual([{
      name: 'contact_click',
      params: {
        brand: 'alquilatucarro',
        method: 'telephone',
        placement: 'header',
        page_type: 'city',
        city: 'bogota',
      },
    }]);
  });
});

describe('createSpaPageViewTracker', () => {
  it('sends one initial/finalized route, deduplicates it, and chains virtual referrers', () => {
    const events: CapturedEvent[] = [];
    const emit = ((name: AnalyticsEventName, params: AnalyticsEventMap[AnalyticsEventName]) => {
      events.push({ name, params });
      return true;
    }) as typeof trackAnalyticsEvent;
    const tracker = createSpaPageViewTracker('alquilatucarro', 'https://google.com/', emit);

    expect(tracker.track({
      routeKey: '/',
      pageLocation: 'https://alquilatucarro.com/',
      pageTitle: 'Inicio',
    })).toBe(true);
    expect(tracker.track({
      routeKey: '/',
      pageLocation: 'https://alquilatucarro.com/',
      pageTitle: 'Inicio duplicado',
    })).toBe(false);
    tracker.track({
      routeKey: '/bogota',
      pageLocation: 'https://alquilatucarro.com/bogota',
      pageTitle: 'Bogotá',
    });

    expect(events).toHaveLength(2);
    expect(events[0]?.params).toMatchObject({ page_referrer: 'https://google.com/' });
    expect(events[1]?.params).toMatchObject({
      page_referrer: 'https://alquilatucarro.com/',
      page_title: 'Bogotá',
    });
  });

  it('redacts reservation codes from page_location and the next page_referrer', () => {
    const reserveCode = 'RES-PII-123';
    const dataLayer: CapturedEvent[] = [];
    const gtag = vi.fn((
      _command: string,
      name: AnalyticsEventName,
      params: AnalyticsEventMap[AnalyticsEventName],
    ) => dataLayer.push({ name, params }));
    vi.stubGlobal('window', { gtag, dataLayer });
    const tracker = createSpaPageViewTracker(
      'alquilatucarro',
      'https://google.com/',
    );

    expect(tracker.track({
      routeKey: `/reservado/${reserveCode}?email=customer@example.com`,
      pageLocation: `https://alquilatucarro.com/reservado/${reserveCode}?reserveCode=${reserveCode}#${reserveCode}`,
      pageTitle: 'Reserva confirmada',
    })).toBe(true);
    expect(tracker.track({
      routeKey: '/bogota',
      pageLocation: 'https://alquilatucarro.com/bogota',
      pageTitle: 'Bogotá',
    })).toBe(true);

    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenNthCalledWith(1, 'event', 'page_view', expect.objectContaining({
      page_location: 'https://alquilatucarro.com/reservado/[code]',
      page_referrer: 'https://google.com/',
    }));
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'page_view', expect.objectContaining({
      page_location: 'https://alquilatucarro.com/bogota',
      page_referrer: 'https://alquilatucarro.com/reservado/[code]',
    }));
    expect(dataLayer[0]?.params).toMatchObject({
      page_location: 'https://alquilatucarro.com/reservado/[code]',
    });
    expect(dataLayer[1]?.params).toMatchObject({
      page_referrer: 'https://alquilatucarro.com/reservado/[code]',
    });
    expect(JSON.stringify(dataLayer)).not.toContain(reserveCode);
  });

  it('redacts a reservation URL supplied as the initial browser referrer', () => {
    const events: CapturedEvent[] = [];
    const emit = ((name: AnalyticsEventName, params: AnalyticsEventMap[AnalyticsEventName]) => {
      events.push({ name, params });
      return true;
    }) as typeof trackAnalyticsEvent;
    const tracker = createSpaPageViewTracker(
      'alquilatucarro',
      'https://alquilatucarro.com/reservado/REFERRER-SECRET?code=REFERRER-SECRET',
      emit,
    );

    tracker.track({
      routeKey: '/bogota',
      pageLocation: 'https://alquilatucarro.com/bogota',
      pageTitle: 'Bogotá',
    });

    expect(events[0]?.params).toMatchObject({
      page_referrer: 'https://alquilatucarro.com/reservado/[code]',
    });
    expect(JSON.stringify(events)).not.toContain('REFERRER-SECRET');
  });
});

describe('reservation outcome dedupe', () => {
  it('sends a confirmed reserve code only once without adding the code to GA params', () => {
    const events = stubGtag();
    vi.stubGlobal('sessionStorage', storageMock());
    const params = { brand: 'alquilatucarro', currency: 'COP' as const, value: 250_000 };
    expect(trackReservationOutcome('reservation_confirmed', params, 'ABC123')).toBe(true);
    expect(trackReservationOutcome('reservation_confirmed', params, 'ABC123')).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]?.params).not.toHaveProperty('reserve_code');
    expect(events[0]?.params).not.toHaveProperty('transaction_id');
  });
});

describe('contact and error normalization', () => {
  it('classifies page types and collapses backend errors to a safe enum', () => {
    expect(analyticsPageType('/bogota/buscar-vehiculos/x')).toBe('search_results');
    expect(analyticsPageType('/reservado/ABC')).toBe('reservation_result');
    expect(normalizeAnalyticsErrorReason({ error: 'out_of_schedule_pickup_date_error' }))
      .toBe('out_of_schedule');
    expect(normalizeAnalyticsErrorReason({ error: 'raw message with customer data' }))
      .toBe('unknown_error');
  });

  it('delegates WhatsApp clicks to one contact_click with inferred FAB placement', () => {
    const events = stubGtag();
    vi.stubGlobal('sessionStorage', storageMock());
    const anchor = {
      dataset: {},
      getAttribute: () => 'https://wa.me/570000000000',
      closest: (selector: string) => selector.includes('.fab-item') ? ({}) : null,
    } as unknown as HTMLAnchorElement;
    const target = {
      closest: (selector: string) => selector.startsWith('a[') ? anchor : null,
    };
    const handler = createContactClickHandler('alquilatucarro', () => ({
      pageType: 'city',
      city: 'cali',
    }));
    handler({ target } as unknown as Event);

    expect(events.filter((event) => event.name === 'contact_click')).toHaveLength(1);
    expect(events.find((event) => event.name === 'contact_click')).toMatchObject({
      name: 'contact_click',
      params: {
        method: 'whatsapp',
        placement: 'fab',
        page_type: 'city',
        city: 'cali',
      },
    });
    expect(events.find((event) => event.name === 'generate_lead')).toMatchObject({
      params: { brand: 'alquilatucarro', lead_method: 'whatsapp' },
    });
    expect(trackGenerateLead('alquilatucarro', 'chat')).toBe(false);
  });
});
