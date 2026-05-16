import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Module-level singletons. Safe under Nitro single-process workers: one
// worker = one isolate, so concurrent requests share an already-initialized
// client and no two inits race. RE-VERIFY before moving to serverless
// (Vercel Functions, Cloudflare Workers): concurrent cold starts can each
// run the lazy init, racing the assignment and creating duplicate clients —
// switch to a per-request client or an init mutex there. (issue #7, concern #3)
let client: SupabaseClient | null = null
let adminClient: SupabaseClient | null = null

export function useSupabaseClient(): SupabaseClient {
  if (!client) {
    const config = useRuntimeConfig()
    const url = config.supabaseUrl
    const key = config.supabaseAnonKey

    if (!url || !key) {
      throw new Error('Missing supabaseUrl or supabaseAnonKey in runtimeConfig (set NUXT_SUPABASE_URL and NUXT_SUPABASE_ANON_KEY)')
    }

    client = createClient(url, key)
  }
  return client
}

/**
 * Admin Supabase client that uses the service_role key.
 * Bypasses RLS — use only in trusted server code for tables with no policies.
 * Reads NUXT_SUPABASE_SERVICE_ROLE_KEY directly from process.env for simplicity.
 */
export function useSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    const config = useRuntimeConfig()
    const url = config.supabaseUrl
    const serviceRoleKey = process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY

    if (!url) {
      throw new Error('Missing supabaseUrl in runtimeConfig (set NUXT_SUPABASE_URL)')
    }

    if (!serviceRoleKey) {
      throw new Error('NUXT_SUPABASE_SERVICE_ROLE_KEY required for admin Supabase operations')
    }

    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return adminClient
}
