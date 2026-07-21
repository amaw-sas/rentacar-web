# A1/A5 — Console + field data (orchestrator, via Orca embedded browser)

## PageSpeed (pagespeed.web.dev UI — PSI API keyless is quota-0, use this instead)

### alquilatucarro.com/ — mobile (18-jul 12:22 COT)
- **Field (CrUX 28d): Core Web Vitals = FAILED.** LCP 2.3s (pass, borderline) · **INP 269ms (needs improvement)** · **CLS 0.24 (FAIL, >0.1)** · FCP 1.5s · TTFB 1.1s (high).
- Lab (Lighthouse 13.4, Moto G Power): Perf **78**, lab LCP **5.5s**, TBT 160ms, lab CLS 0, SI 1.8s. A11y 96 (contrast), BP 100, SEO 100.
- Opportunities: image delivery −125KiB, unused JS −141KiB, 4 long tasks, 12 non-composited animations.

### alquilatucarro.com/bogota — mobile (18-jul 12:25 COT)
- Field (origin-level): same CWV fail — LCP 2.4s · INP 267ms · **CLS 0.24** · TTFB 1.3s.
- Lab: Perf **72**, lab LCP **5.7s**, TBT 290ms, lab CLS 0.065, SI 2.9s.
- Unused JS −157KiB, 4 long tasks, **21 non-composited animations**, "Causantes del cambio de diseño" flagged.

### Key deduction for implementers
**Field CLS 0.24 with lab CLS ≈0 ⇒ layout shifts happen during real sessions (post-load/interaction), not initial render.** Suspects: carousel/embla, teaser/chat FAB entrance animations, font swap, images without reserved space on dynamic content. INP ~270ms correlates with long tasks + heavy hydration (PERF-1/PERF-2 in findings-perf.md).

## GSC (captured this morning, session now expired — B1)
- alquilatucarro.com: 29 indexed / 598 not-indexed. Buckets: 303 alternate-with-canonical (by design), 179 page-with-redirect, **82 crawled-not-indexed**, **14 soft-404**, 6×404, 10 discovered-not-indexed, 1 noindex, 1 redirect-error, 1 5xx. Report lag: "Última actualización 9/7/26".
- Duplicate-canonical alert = /pereira only, self-resolved 16-jul (dead satellite domain was the cause).
- Sitemap submitted: only https://alquilatucarro.com/sitemap.xml.
- PENDING (blocked by B1 re-login): URL lists of the 82/14/179/6 buckets; Performance (queries/CTR); GA4 console (A5).

## Hypothesis mapping (to verify once B1 clears)
- 14 soft-404 ↔ F4 (any reservation code returns 200) and/or dead search-result states.
- 82 crawled-not-indexed ↔ F8 (metro-pair template overlap) + F9 (templated snippets) + redirected CTA noise (F3).
- 179 redirects ↔ F3 (CTAs generating obsolete redirecting URLs) + legacy routeRules.

## A1 COMPLETED (18-jul 15:50 COT, session restored)

### Root-cause concentration: dated search URLs
- **Soft-404 (14):** 12/14 are `/{city}/buscar-vehiculos/.../fecha-*` with PAST dates (empty results). Outliers: /blog/alquilar-carro-medellin-guia, /politica-privacidad (likely transient fetch hiccups — both 200+canonical today).
- **Crawled-not-indexed (82, p1 sample):** 12/12 dated `buscar-vehiculos` URLs. BENIGN — we never want these indexed; count will decay as C2 (F3) stops generating them.
- **Redirects (179, p1 sample):** 11/11 dated `buscar-vehiculos` (aeropuerto variants 12:00pm format → redirected). Same family.
- **Conclusion: ~578 of 598 "not indexed" = one family (dated search URLs), already addressed by PR #355 (stop generating) + PR #353 (signal hygiene). The 598 number is mostly cosmetic noise, NOT a ranking problem. Expect slow decay, not instant drop.**

### 404s (6) — each needs a distinct micro-fix
1. `/{search_term_string}` → **broken WebSite SearchAction JSON-LD template being crawled literally → assign to C3 (in flight)**.
2. `/ibagué` (accented) → 301 to /ibague (add redirect rule; assign C3 or follow-up).
3. `/valledupar|/santa-marta|/monteria + /buscar-vehiculos` (bare, no params) → 404 today; 301 → /{city} would capture link equity (follow-up micro-fix).
4. `/blog/alquiler-de-carros-en-manizales-guia-2026` → old slug; 301 to current guide if exists.

## A5 COMPLETED — GA4 console (18-jul 16:05 COT)
Account "rentadora" (60067300), full tree extracted from window.preload:
- **alquilatucarro.com - GA4 (prop 390679414): HEALTHY.** Last 7d: 2.4k active users (+33%), 12k events (+37%), 456 key events (+11%), 3.1k sessions. Realtime working (16 users now).
- **alquilame.co - GA4 (prop 371080440, G-ZPZC1TP9T0): EXISTS but ZERO data ever** — property created, never wired in code. → A4-01 for alquilame is now implementable: wire G-ZPZC1TP9T0 into packages/ui-alquilame config.
- **alquicarros: NO GA4 property exists.** USER must create it (or approve agent-guided creation), then wire the new ID.
- ~17 satellite-domain GA4 properties exist (alquilerdecarros*, alquilercarros*) — all presumably dead like their sites; candidates for cleanup when satellites get 301'd.
