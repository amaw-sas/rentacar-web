// Issue #406 — carrying a route-correction notice across the middleware's redirect.
//
// validateSearchParams corrects a broken deep-link and redirects to the fixed
// URL. It used to announce the correction with createMessage() right before
// returning navigateTo(); the user never saw any of the five notices, for two
// unrelated reasons:
//
//   - Hard load: the middleware runs on the SERVER and navigateTo answers 302.
//     A redirect carries no payload, so the toast state dies before a client
//     exists to render it.
//   - Client navigation: the toast does reach the DOM, and doSearch opens with
//     flushMessages(). Measured lifetime, 53 ms.
//
// So the notice travels in the URL itself — the one thing that survives a
// redirect by construction — as a stable CODE, and is translated back into copy
// at the drain point (useSearchByRouteParams, after doSearch). Codes are
// resolved through this catalog and nothing else: `aviso` is user-writable, so
// an unknown value yields no message and its raw text never reaches the DOM.
//
// Holdout: docs/specs/issue-406-middleware-route-notices/scenarios/middleware-route-notices.scenarios.md

// Types
import type Message from './types/type/Message';

/** Query key that carries the notice through the redirect. */
export const SEARCH_PARAM_NOTICE_KEY = 'aviso';

/**
 * Cap on chained codes. Corrections can chain (a city-foreign pickup branch
 * keeps the user's dates, so it can redirect again into the 30-day cap), and
 * the URL must not grow without bound if that chain ever misbehaves. Three is
 * above the longest reachable chain and below what would stack an unreadable
 * pile of toasts.
 */
const MAX_NOTICE_CODES = 3;

export type SearchParamNoticeCode =
  | 'sede'
  | 'sede-ciudad'
  | 'hora'
  | 'parametros'
  | 'duracion';

/**
 * Code → copy. The wording is carried over verbatim from the createMessage
 * calls this replaces: #406 is about the notice arriving, not about rewording
 * it. `title` stays unset, matching how these notices render today.
 */
export const SEARCH_PARAM_NOTICES: Record<SearchParamNoticeCode, Message> = {
  sede: {
    type: 'info',
    message: 'Ubicación inválida. Se ajustó a la sede por defecto.',
  },
  'sede-ciudad': {
    type: 'info',
    message:
      'La sede de recogida no corresponde a la ciudad; se ajustó a la sede por defecto.',
  },
  hora: {
    type: 'info',
    message: 'Formato de hora inválido. Se ajustó al valor por defecto.',
  },
  parametros: {
    type: 'info',
    message: 'Parámetros inválidos. Se ajustaron a los valores por defecto.',
  },
  duracion: {
    type: 'info',
    message:
      'La fecha de devolución ha sido ajustada a 30 días después de la fecha de recogida.',
  },
};

function isNoticeCode(value: string): value is SearchParamNoticeCode {
  return Object.prototype.hasOwnProperty.call(SEARCH_PARAM_NOTICES, value);
}

/**
 * Reads the codes a URL is carrying, keeping only those in the catalog.
 *
 * A duplicated key (`?aviso=a&aviso=b`, from a hand-edited or doubly-appended
 * link) arrives as an ARRAY — take the first element, the same guard
 * `firstQueryValue` applies in useSearchByQueryParams (#402). Everything else
 * — unknown codes, markup, an empty string — is dropped silently: the caller
 * still strips the param, so a junk value disappears from the URL without ever
 * being rendered.
 */
export function readNoticeCodes(raw: unknown): SearchParamNoticeCode[] {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first == null) return [];

  const seen: SearchParamNoticeCode[] = [];
  for (const part of String(first).split(',')) {
    const code = part.trim();
    if (isNoticeCode(code) && !seen.includes(code)) seen.push(code);
    if (seen.length === MAX_NOTICE_CODES) break;
  }
  return seen;
}

/**
 * Adds a code to a redirect target's query, preserving every other key.
 *
 * Accumulates rather than overwrites. Corrections chain: on alquilatucarro a
 * city-foreign pickup branch is realigned first (dates untouched), and a
 * >30-day window is then capped on the next pass. Overwriting would drop the
 * branch notice and leave the user unaware that their pickup city changed —
 * the exact silence this issue closes, reintroduced by its own fix.
 */
export function withNoticeCode<T extends Record<string, unknown>>(
  query: T,
  code: SearchParamNoticeCode,
): T & Record<string, unknown> {
  const carried = readNoticeCodes(query[SEARCH_PARAM_NOTICE_KEY]);
  const next = carried.includes(code) ? carried : [...carried, code];

  return {
    ...query,
    [SEARCH_PARAM_NOTICE_KEY]: next.slice(0, MAX_NOTICE_CODES).join(','),
  };
}
