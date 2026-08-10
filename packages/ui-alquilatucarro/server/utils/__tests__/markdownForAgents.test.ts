import { describe, expect, it } from 'vitest'
import {
  buildLlmsDocumentMarkdown,
  buildMarkdownForPath,
  estimateMarkdownTokens,
} from '../markdownForAgents'

const sampleLlms = {
  domain: 'https://alquilatucarro.com',
  title: 'Alquilatucarro',
  description: 'Plataforma de reservas de alquiler de carros en Colombia.',
  sections: [
    {
      title: 'Servicios',
      description: 'Qué ofrecemos',
      links: [
        {
          title: 'Reserva de carros',
          href: 'https://alquilatucarro.com',
          description: 'Reserva online sin anticipos.',
        },
      ],
    },
    {
      title: 'Lugares',
      links: [
        {
          title: 'Bogotá',
          href: 'https://alquilatucarro.com/bogota',
          description: 'Recogida en El Dorado.',
        },
      ],
    },
  ],
}

describe('markdownForAgents', () => {
  it('builds a full llms-style document for /', () => {
    const md = buildMarkdownForPath(sampleLlms, '/')
    expect(md).toContain('# Alquilatucarro')
    expect(md).toContain('> Plataforma de reservas')
    expect(md).toContain('## Lugares')
    expect(md).toContain('[Bogotá](https://alquilatucarro.com/bogota)')
  })

  it('builds city markdown from llms section links', () => {
    const md = buildMarkdownForPath(sampleLlms, '/bogota')
    expect(md).toContain('# Bogotá')
    expect(md).toContain('Recogida en El Dorado.')
    expect(md).toContain('https://alquilatucarro.com/bogota')
  })

  it('returns null for unknown paths so HTML can serve', () => {
    expect(buildMarkdownForPath(sampleLlms, '/chat')).toBeNull()
    expect(buildMarkdownForPath(sampleLlms, '/unknown-city')).toBeNull()
  })

  it('buildLlmsDocumentMarkdown matches home path output', () => {
    expect(buildLlmsDocumentMarkdown(sampleLlms)).toBe(buildMarkdownForPath(sampleLlms, '/'))
  })

  it('estimates tokens from length', () => {
    expect(estimateMarkdownTokens('abcd')).toBe(1)
    expect(estimateMarkdownTokens('a'.repeat(40))).toBe(10)
  })
})
