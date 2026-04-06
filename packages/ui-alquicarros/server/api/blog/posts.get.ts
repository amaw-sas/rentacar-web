import yaml from 'yaml'
import { loadDynamicPosts } from '../../plugins/content-dynamic-loader'
import { logger } from '../../utils/logger'
import { handleBlogApiError } from '../../utils/error-handler'

/**
 * GET /api/blog/posts
 *
 * Public endpoint. Returns all dynamic blog posts with frontmatter metadata
 * for use in the blog listing page. Sorted by date DESC.
 * Does not include the body AST — frontmatter only.
 */

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  try {
    return yaml.parse(match[1]) ?? {}
  } catch {
    return {}
  }
}

export default defineEventHandler(async (event) => {
  try {
    logger.info('blog-posts-request', { ip: getRequestIP(event) })

    const raw = await loadDynamicPosts()

    const posts = raw
      .map(({ slug, content }) => {
        const fm = parseFrontmatter(content)
        return {
          title: fm.title ?? '',
          description: fm.description ?? '',
          image: fm.image ?? null,
          alt: fm.alt ?? null,
          author: fm.author ?? { name: 'Alquicarros', avatar: '' },
          date: fm.date ?? '',
          updated: fm.updated ?? null,
          category: fm.category ?? 'guias',
          tags: fm.tags ?? [],
          readingTime: fm.readingTime ?? 1,
          featured: fm.featured ?? false,
          path: `/blog/${slug}`,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return { success: true, count: posts.length, posts }
  } catch (error) {
    return handleBlogApiError(error, 'blog-posts')
  }
})
