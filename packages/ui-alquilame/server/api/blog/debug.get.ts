import { useSupabaseClient } from '../../../../logic/server/utils/supabase'

/**
 * GET /api/blog/debug
 *
 * Diagnostic endpoint (X-Api-Key, blog-api-auth middleware). Reports this
 * brand's blog_posts row count from Supabase — single source of truth (#52).
 */
export default defineEventHandler(async (event) => {
  const franchise = useRuntimeConfig(event).public.rentacarFranchise as string

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    source: 'supabase:blog_posts',
    franchise,
  }

  try {
    const supabase = useSupabaseClient()
    const { count, error } = await supabase
      .from('blog_posts')
      .select('slug', { count: 'exact', head: true })
      .eq('brand', franchise)
    if (error) throw error
    diagnostics.storage = { success: true, count: count ?? 0 }
  } catch (error) {
    diagnostics.storage = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }

  return diagnostics
})
