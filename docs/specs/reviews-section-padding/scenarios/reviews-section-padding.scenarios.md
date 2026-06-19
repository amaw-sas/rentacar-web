---
name: reviews-section-padding
created_by: pablo
created_at: 2026-06-19T00:00:00Z
---

# Google-reviews section padding (operator correction #7: CTA "remontado" en desktop)

Operators reported the "Ver reseñas en Google" CTA on the alquilame home looks
"remontado" (riding onto the next section) on desktop. Root cause: the
`#google-reviews` section (`home/Reviews.vue`) is styled with an UNDEFINED
utility class `section-padding` — no CSS rule defines it, so the section renders
with 0px padding on all sides. Content (rating block, cards, and the bottom CTA)
sits flush against the section edges; the CTA's bottom touches the start of the
next (white Stats) section, so it reads as overlapping. Every sibling home
section uses explicit `py-12 md:py-16` instead.

Measured at 1280px desktop before the fix: section padding-top/bottom = 0px;
CTA bottom (y=4656) == section bottom == next section top (gap 0px).

## SCEN-001: the reviews section has real vertical breathing room on desktop
**Given**: the alquilame home rendered at desktop width (≥1024px)
**When**: the `#google-reviews` section is measured
**Then**: its computed vertical padding is non-zero (top and bottom each ≥ ~40px,
matching the `py-12 md:py-16` used by sibling sections), so the content is inset
from the section edges
**Evidence**: `getComputedStyle('#google-reviews').paddingTop`/`paddingBottom`
both > 0 in a real browser

## SCEN-002: the CTA is not flush against the next section
**Given**: the alquilame home rendered at desktop width
**When**: the "Ver reseñas en Google" CTA and the following section are measured
**Then**: there is a positive gap between the CTA's bottom edge and the bottom of
the gray reviews section (≥ ~40px) — the button no longer touches/overlaps the
next (Stats) section
**Evidence**: `ctaRect.bottom` is at least ~40px above `sectionRect.bottom`, and
`sectionRect.bottom < nextSectionRect.top` no longer coincide at the CTA

## SCEN-003: no undefined `section-padding` utility remains
**Given**: the Reviews.vue source after the fix
**When**: the section element's classes are inspected
**Then**: the section uses defined padding utilities (`py-12 md:py-16`, the
project convention) and does NOT reference the undefined `section-padding` class
**Evidence**: grep of `home/Reviews.vue` shows no `section-padding`; the section
class list contains `py-12` and `md:py-16`

## SCEN-004: no regression to the section's content
**Given**: the alquilame home in a real desktop browser after the fix
**When**: the page loads
**Then**: the rating block ("5,0", "43 reseñas verificadas en Google"), the 3
featured testimonial cards, and the CTA all still render; zero console errors;
the CTA stays horizontally centered
**Evidence**: agent-browser reports the three blocks present, 0 console errors,
CTA horizontally centered within the section
