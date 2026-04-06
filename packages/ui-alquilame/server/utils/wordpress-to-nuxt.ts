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
}

/**
 * Nuxt Content structure with frontmatter and markdown body
 */
export interface NuxtContentPost {
  slug: string
  frontmatter: string  // YAML frontmatter
  body: string         // Markdown body
}

/**
 * Category mapping from WordPress to Nuxt Content
 */
const CATEGORY_MAP: Record<string, string> = {
  'Guías': 'guias',
  'Rutas': 'rutas',
  'Destinos': 'destinos',
  'Tips': 'tips'
}

/**
 * Default author information for blog posts
 */
const DEFAULT_AUTHOR = {
  name: 'Alquilame',
  avatar: 'https://storage.googleapis.com/rentacar-403321.appspot.com/assets/logo.png'
}

/**
 * Configure Turndown service for HTML to Markdown conversion
 */
const turndownService = new Turndown({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

/**
 * Escapes special characters for safe YAML string values
 * @param str String to escape
 * @returns Escaped string safe for YAML
 */
function escapeYaml(str: string): string {
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
}

/**
 * Strip HTML tags from a string
 * @param html HTML string to clean
 * @returns Plain text without HTML tags
 */
function stripHtml(html: string): string {
  // Use Turndown to convert to plain text, then remove any remaining markdown
  const markdown = turndownService.turndown(html)
  // Remove markdown syntax like **bold**, _italic_, etc.
  return markdown
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .replace(/#+\s/g, '') // Remove heading markers
    .trim()
}

/**
 * Limit text to maximum length
 * @param text Text to limit
 * @param maxLength Maximum length
 * @returns Truncated text
 */
function limitText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength).trim()
}

/**
 * Calculate reading time based on word count
 * @param text Text content to analyze
 * @returns Reading time in minutes
 */
function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / 200)
}

/**
 * Map WordPress category to Nuxt Content category
 * @param wpCategories WordPress categories array
 * @returns Mapped category slug
 */
function mapCategory(wpCategories?: Array<Array<{ name: string }>>): string {
  if (!wpCategories || wpCategories.length === 0 || wpCategories[0].length === 0) {
    return 'guias' // Default category
  }

  const categoryName = wpCategories[0][0].name
  return CATEGORY_MAP[categoryName] || 'guias'
}

/**
 * Extract tags from WordPress post
 * @param wpTerms WordPress terms array
 * @returns Array of tag strings
 */
function extractTags(wpTerms?: Array<Array<{ name: string }>>): string[] {
  if (!wpTerms || wpTerms.length < 2) {
    return []
  }

  return wpTerms[1].map(tag => tag.name)
}

/**
 * Build YAML frontmatter for Nuxt Content
 * @param data Frontmatter data object
 * @returns YAML frontmatter string
 */
function buildFrontmatter(data: {
  title: string
  description: string
  image?: string
  alt?: string
  date: string
  updated: string
  category: string
  tags: string[]
  readingTime: number
}): string {
  const lines = ['---']

  lines.push(`title: "${escapeYaml(data.title)}"`)
  lines.push(`description: "${escapeYaml(data.description)}"`)

  if (data.image) {
    lines.push(`image: "${escapeYaml(data.image)}"`)
  }

  if (data.alt) {
    lines.push(`alt: "${escapeYaml(data.alt)}"`)
  }

  lines.push('author:')
  lines.push(`  name: ${DEFAULT_AUTHOR.name}`)
  lines.push(`  avatar: ${DEFAULT_AUTHOR.avatar}`)

  lines.push(`date: ${data.date}`)
  lines.push(`updated: ${data.updated}`)
  lines.push(`category: ${data.category}`)

  if (data.tags.length > 0) {
    lines.push('tags:')
    data.tags.forEach(tag => {
      lines.push(`  - "${escapeYaml(tag)}"`)
    })
  } else {
    lines.push('tags: []')
  }

  lines.push(`readingTime: ${data.readingTime}`)
  lines.push('featured: false')
  lines.push('---')

  return lines.join('\n')
}

/**
 * Transform WordPress post to Nuxt Content format
 * @param wpPost WordPress REST API post object
 * @returns Nuxt Content post with frontmatter and markdown body
 */
export function transformWordPressToNuxt(wpPost: WordPressPost): NuxtContentPost {
  const startTime = Date.now()

  try {
    // 1. Extract and clean title (strip HTML)
    const title = stripHtml(wpPost.title.rendered)

    // 2. Extract and clean description (strip HTML, max 160 chars)
    const description = limitText(
      stripHtml(wpPost.excerpt.rendered),
      160
    )

    // 3. Convert content HTML → Markdown using Turndown
    const body = turndownService.turndown(wpPost.content.rendered)

    // 4. Map category using CATEGORY_MAP (default: 'guias')
    const category = mapCategory(wpPost._embedded?.['wp:term'])

    // 5. Extract tags from _embedded.wp:term[1]
    const tags = extractTags(wpPost._embedded?.['wp:term'])

    // 6. Calculate readingTime (words / 200)
    const readingTime = calculateReadingTime(body)

    // 7. Extract featured media
    const featuredMedia = wpPost._embedded?.['wp:featuredmedia']?.[0]
    const image = featuredMedia?.source_url
    const alt = featuredMedia?.alt_text

    // 8. Build frontmatter YAML
    const frontmatter = buildFrontmatter({
      title,
      description,
      image,
      alt,
      date: wpPost.date,
      updated: wpPost.modified,
      category,
      tags,
      readingTime
    })

    const duration = Date.now() - startTime
    logger.metric('wordpress-to-nuxt-transform', duration, {
      slug: wpPost.slug,
      category,
      tagCount: tags.length,
      readingTime
    })

    // 9. Return { slug, frontmatter, body }
    return {
      slug: wpPost.slug,
      frontmatter,
      body
    }
  } catch (error) {
    logger.error('wordpress-to-nuxt-transform', error, {
      postId: wpPost.id,
      slug: wpPost.slug
    })
    throw error
  }
}
