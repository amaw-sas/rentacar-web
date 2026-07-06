import { isValidPhoneNumber } from 'libphonenumber-js';

// Mexican mobiles are shown in WhatsApp with a legacy `1` after the country code
// (+52 1 …). That `1` was the operator prefix required to reach MX mobiles until
// Mexico abolished it nationally in 2019. E.164 / libphonenumber-js now treats
// +521XXXXXXXXXX (11 digits) as INVALID — the canonical form is +52XXXXXXXXXX
// (10 digits). Operators copy the number verbatim from the client's WhatsApp, so
// the reservation form rejected a real, reachable number.
//
// This normalizer strips the legacy 1 ONLY when the resulting +52 + 10-digit
// number is itself valid, so it can never turn junk into a false positive.
const MX_LEGACY_MOBILE = /^\+521(\d{10})$/;

/**
 * Canonicalizes a phone number for validation and persistence.
 *
 * Currently the single rule is the Mexican legacy-mobile `1` prefix. Any other
 * input (empty, nullish, non-MX, or a `+521` string that is not a valid 10-digit
 * MX mobile once stripped) is returned byte-for-byte unchanged.
 */
export function normalizePhoneNumber<T extends string | null | undefined>(input: T): T {
  if (!input) return input;

  const compact = input.replace(/[^\d+]/g, '');
  const mx = compact.match(MX_LEGACY_MOBILE);
  if (mx) {
    const candidate = `+52${mx[1]}`;
    if (isValidPhoneNumber(candidate)) return candidate as T;
  }

  return input;
}
