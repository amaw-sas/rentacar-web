import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

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
