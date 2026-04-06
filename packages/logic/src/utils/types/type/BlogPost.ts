// Note: MarkdownParsedContent is a Nuxt Content type that will be available
// when this package is used within a Nuxt application

export interface BlogAuthor {
  name: string
  avatar: string
}

export type BlogCategory = 'guias' | 'destinos' | 'tips' | 'rutas'

export interface BlogPost {
  // Base MarkdownParsedContent fields (from @nuxt/content)
  _path?: string
  _dir?: string
  _draft?: boolean
  _partial?: boolean
  _locale?: string
  _type?: string
  _id?: string
  _source?: string
  _file?: string
  _extension?: string

  // BlogPost specific fields
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
