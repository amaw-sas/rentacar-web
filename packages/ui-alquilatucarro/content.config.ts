import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        image: z.string(),
        alt: z.string(),
        author: z.object({
          name: z.string(),
          avatar: z.string(),
        }),
        date: z.string(),
        updated: z.string().optional(),
        category: z.enum(['guias', 'destinos', 'tips', 'rutas']),
        tags: z.array(z.string()),
        readingTime: z.number(),
        featured: z.boolean().optional(),
        faqItems: z.array(z.object({
          question: z.string(),
          answer: z.string(),
        })).optional(),
        metaTitle: z.string().optional(),
      }),
    }),
  },
})
