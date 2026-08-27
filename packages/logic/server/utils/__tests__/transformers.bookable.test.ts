import { describe, it, expect } from 'vitest'
import { transformCities, transformBranches } from '../transformers'

// Step 6 — `bookable` reaches the browser, and with every city on sale the site behaves exactly
// as before (part of SCEN-009).
//
// The city STAYS in the payload when it is switched off. That is the whole design: its page has
// to keep answering 200, so what disappears is the offer, not the city. Filtering it out here
// would take /pereira back to 404 and undo the reason this feature exists.

const CITY = {
  slug: 'pereira',
  name: 'Pereira',
  description: 'Pereira, capital del Eje Cafetero.',
  testimonials: [],
}

const BRANCH = {
  id: 'loc-1',
  code: 'AAPEI',
  name: 'Pereira Aeropuerto',
  city: 'pereira',
  slug: 'pereira-aeropuerto',
  schedule: null,
  status: 'active',
  cities: { slug: 'pereira' },
}

describe('transformCities — bookable', () => {
  it('keeps a switched-off city in the payload, marked as not on sale', () => {
    const [city] = transformCities([{ ...CITY, bookable: false }])

    expect(city.id).toBe('pereira')
    expect(city.bookable).toBe(false)
    // Its page still needs this to render.
    expect(city.description).toContain('Eje Cafetero')
  })

  it('marks a city on sale when the flag says so', () => {
    expect(transformCities([{ ...CITY, bookable: true }])[0].bookable).toBe(true)
  })

  // The hour after the deploy: /api/rentacar-data is cached by Nitro and the cached rows predate
  // the column. Reading absent as "off" would empty the site of every city.
  it('reads a payload built before the column existed as fully on sale', () => {
    expect(transformCities([CITY])[0].bookable).toBe(true)
  })
})

describe('transformBranches — bookable', () => {
  it('inherits the flag from the branch city', () => {
    const [branch] = transformBranches([
      { ...BRANCH, cities: { slug: 'pereira', bookable: false } },
    ])

    expect(branch.code).toBe('AAPEI')
    expect(branch.bookable).toBe(false)
  })

  it('marks a branch of an on-sale city as bookable', () => {
    const [branch] = transformBranches([
      { ...BRANCH, cities: { slug: 'bogota', bookable: true } },
    ])

    expect(branch.bookable).toBe(true)
  })

  // Same bias as the dashboard's directory: a branch nobody classified is not a branch we
  // stopped serving.
  it('treats a branch with no city at all as bookable', () => {
    expect(transformBranches([{ ...BRANCH, cities: null }])[0].bookable).toBe(true)
  })

  it('reads a pre-deploy cached branch as bookable', () => {
    expect(transformBranches([BRANCH])[0].bookable).toBe(true)
  })

  it('leaves everything else about the branch untouched', () => {
    const [branch] = transformBranches([
      { ...BRANCH, cities: { slug: 'pereira', bookable: false } },
    ])

    expect(branch).toMatchObject({
      code: 'AAPEI',
      name: 'Pereira Aeropuerto',
      city: 'pereira',
      slug: 'pereira-aeropuerto',
    })
  })
})
