import { listFilesInStorage } from '../../utils/firebase-storage'

/**
 * GET /api/blog/debug
 *
 * Temporary diagnostic endpoint — exposes Firebase config state and storage
 * listing result to diagnose why /api/blog/posts returns count: 0.
 *
 * Protected by the blog-api-auth middleware (X-API-Key header + IP whitelist).
 * Remove after debugging is complete.
 */
export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      firebaseProjectId: config.firebaseProjectId ? 'SET' : 'MISSING',
      firebaseClientEmail: config.firebaseClientEmail ? 'SET' : 'MISSING',
      firebasePrivateKey: config.firebasePrivateKey
        ? `SET (${(config.firebasePrivateKey as string).length} chars)`
        : 'MISSING',
      firebaseStorageBucket: config.firebaseStorageBucket ? 'SET' : 'MISSING',
      franchise: config.public.rentacarFranchise,
    },
  }

  const prefix = `blog-posts/${config.public.rentacarFranchise}/`

  try {
    const files = await listFilesInStorage(prefix)
    diagnostics.storage = {
      success: true,
      prefix,
      count: files.length,
    }
  } catch (error) {
    diagnostics.storage = {
      success: false,
      prefix,
      error: error instanceof Error ? error.message : String(error),
    }
  }

  return diagnostics
})
