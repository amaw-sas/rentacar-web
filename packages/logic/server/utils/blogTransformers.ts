import * as v from 'valibot'
import type { BlogPost } from '../../src/utils/types/type/BlogPost'

/**
 * Raw row shape as returned by Supabase `blog_posts` (flat, snake_case).
 * The table is the single source of blog content (issue #52). `body` is read
 * separately by the detail endpoint (parsed via @nuxtjs/mdc), not here.
 */
export interface SupabaseBlogPost {
  slug: unknown
  title: unknown
  description: unknown
  image: unknown
  alt: unknown
  author_name: unknown
  author_avatar: unknown
  date: unknown
  updated?: unknown
  category: unknown
  tags: unknown
  reading_time: unknown
  featured?: unknown
  faq_items?: unknown
  meta_title?: unknown
}

const blogPostSchema = v.object({
  slug: v.pipe(v.string(), v.minLength(1)),
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.string(),
  image: v.string(),
  alt: v.string(),
  author_name: v.pipe(v.string(), v.minLength(1)),
  author_avatar: v.pipe(v.string(), v.minLength(1)),
  date: v.string(),
  updated: v.optional(v.nullable(v.string())),
  category: v.picklist(['guias', 'destinos', 'tips', 'rutas']),
  tags: v.array(v.string()),
  reading_time: v.number(),
  featured: v.optional(v.nullable(v.boolean())),
  faq_items: v.optional(
    v.nullable(v.array(v.object({ question: v.string(), answer: v.string() }))),
  ),
  meta_title: v.optional(v.nullable(v.string())),
})

type ParsedBlogPost = v.InferOutput<typeof blogPostSchema>

/**
 * Reshape a validated flat row into the nested camelCase `BlogPost` the Vue
 * templates consume (`author.{name,avatar}`, `readingTime`, `faqItems`).
 * Nullable optionals collapse to `undefined` so optional chaining behaves.
 */
function toBlogPost(row: ParsedBlogPost): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.image,
    alt: row.alt,
    author: { name: row.author_name, avatar: row.author_avatar },
    date: row.date,
    updated: row.updated ?? undefined,
    category: row.category,
    tags: row.tags,
    readingTime: row.reading_time,
    featured: row.featured ?? undefined,
    faqItems: row.faq_items ?? undefined,
    metaTitle: row.meta_title ?? undefined,
  }
}

/**
 * Single post — fails loud. A malformed row for a specific slug is a real
 * error (the detail page should 500/404, not render garbage).
 */
export function transformBlogPost(row: SupabaseBlogPost): BlogPost {
  return toBlogPost(v.parse(blogPostSchema, row))
}

/**
 * Listing — drops malformed rows so one bad post can't blank the whole grid.
 * Mirrors the `transformFAQs` skip-on-invalid convention in transformers.ts.
 */
export function transformBlogList(rows: SupabaseBlogPost[]): BlogPost[] {
  const result: BlogPost[] = []
  for (const row of rows) {
    const parsed = v.safeParse(blogPostSchema, row)
    if (parsed.success) result.push(toBlogPost(parsed.output))
  }
  return result
}
