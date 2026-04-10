import { listFilesInStorage } from '../../utils/firebase-storage'

/**
 * GET /api/blog/debug
 *
 * Diagnostic endpoint — exposes Vercel Blob config state and storage
 * listing result to diagnose blog post loading issues.
 *
 * Protected by the blog-api-auth middleware (X-API-Key header).
 */
export default defineEventHandler(async (_event) => {
  const config = useRuntimeConfig()

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'MISSING',
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
      files: files.slice(0, 10),
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
