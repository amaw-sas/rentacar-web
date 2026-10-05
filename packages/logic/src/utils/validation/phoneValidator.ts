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
    loading = import("./phoneValidatorMax").then(
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
 * True when national digits typed under the active flag are fewer than that
 * country needs. Unknown flag or metadata not loaded → true (treated as
 * incomplete, the most neutral message).
 */
export function isTooShortForActiveCountry(digits: string): boolean {
  if (!api || !activeCountry) return true;
  try {
    return api.validatePhoneNumberLength(digits, activeCountry as CountryCode) === 'TOO_SHORT';
  } catch {
    return true;
  }
}
