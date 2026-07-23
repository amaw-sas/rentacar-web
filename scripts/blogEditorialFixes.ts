/**
 * Franchise-neutral rewrites for issue #362.
 *
 * Six sentences across five blog articles named Alquilatucarro in first person
 * ("En Alquilatucarro tenemos sedes…"). They were authored for that brand and
 * seeded verbatim to all three, so Alquicarros and Alquilame published their
 * sister brand's name.
 *
 * Swapping the token per brand would have fixed the leak but kept each article
 * asserting franchise-specific claims — branch coverage, fleet breadth, an
 * included road kit, a multi-provider comparison. The repo already guards
 * against unsupported first-person claims of exactly this shape (see
 * `seoContentHygiene.test.ts`), so the sentences are rewritten to neutral copy
 * instead and applied identically to all three brands.
 *
 * Pure and side-effect free so the table can be asserted from the test suite;
 * `packages/logic` already reaches into `scripts/` for `cities-data.json`.
 *
 * Matching is exact and anchored to a slug: a rewrite that no longer matches is
 * reported rather than silently skipped, so drift in the stored copy surfaces.
 */

export interface EditorialRewrite {
  /** Article the sentence belongs to. */
  slug: string
  /** Exact stored sentence, as published. */
  from: string
  /** Franchise-neutral replacement. */
  to: string
  /** Why the original could not simply have its brand token swapped. */
  reason: string
}

export const EDITORIAL_REWRITES: readonly EditorialRewrite[] = [
  {
    slug: 'precios-alquiler-carros-colombia',
    from: '**Importante:** Estos precios son referenciales y varían según la ciudad, temporada y empresa de alquiler. En Alquilatucarro comparamos múltiples proveedores para mostrarte las mejores opciones.',
    to: '**Importante:** Estos precios son referenciales y varían según la ciudad, temporada y empresa de alquiler. Consulta las tarifas vigentes para tus fechas antes de reservar.',
    reason: 'Claims a multi-provider comparison model under the brand\'s own name.',
  },
  {
    slug: 'precios-alquiler-carros-colombia',
    from: 'No te quedes con la primera cotización. En Alquilatucarro mostramos opciones de múltiples proveedores en una sola búsqueda.',
    to: 'No te quedes con la primera cotización. Compara categorías, coberturas y condiciones antes de decidir.',
    reason: 'Same multi-provider claim, restated as a product capability.',
  },
  {
    slug: 'viajar-carro-con-ninos-colombia',
    from: 'Sí, en Alquilatucarro ofrecemos sillas de bebé como accesorio adicional. Solicítala al momento de reservar para garantizar disponibilidad.',
    to: 'Sí, la silla de bebé está disponible como accesorio adicional. Solicítala al momento de reservar para garantizar disponibilidad.',
    reason: 'First-person product promise about accessory availability.',
  },
  {
    slug: 'costa-caribe-cartagena-santa-marta-carro',
    from: 'En **Alquilatucarro** tenemos sedes en las tres ciudades principales de la ruta:',
    to: 'Hay sedes en las tres ciudades principales de la ruta:',
    reason: 'First-person branch-coverage claim; branch inventory is franchise data.',
  },
  {
    slug: 'tipos-carros-alquilar-cual-elegir',
    from: 'En Alquilatucarro tenemos todos los tipos de vehículos que necesitas, disponibles en **19 ciudades de Colombia**. Sin anticipos, sin trámites complicados, con la mejor atención.',
    to: 'Encuentras todos los tipos de vehículos que necesitas, disponibles en **19 ciudades de Colombia**. Sin anticipos, sin trámites complicados, con la mejor atención.',
    reason: 'First-person fleet-breadth and city-coverage claim.',
  },
  {
    slug: 'viajar-por-carretera-colombia-guia',
    from: '**Multa por kit incompleto:** Hasta $500.000 COP. Todos los vehículos de alquiler de Alquilatucarro incluyen kit de carretera completo.',
    to: '**Multa por kit incompleto:** Hasta $500.000 COP. Todos los vehículos de alquiler incluyen kit de carretera completo.',
    reason: 'Attributes an included road kit to one franchise by name.',
  },
] as const

export interface EditorialResult {
  text: string
  /** Rewrites whose `from` matched and was replaced. */
  applied: EditorialRewrite[]
  /** Rewrites for this slug whose `from` was absent — already applied, or drifted. */
  missing: EditorialRewrite[]
}

/**
 * Applies every rewrite registered for `slug`.
 *
 * Idempotent: once `from` is gone the rewrite lands in `missing` and the text is
 * returned unchanged, so a second run is a no-op rather than a corruption.
 */
export function applyEditorialFixes(text: string, slug: string): EditorialResult {
  const applied: EditorialRewrite[] = []
  const missing: EditorialRewrite[] = []

  const result = EDITORIAL_REWRITES.filter((rewrite) => rewrite.slug === slug).reduce(
    (current, rewrite) => {
      if (!current.includes(rewrite.from)) {
        missing.push(rewrite)
        return current
      }
      applied.push(rewrite)
      return current.split(rewrite.from).join(rewrite.to)
    },
    text,
  )

  return { text: result, applied, missing }
}

/** Slugs carrying at least one rewrite. */
export const REWRITTEN_SLUGS = [...new Set(EDITORIAL_REWRITES.map(({ slug }) => slug))]
