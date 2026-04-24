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
// Fix: include `city` in the searchLinkParams object, read reactively from
// useRoute().params.city inside the computed so the link resolves against
// the current route at the moment it is evaluated.

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

  it('the `city` value is read from route.params.city (reactive inside computed)', () => {
    expect(block).toMatch(/city\s*:\s*route\.params\.city/)
  })
})
