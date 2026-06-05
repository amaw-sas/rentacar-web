import Turndown from 'turndown'
import { logger } from './logger'

/**
 * WordPress REST API Post structure with embedded data
 */
export interface WordPressPost {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  modified: string
  slug: string
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text?: string
    }>
    'wp:term'?: Array<Array<{ name: string }>>
  }
  faqItems?: Array<{ question: string; answer: string }>
  metaTitle?: string
  tags?: string[]
}

/**
 * Structured post ready to upsert into Supabase `blog_posts` (issue #52).
 * Author + brand are added by the endpoint (brand-scoped), not here, so this
 * transform stays brand-agnostic and identical across the 3 brands.
 */
export interface TransformedPost {
  slug: string
  title: string
  description: string
  body: string
  image: string | null
  alt: string | null
  date: string
  updated: string
  category: string
  tags: string[]
  readingTime: number
  faqItems?: Array<{ question: string; answer: string }>
  metaTitle?: string
}

const CATEGORY_MAP: Record<string, string> = {
  'Guías': 'guias',
  'Rutas': 'rutas',
  'Destinos': 'destinos',
  'Tips': 'tips',
}

const turndownService = new Turndown({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

// Preserve <details>/<summary> as raw HTML in markdown (MDC renders it)
turndownService.addRule('details', {
  filter: 'details',
  replacement: (_content, node) => '\n\n' + (node as HTMLElement).outerHTML + '\n\n',
})

// Preserve <section class="faq"> as raw HTML
turndownService.addRule('faqSection', {
  filter: (node) =>
    node.nodeName === 'SECTION' && (node as HTMLElement).classList?.contains('faq'),
  replacement: (_content, node) => '\n\n' + (node as HTMLElement).outerHTML + '\n\n',
})

function stripHtml(html: string): string {
  const markdown = turndownService.turndown(html)
  return markdown
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#+\s/g, '')
    .trim()
}

function limitText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.substring(0, maxLength).trim()
}

function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / 200)
}

function mapCategory(wpCategories?: Array<Array<{ name: string }>>): string {
  if (!wpCategories || wpCategories.length === 0 || wpCategories[0].length === 0) {
    return 'guias'
  }
  return CATEGORY_MAP[wpCategories[0][0].name] || 'guias'
}

function extractTags(wpTerms?: Array<Array<{ name: string }>>): string[] {
  if (!wpTerms || wpTerms.length < 2) return []
  return wpTerms[1].map((tag) => tag.name)
}

/**
 * Transform a WordPress REST API post into structured fields for `blog_posts`.
 */
export function transformWordPressToNuxt(wpPost: WordPressPost): TransformedPost {
  const startTime = Date.now()

  try {
    const title = stripHtml(wpPost.title.rendered)
    const description = limitText(stripHtml(wpPost.excerpt.rendered), 160)
    const body = turndownService.turndown(wpPost.content.rendered)
    const category = mapCategory(wpPost._embedded?.['wp:term'])
    const tags = wpPost.tags?.length ? wpPost.tags : extractTags(wpPost._embedded?.['wp:term'])
    const readingTime = calculateReadingTime(body)
    const featuredMedia = wpPost._embedded?.['wp:featuredmedia']?.[0]

    logger.metric('wordpress-to-nuxt-transform', Date.now() - startTime, {
      slug: wpPost.slug,
      category,
      tagCount: tags.length,
      readingTime,
    })

    return {
      slug: wpPost.slug,
      title,
      description,
      body,
      image: featuredMedia?.source_url ?? null,
      alt: featuredMedia?.alt_text ?? null,
      date: wpPost.date,
      updated: wpPost.modified ?? wpPost.date,
      category,
      tags,
      readingTime,
      faqItems: wpPost.faqItems,
      metaTitle: wpPost.metaTitle,
    }
  } catch (error) {
    logger.error('wordpress-to-nuxt-transform', error, { postId: wpPost.id, slug: wpPost.slug })
    throw error
  }
}
