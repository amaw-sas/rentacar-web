// localStorage persistence for captured attribution, with a 30-day TTL and
// last-touch semantics (every persisted touch overwrites the previous one).
// This is what makes attribution survive across pages: a signal captured on the
// landing page is still there when the user reserves several pages later.
//
// All access is guarded: SSR (no `localStorage`), privacy mode, and quota
// errors degrade to a no-op / null instead of throwing — attribution must never
// break the reservation flow.

import type AttributionInput from '../types/type/AttributionInput';

export const ATTRIBUTION_STORAGE_KEY = 'rentacar_attribution';
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // exactly 30 days

interface StoredAttribution {
  data: AttributionInput;
  ts: number;
}

function getStore(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // access denied (privacy mode / disabled storage)
  }
}

export function persistAttribution(
  attribution: AttributionInput,
  now: number = Date.now(),
): void {
  const store = getStore();
  if (!store) return;
  try {
    const payload: StoredAttribution = { data: attribution, ts: now };
    store.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota exceeded / disabled — non-fatal */
  }
}

export function readStoredAttribution(now: number = Date.now()): AttributionInput | null {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredAttribution;
    if (
      !parsed ||
      typeof parsed.ts !== 'number' ||
      !Number.isFinite(parsed.ts) ||
      parsed.ts < 0 ||
      parsed.ts > now ||
      !parsed.data ||
      typeof parsed.data !== 'object' ||
      Array.isArray(parsed.data)
    ) {
      store.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    if (now - parsed.ts > ATTRIBUTION_TTL_MS) {
      store.removeItem(ATTRIBUTION_STORAGE_KEY); // expired → drop it
      return null;
    }
    return parsed.data;
  } catch {
    try {
      store.removeItem(ATTRIBUTION_STORAGE_KEY);
    } catch {
      /* storage access failed too */
    }
    return null; // corrupt JSON / access error
  }
}
