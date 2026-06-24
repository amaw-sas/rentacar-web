import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../Searcher.vue', import.meta.url)),
  'utf8',
)

describe('Searcher — pickup/return calendars hide year controls', () => {
  const calendarTags = source.match(/<u-calendar\b[\s\S]*?\/>/g) ?? []

  it('renders pickup and return u-calendar instances (mobile slideover + desktop popover)', () => {
    // 4 instances: mobile slideover + desktop popover, for both pickup and return.
    expect(calendarTags.length).toBe(4)
  })

  it('disables year controls on every u-calendar so the << / >> chevrons are not shown', () => {
    for (const tag of calendarTags) {
      expect(tag).toMatch(/:year-controls="false"/)
      expect(tag).not.toMatch(/:year-controls="true"/)
    }
  })
})

describe('Searcher — mobile uses full-screen drawers (no native select/date input)', () => {
  // directiva 2026-06-23: mobile no longer uses native <select> or
  // <input type="date">; it uses the shared SearcherSelectDrawer for
  // location/hour and a u-slideover + u-calendar for dates. Source-string
  // assertions: the .vue imports from #components (no vitest alias) so it
  // can't be mounted here.

  it('drops the native <select> on mobile', () => {
    expect(source).not.toMatch(/<select\b/)
  })

  it('drops the native <input type="date"> on mobile', () => {
    expect(source).not.toMatch(/type="date"/)
  })

  it('uses the shared SearcherSelectDrawer for location/hour fields', () => {
    expect(source).toMatch(/SearcherSelectDrawer/)
  })

  it('opens full-height slideover drawers for the date calendars', () => {
    expect(source).toMatch(/<u-slideover/)
    expect(source).toMatch(/h-dvh/)
  })

  it('scales the mobile calendar with a dedicated UI config', () => {
    expect(source).toMatch(/mobileCalendarUIConfig/)
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

describe('Searcher — mobile date is chosen via a calendar slideover (no clearable native input)', () => {
  // directiva 2026-06-23: the mobile pickup/return date fields are no longer
  // native <input type="date"> (whose clear affordance could blank the field and
  // whose Android validation balloon was unstyleable). They are now u-button
  // triggers that open a u-slideover + u-calendar. The date can only be replaced
  // by picking another day — there is no clear affordance — so the old clamp /
  // one-way :value / fallback machinery is structurally unnecessary. These
  // assertions encode the new contract.

  it('exposes mobile date triggers that open the calendar slideover', () => {
    expect(source).toMatch(/data-testid="pickup-date-mobile-trigger"/)
    expect(source).toMatch(/data-testid="return-date-mobile-trigger"/)
    expect(source).toMatch(/pickupDateSlideoverOpen\s*=\s*true/)
    expect(source).toMatch(/returnDateSlideoverOpen\s*=\s*true/)
  })

  it('labels the triggers with the human date and a placeholder fallback', () => {
    expect(source).toMatch(/pickupDateLabel/)
    expect(source).toMatch(/returnDateLabel/)
    expect(source).toMatch(/formatHumanDate/)
    expect(source).toMatch(/'Selecciona la fecha'/)
  })

  it('selects the date through the unified onPickupDateSelect/onReturnDateSelect handlers', () => {
    expect(source).toMatch(/const onPickupDateSelect\s*=/)
    expect(source).toMatch(/const onReturnDateSelect\s*=/)
    expect(source).toMatch(/@update:model-value="\(v\) => onPickupDateSelect\(/)
    expect(source).toMatch(/@update:model-value="\(v\) => onReturnDateSelect\(/)
  })

  it('no longer references the removed native-date clamp helpers', () => {
    expect(source).not.toMatch(/clampMobileDateInput/)
    expect(source).not.toMatch(/onMobilePickupDateChange/)
    expect(source).not.toMatch(/onMobileReturnDateChange/)
  })
})
