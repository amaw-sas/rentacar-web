// Google Ads "website call" conversions: Google swaps the business number for a
// forwarding number, only for visitors who arrived from an ad, and counts calls
// to it. We take the number through `phone_conversion_callback` instead of
// letting Google rewrite page text, because the same digits are also the
// WhatsApp number and those links must never change.
// Spec: docs/specs/2026-09-23-website-call-forwarding/design.md

export interface CallForwardingNumber {
  /** Number to show, in the same format as the visible business number. */
  display: string;
  /** Number to dial, e.g. '+576015550100'. */
  tel: string;
}

export interface PhoneConversionConfig {
  phone_conversion_number: string;
  phone_conversion_callback: (formattedNumber: string, mobileNumber: string) => void;
}

/** Shared useState key for the forwarding number (null until Google answers). */
export const CALL_FORWARDING_STATE_KEY = 'call-forwarding-number';

export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function buildPhoneConversionConfig(
  visibleNumber: string,
  onNumber: (number: CallForwardingNumber) => void,
): PhoneConversionConfig {
  return {
    phone_conversion_number: visibleNumber,
    phone_conversion_callback: (formattedNumber, mobileNumber) => {
      if (typeof formattedNumber !== 'string' || typeof mobileNumber !== 'string') return;
      // A usable number has at least 7 digits; anything else keeps the real one.
      if (!formattedNumber.trim() || (mobileNumber.match(/\d/g) ?? []).length < 7) return;
      try {
        onNumber({ display: formattedNumber, tel: mobileNumber });
      } catch {
        // Google's tag must never see our errors; the real number stays.
      }
    },
  };
}

export function resolveCallPhone(
  businessPhone: string,
  forwarding: CallForwardingNumber | null,
): { display: string; tel: string; telHref: string } {
  const display = forwarding ? forwarding.display : businessPhone;
  const tel = (forwarding ? forwarding.tel : businessPhone).replace(/[^\d+]/g, '');
  return { display, tel, telHref: `tel:${tel}` };
}
