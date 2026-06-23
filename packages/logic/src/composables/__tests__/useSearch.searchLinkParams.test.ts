import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario captured: on back-navigation (e.g. home -> city page -> back, or
// reservation -> gracias -> back), clicking the pickup/return selects or the
// branch selector produced a console error:
//   Uncaught (in promise) Error: Missing required param "city"
//     at Object.stringify (vue-router.mjs)
//
// Root cause: Searcher.vue uses <NuxtLink :to="{ name: searchLinkName,
// params: searchLinkParams }"> where searchLinkName points to a named route
// that REQUIRES `city`, but the returned params object omitted `city`.
// Vue-router only falls back to current route params when resolving — if the
// current route has no `city` (e.g. home page during transition), the
// resolution throws.
//
// Fix: include `city` in the searchLinkParams object so the named-route link
// always resolves its required `city` param.
//
// Issue #129 followup (city-switch reset): the `city` must be derived from the
// SELECTED pickup branch, not from route.params.city. Selecting another city's
// branch in the searcher used to build an inconsistent `/cityA/.../cityB-branch/`
// URL that the #129 middleware bounced back to cityA's default branch (the
// "La sede de recogida no corresponde a la ciudad" reset). Deriving the city from
// pickupBranch.city makes a city switch navigate to that city; the route city is
// only a fallback for when no pickup branch is resolved yet (keeps `city` present).

const source = readFileSync(
  fileURLToPath(new URL('../useSearch.ts', import.meta.url)),
  'utf8',
)

function extractComputed(name: string): string {
  const start = source.indexOf(`const ${name} = computed`)
  expect(start, `missing computed ${name}`).toBeGreaterThan(-1)
  // computed blocks in this file end with `});` at column 2
  const end = source.indexOf('\n  });', start) + '\n  });'.length
  return source.slice(start, end)
}

describe('useSearch — searchLinkParams must include `city` for named-route resolution', () => {
  const block = extractComputed('searchLinkParams')

  it('return object includes a `city` key', () => {
    expect(block).toMatch(/\bcity\s*:/)
  })

  it('the `city` is derived from the selected pickup branch, falling back to route.params.city', () => {
    // issue #129 followup: prefer pickupBranch.city so a city switch in the
    // searcher navigates to that city instead of being reset to the page default.
    expect(block).toMatch(/city\s*:\s*pickupBranch\?\.city\s*\?\?\s*route\.params\.city/)
  })

  it('still falls back to route.params.city (named-route link keeps its required `city`)', () => {
    expect(block).toMatch(/route\.params\.city/)
  })
})
