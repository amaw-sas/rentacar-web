# C5b round-2 payload and visual evidence

Application commit under test: `dee50ddcc8ab98de90b13c49ef90b43a79c52432`  
Production origin: `https://alquilatucarro.com`  
Preview origin: `https://alquilatucarrocom-git-diego-alex-605f2e-info-42181061s-projects.vercel.app`

Every image contains a visible audit strip with the requested origin, route,
capture phase, stylesheet mode, UTC timestamp, and measured FCP. Captures use
Playwright Chromium at 1440x900, DPR 1, with service workers blocked.

## Initial JavaScript transfer audit

Measured at `2026-07-18T23:30:12.607Z`. Both origins use the same extractor and
transfer rule: collect the unique, double-quoted same-origin `/_nuxt/*.js`
references from the initial HTML, fetch every successful asset in Chromium, and
sum `PerformanceResourceTiming.encodedBodySize` (Brotli transfer bytes). The one
generated `/_nuxt/builds/meta/*.js` URL returning 404 on each page/origin is
excluded consistently.

| Route | Production | Preview | Change |
|---|---:|---:|---:|
| `/` | 332.354 KiB / 32 assets | 275.059 KiB / 26 assets | **-57.295 KiB (-17.24%)** |
| `/bogota` | 376.502 KiB / 35 assets | 354.328 KiB / 34 assets | **-22.174 KiB (-5.89%)** |

## Capture sequence

Production is captured after a cold, fully settled navigation. Preview adds an
auditable no-FOUC sequence for each route:

1. cold first paint with all external stylesheets blocked (inline critical CSS only);
2. reload first paint under the same critical-only condition;
3. reload after network idle with all stylesheets restored.

| File | Phase | Captured UTC | FCP | DOMContentLoaded | Load | Fonts | SHA-256 |
|---|---|---|---:|---:|---:|---|---|
| `home-production-settled.jpg` | production, settled cold navigation | 23:32:10.294 | 580 ms | 1116 ms | 1413 ms | loaded | `a0896db4ad01ee870bece2e876fe11c4d54a2d429fd5d344f90e40f74b9b5ead` |
| `home-preview-first-paint-cold.jpg` | preview, cold critical-only first paint | 23:32:11.321 | 356 ms | 776 ms | 812 ms | loaded | `647b633f90da6ad25ed0365c18dd2fdf92df1434619adf4f920740180782d5e5` |
| `home-preview-first-paint-reload.jpg` | preview, reload critical-only first paint | 23:32:11.833 | 156 ms | 351 ms | 466 ms | loaded | `2dca6e9ac6f11a49d37c11bd1f117906afdc3e6a4a64b67dcdbdf31ea60c8dc3` |
| `home-preview-settled.jpg` | preview, settled reload | 23:32:13.054 | 136 ms | 124 ms | 239 ms | loaded | `3952ccd7ecd9e570e2be8094adfe2612ccad47e47332148d73d36b6ab912982d` |
| `bogota-production-settled.jpg` | production, settled cold navigation | 23:32:15.025 | 316 ms | 585 ms | 975 ms | loaded | `59c607195bf101a6840883914127c394ee8cca9382bad94bccae8483bc3bf26c` |
| `bogota-preview-first-paint-cold.jpg` | preview, cold critical-only first paint | 23:32:15.893 | 376 ms | 637 ms | 743 ms | loaded | `63776259e035389d82dd151fe5318618484c507eb2b926f8651dbbccabc4c62f` |
| `bogota-preview-first-paint-reload.jpg` | preview, reload critical-only first paint | 23:32:16.342 | 136 ms | 291 ms | not reached | loaded | `c8eb2e767c6dd0ebe5bd7da7fa32997a5ff6bd8af38b8530a0fa62dae366d2f9` |
| `bogota-preview-settled.jpg` | preview, settled reload | 23:32:17.860 | 148 ms | 143 ms | 240 ms | loaded | `a091b9804d1615a6012802f931b594e99c58e86703a65e0b97b180cf34493fba` |

All timestamps are on 2026-07-18 UTC. The critical-only captures deliberately
do not claim pixel identity with the settled page; they make the actual inline
first-paint geometry inspectable instead of presenting two unlabeled settled
captures as FOUC evidence.
