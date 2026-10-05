// Non-blocking hint for a Colombian mobile typed under a foreign flag.
//
// 6 in 10 Colombian mobiles are also valid US/Canada numbers (305 Miami,
// 312 Chicago, 315 Syracuse…), so under the US flag `315 888 9999` passes as
// `+1 315 888 9999`. Rejecting it would also reject real US customers, so on
// 2026-10-05 the owner chose a hint that never blocks the submit
// (colombian-mobile-hint.scenarios.md, SCEN-016..018).

import { isPhoneValidatorReady, isValidPhone } from './validation/phoneValidator';

/**
 * True when `value` is valid for the flag on screen (not Colombia) and its last
 * 10 digits also form a valid Colombian mobile (10 digits starting with 3).
 * An invalid number gets the field's error instead, never this hint.
 */
export function shouldHintColombianMobile(
  value: string | null | undefined,
  flag: string | null | undefined
): boolean {
  if (!value || !flag || flag.toUpperCase() === 'CO') return false;
  if (!isPhoneValidatorReady()) return false;
  const last10 = value.replace(/\D/g, '').slice(-10);
  return isValidPhone(value) && /^3\d{9}$/.test(last10) && isValidPhone(`+57${last10}`);
}
