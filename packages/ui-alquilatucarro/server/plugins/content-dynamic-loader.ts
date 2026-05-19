import { downloadFromStorage, listFilesInStorage } from '../utils/blob-storage'
import { logger } from '../utils/logger'

const cache = {
  posts: [] as any[],
  lastFetch: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
}

export default defineNitroPlugin((nitroApp) => {
  logger.info('content-dynamic-loader', { status: 'initialized', ttl: '5min' })
})

export async function loadDynamicPosts(): Promise<any[]> {
  const now = Date.now()

  if (cache.posts.length > 0 && now - cache.lastFetch < cache.ttl) {
    return cache.posts
  }

  try {
    const franchise = useRuntimeConfig().public.rentacarFranchise
    const prefix = `blog-posts/${franchise}/`
    const files = await listFilesInStorage(prefix)
    const posts = await Promise.all(
      files.map(async (path) => {
        const buffer = await downloadFromStorage(path)
        const content = buffer.toString('utf-8')
        const slug = path.replace(prefix, '').replace('.md', '')
        return { slug, content, path }
      })
    )

    cache.posts = posts
    cache.lastFetch = now

    logger.info('content-dynamic-loader-refresh', { count: posts.length })
    return posts
  } catch (error) {
    logger.error('content-dynamic-loader-error', error)
    return cache.posts // Return stale cache on error
  }
}

/**
 * Invalidate the in-memory post cache.
 * Call after mutating blog posts in storage so the next request fetches fresh data.
 */
export function invalidateCache(): void {
  cache.lastFetch = 0
}
