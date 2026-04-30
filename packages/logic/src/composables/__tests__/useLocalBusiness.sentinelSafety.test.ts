import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// SCEN-005 (part 1): useLocalBusiness consumes useFetchRentacarData()
// directly. With the sentinel from SCEN-003, branches is a frozen empty
// array. The composable must handle that without throwing — it iterates
// branches and renders LocalBusiness schemas; an empty list should be a
// valid no-op return.
//
// Source-level assertions match the codebase convention (useCategory.*.test.ts,
// useCategory.extrasFallback.test.ts): runtime testing useLocalBusiness
// requires mocking useAppConfig + useSchemaOrg + useFetchRentacarData
// auto-imports. Source-level proves the guard structure that prevents
// throws on empty input.

const source = readFileSync(
  fileURLToPath(new URL('../useLocalBusiness.ts', import.meta.url)),
  'utf8',
)

describe('useLocalBusiness sentinel safety (SCEN-005 part 1)', () => {
  it('extracts branches via destructuring (compatible with frozen empty array)', () => {
    expect(source).toMatch(/const\s*\{\s*branches\s*\}\s*=\s*useFetchRentacarData\(\)/)
  })

  it('uses Array#filter on branches — works on frozen empty arrays', () => {
    expect(source).toMatch(/\(branches as Branch\[\]\)\s*\.filter\(/)
  })

  it('early-returns when cityBranches is empty (length === 0)', () => {
    expect(source).toMatch(/cityBranches\.length\s*===\s*0/)
    expect(source).toMatch(/if\s*\(cityBranches\.length\s*===\s*0\)\s*return/)
  })

  it('does not call any branch-mutating method (push/pop/sort) on the input', () => {
    // Mutations on the frozen sentinel array would throw TypeError in strict
    // mode. The composable must read-only.
    expect(source).not.toMatch(/branches\.push\(/)
    expect(source).not.toMatch(/branches\.pop\(/)
    expect(source).not.toMatch(/branches\.sort\(/)
    expect(source).not.toMatch(/branches\.splice\(/)
  })
})
