import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../Searcher.vue', import.meta.url)),
  'utf8',
)

describe('Searcher — pickup/return calendars hide year controls', () => {
  const calendarTags = source.match(/<u-calendar\b[\s\S]*?\/>/g) ?? []

  it('renders both pickup and return u-calendar instances', () => {
    expect(calendarTags.length).toBe(2)
  })

  it('disables year controls on every u-calendar so the << / >> chevrons are not shown', () => {
    for (const tag of calendarTags) {
      expect(tag).toMatch(/:year-controls="false"/)
      expect(tag).not.toMatch(/:year-controls="true"/)
    }
  })
})

describe('Searcher — unlocks after bfcache restoration (browser back button)', () => {
  it('registers a pageshow listener on mount', () => {
    expect(source).toMatch(/addEventListener\(\s*['"]pageshow['"]/)
  })

  it('removes the pageshow listener on unmount to avoid leaks', () => {
    expect(source).toMatch(/removeEventListener\(\s*['"]pageshow['"]/)
  })

  it('only reloads when the page was restored from bfcache (event.persisted)', () => {
    expect(source).toMatch(/event\.persisted|\.persisted/)
  })

  it('performs a full reload to rebuild reactive state (watchers/store sync)', () => {
    expect(source).toMatch(/(window\.)?location\.reload\s*\(/)
  })
})

describe('Searcher — derives results-URL city from pickup branch when route has no city (issue #112 F3)', () => {
  it('instantiates useRoute() to read route.params.city', () => {
    expect(source).toMatch(/const\s+route\s*=\s*useRoute\(\)/)
  })

  it('derives the effective city from the pickup branch via the store method when route.params.city is falsy', () => {
    // route.params.city ?? storeAdminData.searchBranchByCode(lugarRecogida ...)?.city
    expect(source).toMatch(
      /route\.params\.city\s*\?\?\s*storeAdminData\.searchBranchByCode\(\s*lugarRecogida\.value\s*\?\?\s*''\s*\)\?\.city/,
    )
  })

  it('merges the derived city into the local copy without mutating the composable params (spread + city override)', () => {
    expect(source).toMatch(/searchLinkParams\.value\s*=\s*\{\s*\.\.\.params\s*,\s*city:\s*effectiveCity\s*\}/)
  })

  it('on city pages keeps route.params.city, so behavior is unchanged (no regression)', () => {
    // The nullish-coalescing left operand is route.params.city, so a present
    // route city always wins over the derived branch city.
    expect(source).toMatch(/effectiveCity\s*=\s*[\s\S]*?route\.params\.city\s*\?\?/)
  })

  it('recomputes the derived city when lugarRecogida changes (reactivity guard)', () => {
    expect(source).toMatch(/watch\(\s*lugarRecogida\s*,\s*\(\)\s*=>\s*syncSearchLinkParams/)
  })

  it('keeps pickup/return location testids intact', () => {
    expect(source).toMatch(/data-testid="pickup-location-test"/)
    expect(source).toMatch(/data-testid="return-location-test"/)
  })
})

describe('Searcher — defensive body sanitization on mount (issue #25, SCEN-003)', () => {
  it('clears stale pointer-events on body when locked', () => {
    expect(source).toMatch(/body\.style\.pointerEvents\s*=\s*['"]\s*['"]/)
  })

  it('removes stale data-scroll-locked attribute', () => {
    expect(source).toMatch(/removeAttribute\(\s*['"]data-scroll-locked['"]/)
  })

  it('logs a warning for traceability when cleanup runs', () => {
    expect(source).toMatch(/console\.warn\(.*Searcher.*body|console\.warn\(.*body.*Searcher/i)
  })
})
