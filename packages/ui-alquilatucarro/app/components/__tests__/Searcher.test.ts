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

describe('Searcher — defensive body sanitization on mount (issue #25, SCEN-003)', () => {
  // The reka-ui Dialog modal lock can leak `pointer-events: none` onto the
  // shared <body> when a slideover unmounts via route change without
  // transitioning v-model:open to false. Layer 2 of the fix sanitizes any
  // stale lock when Searcher mounts (Layer 1 prevents the leak at source).
  // These assertions guard the cleanup code from accidental removal.

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

describe('Searcher — mobile date cannot be cleared (no-clear guard)', () => {
  // The mobile pickup/return fields are native <input type="date">, whose browser
  // clear affordance (Android picker / desktop ✕) would otherwise blank the field.
  // The @change clamp repaints the last valid value on an empty input, and the
  // inputs bind :value one-way so the empty `input` event never reaches the shared
  // ref (which the desktop Reka UI picker requires as a CalendarDate, see #174).

  it('binds both mobile date inputs one-way with :value (not v-model)', () => {
    expect(source).toMatch(/name="pickup-date-mobile"[\s\S]{0,40}?:value="selectedPickupDate/)
    expect(source).toMatch(/name="return-date-mobile"[\s\S]{0,40}?:value="selectedReturnDate/)
  })

  it('repaints the last valid value when the mobile date input is cleared', () => {
    expect(source).toMatch(/if\s*\(\s*!value\s*\)\s*\{[\s\S]*?target\.value\s*=\s*fallback/)
  })

  it('passes the current date as fallback to the clamp from both mobile handlers', () => {
    expect(source).toMatch(/selectedPickupDate\.value\s*\?\s*selectedPickupDate\.value\.toString\(\)\s*:/)
    expect(source).toMatch(/selectedReturnDate\.value\s*\?\s*selectedReturnDate\.value\.toString\(\)\s*:/)
  })
})
