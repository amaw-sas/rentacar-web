/**
 * Whether a city — or anything carrying its flag — is still offered for booking.
 *
 * `cities.bookable` splits "the page exists" from "the city is on sale". Deactivating a city the
 * old way (`cities.status`) takes its page to 404 and collapses its SEO, which is what happened
 * with Pereira; `bookable` lets operations stop selling without touching the page.
 *
 * ABSENT MEANS ON SALE, and that is the whole reason this is a function rather than a `.bookable`
 * read spelled out at each call site. `/api/rentacar-data` is cached by Nitro for an hour, so for
 * up to an hour after the deploy every consumer reads a payload built before the column existed
 * and the field arrives `undefined`. A selector that checked `city.bookable` directly would empty
 * itself out for that hour and take every city off the site with it.
 *
 * The same bias holds everywhere else it can: an unknown subject fails towards being shown. Losing
 * a city we do serve costs bookings; showing one we do not is caught downstream, where the
 * availability and reservation endpoints refuse it outright.
 */
export function isBookable(subject: { bookable?: boolean } | null | undefined): boolean {
  return subject?.bookable !== false
}
