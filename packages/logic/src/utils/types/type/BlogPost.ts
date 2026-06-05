// Blog post served from Supabase (table `blog_posts`). Routing keys off `slug`
// — there is no `@nuxt/content` `.path` anymore.

export interface BlogAuthor {
  name: string
  avatar: string
}

export type BlogCategory = 'guias' | 'destinos' | 'tips' | 'rutas'

export interface BlogPost {
  slug: string
  title: string
  description: string
  image: string
  alt: string
  author: BlogAuthor
  date: string
  updated?: string
  category: BlogCategory
  tags: string[]
  readingTime: number
  featured?: boolean
  faqItems?: Array<{ question: string; answer: string }>
  metaTitle?: string
}
