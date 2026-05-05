/**
 * One-shot snapshot of citiesConfig → cities-data.json for cities Supabase migration (#6).
 *
 * Extrae solo los 3 campos que migran a Supabase: id, description, testimonials.
 * El resultado vive en `scripts/cities-data.json` y es input del backfill
 * (`scripts/cities-backfill.ts`).
 *
 * Después de Step 9 del plan (`cities.config.ts` borrado), este script no compila —
 * queda como artefacto histórico. cities-data.json sobrevive y es lo que importa.
 *
 * Run: npx tsx scripts/cities-snapshot.ts
 */
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { citiesConfig } from '../packages/logic/src/config/cities.config'

interface CitySnapshot {
  id: string
  description: string
  testimonials: unknown[]
}

const snapshot: CitySnapshot[] = citiesConfig.map((city) => ({
  id: city.id,
  description: city.description ?? '',
  testimonials: city.testimonials,
}))

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(scriptDir, 'cities-data.json')
writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')

console.log(`Wrote ${snapshot.length} cities to ${outPath}`)
