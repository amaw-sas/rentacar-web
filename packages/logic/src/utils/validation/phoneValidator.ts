// Phone validity with libphonenumber's FULL metadata, loaded on demand.
//
// The full ("max") metadata is the only one that knows real number ranges — it
// rejects a US number typed under the Colombian flag (+57 1 817 …), which the
// default metadata accepts. It weighs ~40 kB gzip, so it is kept off the initial
// load: the phone field awaits `loadPhoneValidator()` before it appears, and
// libphonenumber-js is only reached through the dynamic import below.
//
// vue-tel-input keeps its own `min` metadata on purpose. If it used `max`, a US
// number typed under the CO flag would arrive raw, without +57, and the flag
// message in userInformationForm.ts could not recognise it.

import type { CountryCode } from 'libphonenumber-js';

type PhoneValidatorApi = typeof import('./phoneValidatorMax');

let api: PhoneValidatorApi | null = null;
let loading: Promise<void> | null = null;

// Flag currently shown in the phone field (ISO2). vue-tel-input only prefixes the
// dial code when it accepts the number, so for raw digits this is the only way to
// know which country the customer has selected. Written by usePhoneFieldLoader.
let activeCountry: string | null = null;

/**
 * Loads the full metadata once; every call returns the same promise. A failed
 * import is forgotten so the next call (e.g. the next form mount) retries.
 */
export function loadPhoneValidator(): Promise<void> {
  if (!loading) {
    // Client only. The server never validates phones, and keeping the import()
    // out of the Nitro bundle matters: there libphonenumber-js is external, and
    // once this module became reachable from SSR pages Rollup merged
    // phoneValidatorMax into the shared server chunk with a bare
    // `import '…/max/index.js'` — "isValidPhoneNumber is not defined", a 500 on
    // every page. `import.meta.server` is a build-time constant, so the branch
    // and the import() are dropped from the server build.
    const source: Promise<PhoneValidatorApi> = import.meta.server
      ? Promise.reject(new Error("phone validation is client-only"))
      : import("./phoneValidatorMax");
    loading = source.then(
      (mod) => {
        api = mod;
      },
      (error) => {
        loading = null;
        throw error;
      }
    );
  }
  return loading;
}

export function isPhoneValidatorReady(): boolean {
  return api !== null;
}

/** False until the metadata is loaded — an unchecked number never passes. */
export function isValidPhone(value: string): boolean {
  return api !== null && api.isValidPhoneNumber(value);
}

export function setActivePhoneCountry(iso2: string | null): void {
  activeCountry = iso2 ? iso2.toUpperCase() : null;
}

export function getActivePhoneCountry(): string | null {
  return activeCountry;
}

/**
 * True when the digit count cannot be right: too short, too long, or between two
 * valid lengths. `text` is either an international number (`+…`, `country`
 * omitted) or national digits for `country`. Without the metadata or a country
 * nothing can be measured, so it counts as a length problem (the neutral
 * "incomplete" message).
 */
export function hasPhoneLengthProblem(text: string, country?: string | null): boolean {
  if (!api) return true;
  if (!text.startsWith("+") && !country) return true;
  try {
    const result = api.validatePhoneNumberLength(text, (country ?? undefined) as CountryCode | undefined);
    return result === "TOO_SHORT" || result === "TOO_LONG" || result === "INVALID_LENGTH";
  } catch {
    return true;
  }
}
