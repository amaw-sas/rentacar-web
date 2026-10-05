import { loadPhoneValidator } from './validation/phoneValidator';
import { fetchVisitorCountry } from './fetchVisitorCountry';

// Starts the reservation phone field's three loads (input component, full phone
// metadata, visitor country) while the customer browses the results, so the
// field is usually ready when the form opens. usePhoneFieldLoader then gets the
// same promises: the module and both loaders are cached.
//
// Idle time, not right away: the results are rendering and must not wait for a
// chunk the customer may never need. Silent on failure, like the loader (PR #501):
// the form reports a failed load when it opens.

const IDLE_FALLBACK_MS = 1500;

// Read through globalThis: the utils barrel also reaches the server tsconfig,
// which has no DOM lib to declare `window` or `requestIdleCallback`.
const scope = globalThis as {
  window?: unknown;
  requestIdleCallback?: (callback: () => void) => unknown;
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

  if (typeof scope.requestIdleCallback === 'function') scope.requestIdleCallback(run);
  else setTimeout(run, IDLE_FALLBACK_MS);
}
