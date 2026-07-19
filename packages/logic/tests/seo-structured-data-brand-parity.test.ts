import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const brands = ['alquilatucarro', 'alquilame', 'alquicarros'] as const

const cityPageSource = (brand: (typeof brands)[number]) =>
  readFileSync(
    join(__dirname, '..', '..', `ui-${brand}`, 'app', 'components', 'CityPage.vue'),
    'utf8',
  )

describe('city structured-data wiring parity — F6', () => {
  it.each(brands)('%s uses the shared city schema compatibility entry point exactly once', (brand) => {
    const source = cityPageSource(brand)
    const calls = source.match(/useCityProductSchema\(props\.city\.name, props\.city\.id\)/g) ?? []

    expect(calls).toHaveLength(1)
  })

  it.each(brands)('%s does not reintroduce fabricated rating schema', (brand) => {
    const source = cityPageSource(brand)

    expect(source).not.toContain('useCityAggregateRating')
    expect(source).not.toContain("'AggregateRating'")
    expect(source).not.toContain('"AggregateRating"')
  })
})
