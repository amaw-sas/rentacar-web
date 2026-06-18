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

  it('keeps pickup/return location testids intact', () => {
    expect(source).toMatch(/data-testid="pickup-location-test"/)
    expect(source).toMatch(/data-testid="return-location-test"/)
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
