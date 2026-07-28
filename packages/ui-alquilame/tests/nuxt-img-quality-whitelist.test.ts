import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseImageQualityConfig } from './nuxt-image-quality'

const PACKAGE_ROOT = join(__dirname, '..')
const nuxtConfig = readFileSync(join(PACKAGE_ROOT, 'nuxt.config.ts'), 'utf8')
const { defaultQuality, allowedQualities } = parseImageQualityConfig(nuxtConfig)
const IGNORED_DIRECTORIES = new Set(['.git', '.nuxt', '.output', 'coverage', 'node_modules'])

function vueFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) return []
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return vueFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

function lineNumber(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length
}

describe('NuxtImg quality configuration', () => {
  it('keeps the global image quality in the Vercel optimizer whitelist', () => {
    expect(allowedQualities).toContain(defaultQuality)
  })

  it('allows only literal quality props included in the Vercel optimizer whitelist', () => {
    const violations: string[] = []

    for (const file of vueFiles(PACKAGE_ROOT)) {
      const source = readFileSync(file, 'utf8')
      for (const tagMatch of source.matchAll(/<NuxtImg\b[\s\S]*?>/g)) {
        const tag = tagMatch[0]
        const tagOffset = tagMatch.index ?? 0
        const qualityPattern = /\b:?quality\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g

        for (const qualityMatch of tag.matchAll(qualityPattern)) {
          const value = (qualityMatch[1] ?? qualityMatch[2] ?? qualityMatch[3] ?? '').trim()
          const location = `${relative(PACKAGE_ROOT, file)}:${lineNumber(source, tagOffset + (qualityMatch.index ?? 0))}`

          if (!/^\d+$/.test(value)) {
            violations.push(`${location} uses a non-literal NuxtImg quality: ${value}`)
          }
          else if (!allowedQualities.includes(Number(value))) {
            violations.push(`${location} uses quality ${value}; allowed: ${allowedQualities.join(', ')}`)
          }
        }
      }
    }

    expect(violations).toEqual([])
  })
})
