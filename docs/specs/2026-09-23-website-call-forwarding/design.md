# Google forwarding number on alquilatucarro call links

Date: 2026-09-23. Scope: `packages/ui-alquilatucarro` only.

## Why

Many bookings start with an ad, continue with a phone call and are closed by a
salesperson. Google Ads never sees them. A Google Ads "website call" conversion
swaps the phone number for a Google forwarding number, only for visitors who
arrived from an ad, and counts calls of 60 s or more as a conversion tied to the
keyword and ad group. Background and data:
`docs/seo/ads/2026-09-23-revision-y-conversiones-invisibles.md`.

## What exists in Google Ads (created 2026-09-23)

- Conversion action "Llamada (+57 301 672 9250)", ctId 7790622889.
- Category "Cliente potencial por teléfono", **secondary** (does not drive bidding).
- One conversion per click, 60 s minimum call length, 30-day window, value 1 COP.
- Snippet from Google Ads:

```html
<script>
  gtag('config', 'AW-18234487332/SC3KCKnx7YIdEKTk8PZD', {
    'phone_conversion_number': '+57 301 672 9250'
  });
</script>
```

## Design

- The site has no Google Ads tag today, only GA4 (`G-1G7MWTDK71`). The snippet
  needs gtag to know the `AW-18234487332` destination.
- Use `phone_conversion_callback` instead of letting Google rewrite page text.
  The business phone and the WhatsApp number are the same digits
  (573016729250), and Google's text replacement could touch WhatsApp links or
  the /gana link text that labels a WhatsApp link.
- The callback writes the forwarding number into shared reactive state. Only
  the three `tel:` links read it: mobile menu (default layout), chat call
  button, /tiktok "Llamar". Everything else keeps `franchise.phone`.
- JSON-LD `telephone` stays server-rendered from `franchise.phone`.
- Failure is silent: no callback (organic visit, ad blocker, timeout) means the
  real number stays.

## Scenarios (holdout, written before code)

The project's SDD guard rejects new files under `docs/specs/*/scenarios/`
inside Orca linked worktrees (it assumes Ralph teammate worktrees). The
scenarios live here, committed before implementation, with the same contract.

### SCEN-001: ad visitor calls the forwarding number from the mobile menu
**Given**: a visitor on alquilatucarro.com for whom Google's phone snippet returns the forwarding number "+57 601 555 0100" (formatted) / "+576015550100" (mobile)
**When**: they open the mobile menu and look at the call link
**Then**: the call link points to tel:+576015550100, not to tel:+573016729250
**Evidence**: DOM href of the tel: anchor in the default layout after the callback fires

### SCEN-002: ad visitor calls the forwarding number from the chat and the /tiktok page
**Given**: the same forwarding number as SCEN-001
**When**: they open the chat's call button, or visit /tiktok and look at the "Llamar" option
**Then**: both call links point to tel:+576015550100, and the chat's accessible label says "Llamar al +57 601 555 0100"
**Evidence**: DOM href and aria-label of those tel: anchors

### SCEN-003: organic visitor keeps the real number
**Given**: a visitor for whom the snippet never returns a number (organic visit, ad blocker, gtag missing or slow)
**When**: they look at any call link
**Then**: every call link points to tel:+573016729250 and nothing breaks on the page (no console error)
**Evidence**: DOM hrefs with no callback fired; browser console free of errors from the plugin

### SCEN-004: WhatsApp is never touched
**Given**: the forwarding number from SCEN-001 is active
**When**: the visitor looks at any WhatsApp link, including the /gana "Contáctanos" link whose text shows the number
**Then**: WhatsApp links still point to the brand's WhatsApp line and the /gana link text still shows that line, never the forwarding number
**Amended 2026-09-24**: PR #494 moved the web WhatsApp line to https://wa.me/573104345165 ("+57 310 434 5165") while calls stay on +57 301 672 9250. The original values were the WhatsApp line at the time; the invariant (WhatsApp never takes the forwarding number) is unchanged.
**Amended 2026-10-03**: the 301 line was restored and WhatsApp went back to https://wa.me/573016729250 ("+57 301 672 9250"), the same number as calls. The invariant is unchanged: WhatsApp never takes the forwarding number.
**Evidence**: DOM href/text of wa.me anchors after the callback fires

### SCEN-005: search engines keep the real number
**Given**: the forwarding number is active in the browser
**When**: a crawler reads the page's structured data
**Then**: the JSON-LD telephone stays "+57 301 672 9250"
**Evidence**: JSON-LD in the SSR HTML of the home page

### SCEN-006: the Google Ads tag loads with the phone snippet on alquilatucarro only
**Given**: a page view on alquilatucarro.com
**When**: the page finishes loading
**Then**: gtag receives a config for AW-18234487332/SC3KCKnx7YIdEKTk8PZD with phone_conversion_number "+57 301 672 9250", and the alquilame and alquicarros sites do not load AW-18234487332
**Evidence**: dataLayer entries and network request for AW-18234487332 on alquilatucarro; absence in the other two brands
