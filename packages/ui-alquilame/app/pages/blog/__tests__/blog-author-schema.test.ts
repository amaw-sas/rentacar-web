import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pages = {
  alquilame: readFileSync(
    fileURLToPath(new URL('../[...slug].vue', import.meta.url)),
    'utf8',
  ),
  alquilatucarro: readFileSync(
    fileURLToPath(new URL('../../../../../ui-alquilatucarro/app/pages/blog/[...slug].vue', import.meta.url)),
    'utf8',
  ),
  alquicarros: readFileSync(
    fileURLToPath(new URL('../../../../../ui-alquicarros/app/pages/blog/[...slug].vue', import.meta.url)),
    'utf8',
  ),
}

const franchiseNames = new Set([
  'alquilame',
  'alquila tu carro',
  'alquilatucarro',
  'alquicarros',
])

function authorBlock(source: string): string {
  const start = source.indexOf('author: {')
  const end = source.indexOf('publisher:', start)
  expect(start).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(start)
  return source.slice(start, end)
}

describe('BlogPosting author identity across brands', () => {
  it.each(Object.entries(pages))(
    '%s never labels a franchise name as Person',
    (brand, source) => {
      const author = authorBlock(source)
      if (!author.match(/'@type':\s*'Person'/)) return

      const name = author.match(/name:\s*'([^']+)'/)?.[1]
      expect(name, `${brand}: Person authors require an explicit human name`).toBeDefined()
      const normalizedName = name!
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es')
      expect(franchiseNames.has(normalizedName), `${brand}: ${name} is a franchise`).toBe(false)
    },
  )

  it('uses the owner-approved human author for alquilame', () => {
    const author = authorBlock(pages.alquilame)
    expect(author).toMatch(/'@type':\s*'Person'/)
    expect(author).toMatch(/name:\s*'Diego Melo'/)
    expect(author).toMatch(/jobTitle:\s*'Director General'/)
    expect(author).toMatch(/url:\s*authorUrl/)
  })

  it('uses the owner-approved human author for alquilatucarro', () => {
    const author = authorBlock(pages.alquilatucarro)
    expect(author).toMatch(/'@type':\s*'Person'/)
    expect(author).toMatch(/name:\s*'Elisa Arcos'/)
    expect(author).toMatch(/jobTitle:/)
    expect(author).toMatch(/url:\s*authorUrl/)
  })

  // alquicarros keeps the Organization byline: it is not an active franchise and
  // has no signer. Organization is honest here — the defect this whole guard
  // exists to prevent is the opposite one, a franchise declared as a `Person`.
  it('uses an honest Organization author for alquicarros', () => {
    const author = authorBlock(pages.alquicarros)
    expect(author).toMatch(/'@type':\s*'Organization'/)
    expect(author).toMatch(/name:\s*franchise\.shortname/)
    expect(author).not.toMatch(/'@type':\s*'Person'/)
  })

  // The invariant that survives every byline decision: no brand name may ever be
  // declared as a Person, whichever brands happen to have a human signer.
  it.each(['alquilame', 'alquilatucarro', 'alquicarros'] as const)(
    'never declares a franchise name as a Person in %s',
    (brand) => {
      const author = authorBlock(pages[brand])
      if (!/'@type':\s*'Person'/.test(author)) return
      expect(author).not.toMatch(/name:\s*franchise\.shortname/)
      expect(author).not.toMatch(/name:\s*'(Alquilame|Alquila tu Carro|Alquicarros)'/)
    },
  )
})

describe('Diego Melo author page', () => {
  const profile = readFileSync(
    fileURLToPath(new URL('../autores/diego-melo.vue', import.meta.url)),
    'utf8',
  )

  it('publishes the approved biography and links back to signed articles', () => {
    expect(profile).toContain('Director General, Alquílame')
    expect(profile).toContain('Lleva más de diez años alquilando carros en Colombia')
    expect(profile).toContain('mira los números de sus propias reservas')
    expect(profile).toMatch(/v-for="post in posts"/)
    expect(profile).toMatch(/:to="`\/blog\/\$\{post\.slug\}`"/)
  })

  it('renders a photo only when a local Diego Melo file exists', () => {
    expect(profile).toMatch(/v-if="authorPhoto"/)
    expect(profile).toMatch(/import\.meta\.glob\([\s\S]*diego-melo/)
    expect(profile).not.toMatch(/placeholder|unsplash|stock/i)
  })
})
