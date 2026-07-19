# Vehicle-results CLS regression proof

This proof targets the deep Bogotá results route used in the C5a review. The
script fixes Chromium at `1461x900`, DPR 2, installs a buffered
`PerformanceObserver` before navigation, detects the loading-to-card handoff,
and includes the following second so async carousel insertion is covered.

## Reproduction

With the AlquilaTuCarro production environment configured:

```sh
pnpm build:alquilatucarro
PORT=4178 node packages/ui-alquilatucarro/.output/server/index.mjs
pnpm perf:vehicle-results-cls
```

`perf:vehicle-results-cls` fails when `listInsertionShift` exceeds `0.001`.
The route, viewport, settle time, base URL, and threshold can be overridden by
the `CLS_ROUTE`, `CLS_SETTLE_MS`, `CLS_BASE_URL`, and
`CLS_MAX_INSERTION_SHIFT` environment variables.

## Measured before and after

Before (`8e22fec`, immutable review preview):

- server HTML results shell: absent; reserved cards: 0
- total no-input layout shift: `0.3618529318007543`
- results loading/insertion sequence: `0.17357671034078997`
- late async card/carousel portion: `0.0262499174`

After this fix (fresh local production build, two independent Chromium runs):

- server HTML results shell: present; reserved cards: 12
- loaded cards: 12
- `listInsertionShift`: `0` and `0`
- total no-input layout shift: `0.1552164753988001` in both runs, from the
  earlier header/hero critical-CSS transition, before the results handoff

The fix server-renders persistent, inline-sized card slots and a persistent
availability-status slot. Loaded cards reuse those same indexed wrappers, and
both available and unavailable cards reserve the async carousel's 5:3 box.
