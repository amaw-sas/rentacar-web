/**
 * One-shot backfill of cities table en Supabase con `description` y
 * `testimonials` desde `cities-data.json` (snapshot generado por
 * scripts/cities-snapshot.ts en Step 1).
 *
 * Idempotente: re-correrlo no duplica datos. Falla duro si una fila
 * con el slug del JSON no existe en DB (mismatch entre rentacar-web y
 * admin → señal de desincronización).
 *
 * Run:
 *   npx tsx scripts/cities-backfill.ts --dry-run    # imprime SQL sin tocar DB
 *   npx tsx scripts/cities-backfill.ts              # ejecuta UPDATEs reales
 *
 * Requiere en `.env.local`:
 *   NUXT_SUPABASE_URL=https://...
 *   NUXT_SUPABASE_SERVICE_ROLE_KEY=...   (service role para bypass RLS)
 */
import { config } from 'dotenv'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

interface CitySnapshot {
  id: string
  description: string
  testimonials: unknown[]
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(scriptDir, 'cities-data.json')
const data = JSON.parse(readFileSync(dataPath, 'utf8')) as CitySnapshot[]

const dryRun = process.argv.includes('--dry-run')

function pass(msg: string) { console.log(`✅ ${msg}`) }
function fail(msg: string, err?: unknown): never {
  console.error(`❌ ${msg}`)
  if (err) console.error(err)
  process.exit(1)
}

async function main() {
  console.log(`\n🚚 Cities backfill — ${dryRun ? 'DRY-RUN' : 'REAL'} mode\n`)
  console.log(`Loaded ${data.length} cities from ${dataPath}\n`)

  if (dryRun) {
    for (const city of data) {
      console.log(
        `UPDATE cities SET description = ${JSON.stringify(city.description).slice(0, 60)}..., ` +
        `testimonials = '<${city.testimonials.length} entries>'::jsonb ` +
        `WHERE slug = '${city.id}';`,
      )
    }
    console.log(`\n${data.length} statements generated. No database writes performed.`)
    return
  }

  const url = process.env.NUXT_SUPABASE_URL
  const serviceRoleKey = process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY

  if (!url) fail('NUXT_SUPABASE_URL must be in .env.local')
  if (!serviceRoleKey) fail('NUXT_SUPABASE_SERVICE_ROLE_KEY must be in .env.local')

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let updated = 0
  for (const city of data) {
    const { data: existing, error: selectError } = await supabase
      .from('cities')
      .select('slug')
      .eq('slug', city.id)
      .maybeSingle()

    if (selectError) fail(`SELECT failed for slug=${city.id}`, selectError)
    if (!existing) {
      fail(
        `Slug '${city.id}' not found in cities table. Aborting — desync between ` +
        `rentacar-web snapshot and rentacar-dashboard. Verify schema state.`,
      )
    }

    const { error: updateError } = await supabase
      .from('cities')
      .update({
        description: city.description,
        testimonials: city.testimonials,
      })
      .eq('slug', city.id)

    if (updateError) fail(`UPDATE failed for slug=${city.id}`, updateError)
    updated += 1
    pass(`Updated cities.{description,testimonials} WHERE slug='${city.id}'`)
  }

  console.log(`\n✅ Backfill complete: ${updated}/${data.length} cities updated.`)
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err)
  process.exit(1)
})
