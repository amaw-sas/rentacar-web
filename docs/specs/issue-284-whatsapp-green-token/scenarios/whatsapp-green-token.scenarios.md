---
name: whatsapp-green-token
created_by: grok
created_at: 2026-07-15T14:20:00Z
issue: 284
---

## SCEN-001: single WhatsApp green token drives CTAs
**Given**: a visitor on alquicarros (or alquilame) looking at any WhatsApp CTA surface (header icon, mobile menu pill, hero, contact, FAQ)
**When**: they inspect the button fill color
**Then**: every WhatsApp CTA fills with the institutional WhatsApp green `#25D366` (via the shared token `bg-whatsapp` / `--color-whatsapp`), not the legacy `#090` / `#009900`
**Evidence**: source uses `bg-whatsapp` (no `bg-[#090]` on WA CTAs); theme defines `--color-whatsapp: #25D366`; grep of `packages/ui-alquicarros/app` and `packages/ui-alquilame/app` finds no `bg-[#090]` paired with WhatsApp CTAs

## SCEN-002: text on WhatsApp CTAs meets WCAG AA
**Given**: a WhatsApp CTA with visible text label (hero "WhatsApp", contact "Habla con un Asesor", FAQ "Escríbenos por WhatsApp", mobile menu "WhatsApp")
**When**: contrast is measured between label text and button background (computed style)
**Then**: contrast ratio is ≥ 4.5:1 (target: black text on `#25D366` ≈ 10.6:1)
**Evidence**: CTA classes include `text-black` with `bg-whatsapp`; unit tests assert that pairing; browser computed-style QA when available

## SCEN-003: no dual-green drift remains on primary surfaces
**Given**: the codebase after the change
**When**: searching for WhatsApp green literals and legacy anti-patterns
**Then**: primary WA CTA surfaces do not hardcode `bg-[#090] … text-white`; FAQ and chrome share the same token name; ChatWidget FAB icon color resolves to the same `#25D366` token value
**Evidence**: empty grep for `bg-\[#090\]` under brand `app/` trees (excluding docs/comments if any); ChatWidget uses `var(--color-whatsapp, #25D366)`

## SCEN-004: alquilame chrome still has only WhatsApp as intentional green
**Given**: alquilame layout chrome (header/footer)
**When**: reviewing green surfaces in the layout source
**Then**: no Tailwind `green-N` utilities appear; the only intentional WhatsApp green is the tokenized surface (`bg-whatsapp`), not a free-form green scale
**Evidence**: existing SCEN-CHROME-NOGREEN-style tests updated to assert `bg-whatsapp` and reject `bg-green-\d`
