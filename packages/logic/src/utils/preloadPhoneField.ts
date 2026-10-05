import { loadPhoneValidator } from './validation/phoneValidator';
import { fetchVisitorCountry } from './fetchVisitorCountry';

// Starts the reservation phone field's three loads (input component, full phone
// metadata, visitor country) while the customer browses the results, so the
// field is usually ready when the form opens. usePhoneFieldLoader then gets the
// same promises: the module and both loaders are cached.
//
// Not right away: 2 s after the results appear, so the downloads do not compete
// with the result cards' photos, then at the next idle moment — capped at 3 s so
// a busy page (results + chat) still preloads before the form opens (pre-PR
// performance review, SCEN-019). Silent on failure, like the loader (PR #501):
// the form reports a failed load when it opens.

const START_DELAY_MS = 2000;
const IDLE_TIMEOUT_MS = 3000;

// Read through globalThis: the utils barrel also reaches the server tsconfig,
// which has no DOM lib to declare `window` or `requestIdleCallback`.
const scope = globalThis as {
  window?: unknown;
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => unknown;
};

let started = false;

export function preloadPhoneField(importComponent: () => Promise<unknown>): void {
  if (typeof scope.window === 'undefined' || started) return;
  started = true;

  const run = () => {
    loadPhoneValidator().catch(() => {});
    importComponent().catch(() => {});
    fetchVisitorCountry();
  };

  setTimeout(() => {
    if (typeof scope.requestIdleCallback === 'function') {
      scope.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    } else {
      run();
    }
  }, START_DELAY_MS);
}
