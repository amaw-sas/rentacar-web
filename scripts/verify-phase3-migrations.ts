/**
 * Verifies that the Phase 3 Supabase migrations are correctly applied:
 *   1. check_blog_rate_limit RPC exists and is callable by anon
 *   2. rate_limit_counters table is RLS-protected (anon cannot SELECT directly)
 *   3. gsc_tokens table exists
 *   4. gsc_tokens is RLS-protected (anon cannot SELECT)
 *
 * Run: npx tsx scripts/verify-phase3-migrations.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
config({ path: '.env.local' })

const url = process.env.NUXT_SUPABASE_URL
const anonKey = process.env.NUXT_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('❌ NUXT_SUPABASE_URL and NUXT_SUPABASE_ANON_KEY must be in .env.local')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

function pass(msg: string) { console.log(`✅ ${msg}`) }
function fail(msg: string, err?: unknown): never {
  console.error(`❌ ${msg}`)
  if (err) console.error(err)
  process.exit(1)
}

async function probeTable(table: string): Promise<'exists' | 'missing'> {
  const { error } = await supabase.from(table).select('*').limit(0)
  if (!error) return 'exists'
  const code = (error as any).code
  const msg = error.message.toLowerCase()
  if (msg.includes('does not exist') || code === '42P01' || code === 'PGRST205') {
    return 'missing'
  }
  // Any other error (e.g., RLS) means the table exists
  return 'exists'
}

async function main() {
  console.log('\n🧪 Phase 3 migrations verification\n')

  // ──────────────────────────────────────────
  // Pre-check: do the tables exist?
  // ──────────────────────────────────────────
  const rlcStatus = await probeTable('rate_limit_counters')
  const gscStatus = await probeTable('gsc_tokens')
  if (rlcStatus === 'missing') fail('rate_limit_counters table not found — migration 1 not applied')
  if (gscStatus === 'missing') fail('gsc_tokens table not found — migration 2 not applied')
  pass('Both tables exist in the database')

  // ──────────────────────────────────────────
  // Scenario 1: check_blog_rate_limit RPC exists and works
  // ──────────────────────────────────────────
  const testIp = `test-${Date.now()}`
  const { data: rlData, error: rlError } = await supabase.rpc('check_blog_rate_limit', {
    p_ip: testIp,
    p_limit: 5,
    p_window_seconds: 60,
  })

  if (rlError) fail('check_blog_rate_limit RPC call failed', rlError)
  if (!Array.isArray(rlData) || rlData.length === 0) fail(`Unexpected RPC response: ${JSON.stringify(rlData)}`)

  const first = rlData[0]
  if (typeof first.allowed !== 'boolean') fail(`RPC response missing allowed: ${JSON.stringify(first)}`)
  if (typeof first.remaining !== 'number') fail(`RPC response missing remaining: ${JSON.stringify(first)}`)
  if (!first.reset_at) fail(`RPC response missing reset_at: ${JSON.stringify(first)}`)
  if (!first.allowed) fail(`First call should be allowed, got: ${JSON.stringify(first)}`)
  pass(`RPC check_blog_rate_limit works (remaining: ${first.remaining}, reset_at: ${first.reset_at})`)

  // Call again to verify counter increments
  const { data: rlData2 } = await supabase.rpc('check_blog_rate_limit', {
    p_ip: testIp,
    p_limit: 5,
    p_window_seconds: 60,
  })
  if (rlData2[0].remaining !== first.remaining - 1) {
    fail(`Counter did not increment: first remaining=${first.remaining}, second=${rlData2[0].remaining}`)
  }
  pass(`Counter increments correctly (now remaining: ${rlData2[0].remaining})`)

  // Exhaust limit
  for (let i = 0; i < 5; i++) {
    await supabase.rpc('check_blog_rate_limit', { p_ip: testIp, p_limit: 5, p_window_seconds: 60 })
  }
  const { data: rlFinal } = await supabase.rpc('check_blog_rate_limit', {
    p_ip: testIp,
    p_limit: 5,
    p_window_seconds: 60,
  })
  if (rlFinal[0].allowed) fail(`Should be blocked after exceeding limit: ${JSON.stringify(rlFinal[0])}`)
  pass('RPC correctly blocks when limit exceeded')

  // ──────────────────────────────────────────
  // Scenario 2: rate_limit_counters is RLS-protected
  // ──────────────────────────────────────────
  const { data: rlcData, error: rlcError } = await supabase.from('rate_limit_counters').select('*').limit(1)
  if (rlcError) {
    pass(`rate_limit_counters SELECT blocked for anon: ${rlcError.message}`)
  } else if (!rlcData || rlcData.length === 0) {
    pass('rate_limit_counters returned empty for anon (RLS filtering)')
  } else {
    fail(`rate_limit_counters should be empty/blocked for anon, got ${rlcData.length} rows`)
  }

  // ──────────────────────────────────────────
  // Scenario 3 & 4: gsc_tokens table exists and is RLS-protected
  // ──────────────────────────────────────────
  const { data: gscData, error: gscError } = await supabase.from('gsc_tokens').select('id').limit(1)
  if (gscError) {
    // Distinguish between "table missing" and "RLS blocks"
    if (gscError.message.toLowerCase().includes('does not exist') ||
        gscError.message.toLowerCase().includes('relation') ||
        (gscError as any).code === '42P01') {
      fail(`gsc_tokens table does not exist: ${gscError.message}`)
    }
    pass(`gsc_tokens exists but access blocked for anon: ${gscError.message}`)
  } else if (!gscData || gscData.length === 0) {
    pass('gsc_tokens exists, returns empty for anon (RLS filtering)')
  } else {
    fail(`gsc_tokens should be empty/blocked for anon, got ${gscData.length} rows`)
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test rows...')
  const { data: cleanData, error: cleanError } = await supabase.rpc('cleanup_rate_limit_counters', {
    p_older_than_seconds: 0,
  })
  if (cleanError) {
    console.log(`  (cleanup function failed: ${cleanError.message} — ignore if table is RLS-only)`)
  } else {
    pass(`cleanup_rate_limit_counters works (deleted ${cleanData ?? 0} rows)`)
  }

  console.log('\n🎉 All Phase 3 migration scenarios passed\n')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
