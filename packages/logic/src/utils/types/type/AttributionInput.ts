// Raw marketing attribution signals captured from the ad URL (click-ids + utm)
// plus the external `document.referrer`, forwarded inside the reservation
// payload as the `attribution` object. Mirrors the receiver contract
// (Apéndice A de rentacar-dashboard#113). Channel derivation lives in the
// dashboard — this side only captures and forwards the raw signals.
export default interface AttributionInput {
  attribution_version?: 2;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  gad_source?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  dclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  twclid?: string | null;
  msclkid?: string | null;
  referrer?: string | null;
  landing_url?: string | null;
  captured_at?: string | null;
  brand?: string | null;
}
