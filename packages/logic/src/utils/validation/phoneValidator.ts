// Phone validity with libphonenumber's FULL metadata, loaded on demand.
//
// The full ("max") metadata is the only one that knows real number ranges — it
// rejects a US number typed under the Colombian flag (+57 1 817 …), which the
// default metadata accepts. It weighs ~40 kB gzip, so it is kept off the initial
// load: the phone field awaits `loadPhoneValidator()` before it appears, and this
// is the only module that imports libphonenumber-js (dynamically).
//
// vue-tel-input keeps its own `min` metadata on purpose. If it used `max`, a US
// number typed under the CO flag would arrive raw, without +57, and the flag
// message in userInformationForm.ts could not recognise it.

type IsValidPhoneNumber = (text: string) => boolean;

let isValidImpl: IsValidPhoneNumber | null = null;
let loading: Promise<void> | null = null;

/**
 * Loads the full metadata once; every call returns the same promise. A failed
 * import is forgotten so the next call (e.g. the next form mount) retries.
 */
export function loadPhoneValidator(): Promise<void> {
  if (!loading) {
    loading = import("libphonenumber-js/max").then(
      (mod) => {
        isValidImpl = mod.isValidPhoneNumber;
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
  return isValidImpl !== null;
}

/** False until the metadata is loaded — an unchecked number never passes. */
export function isValidPhone(value: string): boolean {
  return isValidImpl !== null && isValidImpl(value);
}
