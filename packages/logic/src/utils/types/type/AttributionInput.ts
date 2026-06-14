// Raw marketing attribution signals captured from the ad URL (click-ids + utm)
// plus the external `document.referrer`, forwarded inside the reservation
// payload as the `attribution` object. Mirrors the receiver contract
// (Apéndice A de rentacar-dashboard#113). Channel derivation lives in the
// dashboard — this side only captures and forwards the raw signals.
export default interface AttributionInput {
  utm_source?: string | null;
  utm_medium?: string | null;
  gclid?: string | null;
  gad_source?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  msclkid?: string | null;
  referrer?: string | null;
}
