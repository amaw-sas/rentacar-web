import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../Searcher.vue', import.meta.url)),
  'utf8',
)

// Issue #387: the CTA disables itself with no on-screen reason when the pickup
// branch can't be resolved (branch data still loading, sortedBranches empty
// after a network failure, or a deep-linked unknown slug), and the glow was
// tied to animateSearchButton alone — so a disabled button still glowed, and
// #363's `forwards` froze that false halo. These source-string assertions
// encode the deterministic layer of the #387 scenarios. The .vue imports from
// #components (no vitest alias) so it can't be mounted here — same approach as
// the sibling scheduleGate/Searcher source tests.

describe('SCEN-387-02 — the glow only dresses a button you can actually use', () => {
  it('derives canSearch as the exact negation of the disabled condition (all four terms)', () => {
    // canSearch must AND every reason the button could be unusable, so glow and
    // disabled can both derive from it. Missing searchDisabledGuardSatisfied is
    // the specific #387 regression: a disabled-by-params button that still glows.
    const match = source.match(/const canSearch\s*=\s*computed\(\(\)\s*=>([\s\S]*?)\)\s*;/)
    expect(match, 'canSearch computed not found').toBeTruthy()
    const body = match![1]!
    expect(body).toMatch(/!\s*pendingSearching\.value/)
    expect(body).toMatch(/animateSearchButton\.value/)
    expect(body).toMatch(/searchDisabledGuardSatisfied\.value/)
    expect(body).toMatch(/isSelectionWithinSchedule\.value/)
  })

  it('binds the glow to canSearch, not to animateSearchButton', () => {
    expect(source).toMatch(/'search-button-glow':\s*canSearch/)
    expect(source).not.toMatch(/'search-button-glow':\s*animateSearchButton/)
  })

  it('binds disabled to !canSearch', () => {
    expect(source).toMatch(/:disabled="!canSearch"/)
  })
})

describe('SCEN-387-03 — the pulse re-fires when the CTA becomes usable, without a remount', () => {
  it('re-fires the glow by toggling the class on canSearch, not by keying/remounting', () => {
    // Binding the glow class to canSearch is what re-plays the bounded `forwards`
    // animation: while disabled the class is absent; re-adding it on the
    // false→true transition restarts the animation (the #363 SCEN-363-05
    // mechanism). A :key remount would also work but tears down and refocuses the
    // just-clicked button on the #129 same-URL retry — so there must be NO :key.
    expect(source).toMatch(/'search-button-glow':\s*canSearch/)
    expect(source).not.toMatch(/:key="`cta-/)
  })
})

describe('SCEN-387-01 — the params gate explains why BUSCAR is disabled', () => {
  it('renders a persistent inline message while the branch list is empty', () => {
    expect(source).toMatch(/id="params-gate-message"/)
    expect(source).toMatch(/data-testid="params-gate-message-test"/)
    expect(source).toMatch(
      /No pudimos cargar las sucursales disponibles\. Recarga la página para volver a buscar\./,
    )
  })

  it('gates the message on hydrated + empty branch list so it never flashes on a healthy load', () => {
    // hydrated defaults false and only flips true in onMounted, AFTER the store
    // watchers sync sortedBranches — so on the first client render (empty refs) the
    // red message cannot paint. sortedBranches.length === 0 is the honest signal for
    // "branch data did not load", the only state "recarga la página" fixes.
    expect(source).toMatch(/const hydrated\s*=\s*ref<boolean>\(false\)/)
    expect(source).toMatch(/hydrated\.value\s*=\s*true/)
    expect(source).toMatch(
      /v-if="hydrated && sortedBranches\.length === 0 && isSelectionWithinSchedule"/,
    )
  })

  it('wires the button to whichever gate message is active via a describedby computed', () => {
    expect(source).toMatch(/:aria-describedby="ctaDescribedBy"/)
    const match = source.match(/const ctaDescribedBy\s*=\s*computed\(\(\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;/)
    expect(match, 'ctaDescribedBy computed not found').toBeTruthy()
    const body = match![1]!
    expect(body).toMatch(/return 'params-gate-message'/)
    expect(body).toMatch(/return 'schedule-gate-message'/)
    // the params branch must key off the same empty-branch signal as the <p> v-if,
    // so aria-describedby never points at an unrendered node
    expect(body).toMatch(/hydrated\.value && sortedBranches\.value\.length === 0/)
  })
})
