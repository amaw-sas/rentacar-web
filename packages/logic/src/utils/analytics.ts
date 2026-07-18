/**
 * Typed, no-op-safe GA4 event bridge shared by all three brands.
 *
 * Only Alquilatucarro currently installs gtag. Keeping the bridge in shared
 * logic lets every funnel/contact surface use one contract while calls on the
 * other brands (or with an ad blocker) cleanly do nothing.
 */

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
}

interface BrandParams {
  brand: string;
}

interface ValueParams {
  currency?: 'COP';
  value?: number;
}

export interface AnalyticsEventMap {
  page_view: BrandParams & {
    page_location: string;
    page_title: string;
    page_referrer: string;
  };
  rental_search: BrandParams & {
    pickup_branch?: string;
    return_branch?: string;
    pickup_city?: string;
    rental_days: number;
    rental_type: 'daily' | 'monthly';
  };
  view_item_list: BrandParams & ValueParams & {
    result_count: number;
    items: AnalyticsItem[];
  };
  rental_search_error: BrandParams & {
    reason: AnalyticsErrorReason;
  };
  select_item: BrandParams & ValueParams & {
    items: AnalyticsItem[];
  };
  begin_checkout: BrandParams & ValueParams & {
    items: AnalyticsItem[];
  };
  reservation_submit: BrandParams & ValueParams;
  reservation_confirmed: BrandParams & ValueParams;
  reservation_pending: BrandParams & ValueParams;
  reservation_unavailable: BrandParams & ValueParams;
  reservation_error: BrandParams & {
    reason: ReservationErrorReason;
  };
  contact_click: BrandParams & {
    method: 'whatsapp' | 'telephone';
    placement: ContactPlacement;
    page_type: AnalyticsPageType;
    city?: string;
  };
  generate_lead: BrandParams & {
    lead_method: 'chat' | 'telephone' | 'whatsapp';
  };
  chat_open: BrandParams & {
    source: ChatOpenSource;
  };
  chat_message_sent: BrandParams & {
    message_number: 1;
  };
  chat_quote_received: BrandParams & ValueParams & {
    result_count: number;
    items: AnalyticsItem[];
  };
  chat_reply_while_closed: BrandParams;
  chat_unread_badge_shown: BrandParams;
  chat_reopened_from_badge: BrandParams;
  contact_teaser_shown: BrandParams & { step: 1 | 2 };
  contact_teaser_dismissed: BrandParams;
  contact_teaser_engaged: BrandParams & {
    target: 'whatsapp' | 'llamada' | 'chat';
  };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;
export type AnalyticsErrorReason =
  | 'connection_timeout'
  | 'missing_parameters'
  | 'one_way_not_available'
  | 'out_of_schedule'
  | 'server_error'
  | 'unknown_error';
export type ReservationErrorReason =
  | 'empty_response'
  | 'technical_error'
  | 'unknown_status';
export type ChatOpenSource = 'fab' | 'chat_page' | 'teaser' | 'unread_badge';
export type ContactPlacement =
  | 'category'
  | 'chat'
  | 'error'
  | 'fab'
  | 'footer'
  | 'header'
  | 'result'
  | 'unknown';
export type AnalyticsPageType =
  | 'blog'
  | 'category'
  | 'chat'
  | 'city'
  | 'error'
  | 'home'
  | 'reservation_result'
  | 'search_results'
  | 'other';

type Gtag = (
  command: 'event',
  name: AnalyticsEventName,
  params: AnalyticsEventMap[AnalyticsEventName],
) => void;

function getGtag(): Gtag | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof candidate === 'function' ? candidate : null;
}

/** Send one typed GA4 event, swallowing analytics failures by design. */
export function trackAnalyticsEvent<Name extends AnalyticsEventName>(
  name: Name,
  params: AnalyticsEventMap[Name],
): boolean {
  const gtag = getGtag();
  if (!gtag) return false;
  try {
    gtag('event', name, params);
    return true;
  } catch {
    return false;
  }
}

type ReservationOutcomeName =
  | 'reservation_confirmed'
  | 'reservation_pending'
  | 'reservation_unavailable';

/**
 * Send one terminal reservation outcome. Confirmations are session-deduplicated
 * by reserve code, but that code is deliberately never forwarded to GA4.
 */
export function trackReservationOutcome(
  name: ReservationOutcomeName,
  params: AnalyticsEventMap[ReservationOutcomeName],
  reserveCode?: string | null,
): boolean {
  const dedupeKey =
    name === 'reservation_confirmed' && reserveCode
      ? `rentacar_analytics:${name}:${reserveCode}`
      : null;
  try {
    if (dedupeKey && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) {
      return false;
    }
  } catch {
    /* storage unavailable: still attempt the event */
  }

  const sent = trackAnalyticsEvent(name, params);
  if (sent && dedupeKey) {
    try {
      sessionStorage.setItem(dedupeKey, '1');
    } catch {
      /* analytics succeeded; storage dedupe is best-effort */
    }
  }
  return sent;
}

/** First valid contact action in a browser session = one lead, never a teaser. */
export function trackGenerateLead(
  brand: string,
  leadMethod: AnalyticsEventMap['generate_lead']['lead_method'],
): boolean {
  const dedupeKey = `rentacar_analytics:generate_lead:${brand}`;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) {
      return false;
    }
  } catch {
    /* storage unavailable: still attempt the event */
  }
  const sent = trackAnalyticsEvent('generate_lead', { brand, lead_method: leadMethod });
  if (sent) {
    try {
      sessionStorage.setItem(dedupeKey, '1');
    } catch {
      /* analytics succeeded; storage dedupe is best-effort */
    }
  }
  return sent;
}

export interface PageViewSnapshot {
  routeKey: string;
  pageLocation: string;
  pageTitle: string;
}

const ANALYTICS_URL_BASE = 'https://analytics.invalid';

/** Keep reservation identifiers out of both current and carried page-view URLs. */
function sanitizePageViewUrl(value: string): string {
  if (!value) return value;

  try {
    const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(value);
    const url = new URL(value, ANALYTICS_URL_BASE);
    const pathSegments = url.pathname.split('/');
    const reservationIndex = pathSegments.indexOf('reservado');
    if (reservationIndex < 0 || !pathSegments[reservationIndex + 1]) return value;

    pathSegments[reservationIndex + 1] = '[code]';
    url.pathname = pathSegments.join('/');
    // Result-route query/hash values are not part of the analytics route and
    // may contain the same identifier or other customer-provided values.
    url.search = '';
    url.hash = '';

    return isAbsolute
      ? url.href
      : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    // window.location.href and document.referrer are valid URLs in browsers.
    // This fallback still redacts a reservation segment from synthetic input.
    return value.replace(/(\/reservado\/)[^/?#]+(?:[?#].*)?/i, '$1[code]');
  }
}

/**
 * Explicit SPA page-view tracker. It deduplicates finalized Nuxt routes and
 * carries the previous sanitized virtual URL as the next view's referrer.
 */
export function createSpaPageViewTracker(
  brand: string,
  initialReferrer: string = '',
  emit: typeof trackAnalyticsEvent = trackAnalyticsEvent,
) {
  let lastRouteKey: string | null = null;
  let previousLocation = sanitizePageViewUrl(initialReferrer);

  return {
    track(snapshot: PageViewSnapshot): boolean {
      if (snapshot.routeKey === lastRouteKey) return false;
      const pageLocation = sanitizePageViewUrl(snapshot.pageLocation);
      const sent = emit('page_view', {
        brand,
        page_location: pageLocation,
        page_title: snapshot.pageTitle,
        page_referrer: previousLocation,
      });
      lastRouteKey = snapshot.routeKey;
      previousLocation = pageLocation;
      return sent;
    },
  };
}

export function normalizeAnalyticsErrorReason(error: unknown): AnalyticsErrorReason {
  const code =
    error && typeof error === 'object' && 'error' in error
      ? String((error as { error?: unknown }).error ?? '')
      : '';
  if (code === 'connection_timeout') return 'connection_timeout';
  if (code === 'missing_parameters') return 'missing_parameters';
  if (code === 'one_way_not_available') return 'one_way_not_available';
  if (code.startsWith('out_of_schedule_') || code === 'same_hour_error') {
    return 'out_of_schedule';
  }
  if (code === 'server_error') return 'server_error';
  return 'unknown_error';
}

export function analyticsPageType(path: string): AnalyticsPageType {
  if (path === '/') return 'home';
  if (path === '/chat' || path.startsWith('/chat/')) return 'chat';
  if (/\/(reservado|pendiente|sindisponibilidad)(\/|$)/.test(path)) {
    return 'reservation_result';
  }
  if (/\/categoria\/[^/]+/.test(path)) return 'category';
  if (path.includes('/buscar-vehiculos') || path === '/reservas' || path.startsWith('/reservas/')) {
    return 'search_results';
  }
  if (path === '/error' || path.startsWith('/error/')) return 'error';
  if (path === '/blog' || path.startsWith('/blog/')) return 'blog';
  return 'other';
}

type ClosestTarget = {
  closest: (selector: string) => Element | null;
};

function placementFor(anchor: Element, pageType: AnalyticsPageType): ContactPlacement {
  const declared = (anchor.closest('[data-analytics-placement]') as HTMLElement | null)
    ?.dataset.analyticsPlacement;
  const allowed: readonly ContactPlacement[] = [
    'category', 'chat', 'error', 'fab', 'footer', 'header', 'result', 'unknown',
  ];
  if (declared && allowed.includes(declared as ContactPlacement)) {
    return declared as ContactPlacement;
  }
  if (anchor.closest('header')) return 'header';
  if (anchor.closest('footer')) return 'footer';
  if (anchor.closest('.fab-item, #contact-fab-menu')) return 'fab';
  if (pageType === 'chat') return 'chat';
  if (pageType === 'category') return 'category';
  if (pageType === 'reservation_result') return 'result';
  if (pageType === 'error') return 'error';
  return 'unknown';
}

export interface ContactClickContext {
  pageType: AnalyticsPageType;
  city?: string;
}

/** Build the one delegated contact handler installed by each brand plugin. */
export function createContactClickHandler(
  brand: string,
  getContext: () => ContactClickContext,
) {
  return (event: Event): void => {
    try {
      const target = event.target as (EventTarget & Partial<ClosestTarget>) | null;
      if (!target || typeof target.closest !== 'function') return;
      const anchor = target.closest(
        'a[href^="tel:"],a[href*="wa.me"],a[href*="api.whatsapp.com"],a[href*="web.whatsapp.com"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      const method = href.startsWith('tel:') ? 'telephone' : 'whatsapp';
      const context = getContext();
      trackAnalyticsEvent('contact_click', {
        brand,
        method,
        placement: placementFor(anchor, context.pageType),
        page_type: context.pageType,
        ...(context.city ? { city: context.city } : {}),
      });
      if (anchor.dataset.analyticsLead !== 'false') {
        trackGenerateLead(brand, method);
      }
    } catch {
      /* contact navigation must never depend on analytics */
    }
  };
}
