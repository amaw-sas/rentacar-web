// Pure extraction of marketing attribution signals from a URL query string and
// `document.referrer`. No DOM, no storage — so each branch is unit-testable in
// the node vitest env. Side effects (persistence) live in `attributionStorage`.
//
// A "touch" = the page load carries at least one marketing signal: a click-id,
// a utm_* param, or an EXTERNAL referrer. Internal navigation (referrer host ==
// own host) is NOT a touch, so it never overwrites a previously captured touch.

import type AttributionInput from '../types/type/AttributionInput';

// Order mirrors the contract (Apéndice A de rentacar-dashboard#113).
const SIGNAL_KEYS = [
  'utm_source',
  'utm_medium',
  'gclid',
  'gad_source',
  'fbclid',
  'ttclid',
  'msclkid',
] as const;

export interface AttributionTouch {
  /** Captured signals. `{}` when the load carries nothing relevant. */
  attribution: AttributionInput;
  /** True when this load should overwrite stored attribution (last-touch). */
  isTouch: boolean;
}

/** Strip a leading `www.` so apex ↔ www referrers count as the same host. */
function normalizeHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase();
}

/** Returns the referrer only when it points to a DIFFERENT (external) host. */
function pickExternalReferrer(referrer: string, currentHost: string): string | null {
  if (!referrer) return null;
  try {
    const referrerHost = normalizeHost(new URL(referrer).hostname);
    if (!referrerHost || referrerHost === normalizeHost(currentHost)) return null;
    return referrer;
  } catch {
    return null; // malformed referrer → ignore
  }
}

export default function buildAttributionTouch(
  search: string | URLSearchParams,
  referrer: string,
  currentHost: string,
): AttributionTouch {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const attribution: AttributionInput = {};
  let hasParam = false;

  for (const key of SIGNAL_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      attribution[key] = value;
      hasParam = true;
    }
  }

  const externalReferrer = pickExternalReferrer(referrer, currentHost);
  if (externalReferrer) attribution.referrer = externalReferrer;

  return { attribution, isTouch: hasParam || externalReferrer !== null };
}
