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

describe('Searcher — desktop form is comfortably wide (SCEN-002)', () => {
  // SCEN-002: on desktop the date value must not sit under the trailing calendar
  // icon. The root cause was the <u-form> capping itself to md:w-3/6 lg:w-4/6 of an
  // already max-w-md parent (~299px form → 129px date cells → 4px text/icon overlap).
  // The fix removes the fractional desktop caps so the form fills its (now max-w-lg)
  // container; the date cells widen and the value clears the icon.
  const formClass = (source.match(/<u-form\b[\s\S]*?class="([^"]*)"/) ?? [])[1] ?? ''

  it('does NOT cap the form to the md:w-3/6 fraction', () => {
    expect(formClass).not.toMatch(/\bmd:w-3\/6\b/)
  })

  it('does NOT cap the form to the lg:w-4/6 fraction', () => {
    expect(formClass).not.toMatch(/\blg:w-4\/6\b/)
  })

  it('keeps the full-width 2-col grid layout intact', () => {
    expect(formClass).toMatch(/\bw-full\b/)
    expect(formClass).toMatch(/\bgrid-cols-2\b/)
  })

  it('keeps the desktop u-input-date trailing-icon padding (pe-* / right padding clears the value)', () => {
    // The desktop date inputs reserve space for the #trailing calendar icon. The
    // value must never run under it — verified at runtime; here we guard that the
    // trailing calendar icon slot is still wired on both date fields.
    const trailingSlots = source.match(/<template #trailing>/g) ?? []
    expect(trailingSlots.length).toBe(2)
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

  it('keeps pickup/return location testids intact (mobile drawer prop + desktop data-testid)', () => {
    // directiva 2026-06-23: the mobile location selectors are now the shared
    // SearcherSelectDrawer, which receives the testid via its `testid` prop
    // (rendered as data-testid on the trigger button). The desktop u-select-menu
    // keeps a distinct `*-desktop-test` data-testid. Both surfaces remain
    // addressable, so the F3 selectors stay stable.
    expect(source).toMatch(/testid="pickup-location-test"/)
    expect(source).toMatch(/testid="return-location-test"/)
    expect(source).toMatch(/data-testid="pickup-location-desktop-test"/)
    expect(source).toMatch(/data-testid="return-location-desktop-test"/)
  })
})

describe('Searcher — context-aware submit destination (SCEN-003)', () => {
  // The submit control is a LINK button whose :to is now context-aware:
  //   - city page (route.params.city present)  → named-route deep link (F3, unchanged)
  //   - /reservas    (route.params.city absent) → { path: '/reservas', query: {...} }
  // so searching from /reservas stays on /reservas with the params in the query
  // string and renders results in-place (never navigates to /[city]/buscar-vehiculos).
  const submitButtonBlock = (() => {
    const start = source.indexOf('BUSCAR VEHÍCULOS')
    const before = source.lastIndexOf('<u-button', start)
    const after = source.indexOf('</u-button>', start) + '</u-button>'.length
    return source.slice(before, after)
  })()

  it('binds the submit :to to a context-aware destination computed (searchDestination)', () => {
    expect(submitButtonBlock).toMatch(/:to="searchDestination"/)
  })

  it('keeps the F3 named-route deep link when route.params.city is present', () => {
    // The city branch of searchDestination keeps { name: searchLinkName, params: searchLinkParams }.
    expect(source).toMatch(/name:\s*searchLinkName\.value\s*,\s*params:\s*searchLinkParams\.value/)
  })

  it('targets /reservas with a query object when route.params.city is absent', () => {
    expect(source).toMatch(/path:\s*['"]\/reservas['"]/)
    // The query mirrors searchLinkParams: pickup/return slugs + dates + 12h times.
    expect(source).toMatch(/lugar_recogida:/)
    expect(source).toMatch(/lugar_devolucion:/)
    expect(source).toMatch(/fecha_recogida:/)
    expect(source).toMatch(/fecha_devolucion:/)
    expect(source).toMatch(/hora_recogida:/)
    expect(source).toMatch(/hora_devolucion:/)
  })

  it('branches the destination on the presence of route.params.city', () => {
    expect(source).toMatch(/route\.params\.city/)
    expect(source).toMatch(/const\s+searchDestination\s*=\s*computed/)
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
