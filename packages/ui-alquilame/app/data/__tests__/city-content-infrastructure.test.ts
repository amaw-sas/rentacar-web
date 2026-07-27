import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { createSchemaOrgGraph } from '@unhead/schema-org'
import { cityPullQuotes, type BranchData } from '@rentacar-main/logic/utils'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import {
  cityContentEntries,
  getCityMetaDescription,
  getCityPullQuoteSource,
  useCityExpandedContent,
} from '~/data/cityContent'
import {
  buildCityFAQSchema,
  cityFAQEntries,
  getCityFAQs,
} from '~/data/cityFAQs'
import { googleReviews, pickCityReviews } from '~/data/googleReviews'

const root = join(__dirname, '..', '..', '..')
const appRoot = join(root, 'app')
const cityPage = readFileSync(join(appRoot, 'components/CityPage.vue'), 'utf8')
const faqComponent = readFileSync(join(appRoot, 'components/city/Faq.vue'), 'utf8')
const cityRoute = readFileSync(join(appRoot, 'pages/[city]/index.vue'), 'utf8')

const branches: BranchData[] = [
  { id: 1, code: 'BOG-1', name: 'Aeropuerto El Dorado', city: 'Bogotá' },
  { id: 2, code: 'BOG-2', name: 'Chapinero', city: 'Bogotá' },
]

const expectNonEmptyString = (value: unknown) => {
  expect(typeof value).toBe('string')
  expect((value as string).trim().length).toBeGreaterThan(0)
}

describe('Alquilame city content structure', () => {
  it('contains 19 uniquely keyed cities with the complete local entry shape', () => {
    expect(cityContentEntries).toHaveLength(19)
    expect(new Set(cityContentEntries.map((entry) => entry.cityName)).size).toBe(19)
    expect(new Set(cityContentEntries.map((entry) => entry.citySlug)).size).toBe(19)

    for (const entry of cityContentEntries) {
      expect(Object.keys(entry).sort()).toEqual([
        'cityName',
        'citySlug',
        'content',
        'metaDescription',
        'pullQuoteSource',
      ])
      expectNonEmptyString(entry.cityName)
      expectNonEmptyString(entry.citySlug)
      expectNonEmptyString(entry.metaDescription)
      expectNonEmptyString(entry.pullQuoteSource)
      expect(cityPullQuotes(entry.pullQuoteSource)).toHaveLength(3)

      expectNonEmptyString(getCityMetaDescription(entry.citySlug))
      expectNonEmptyString(getCityPullQuoteSource(entry.citySlug))
      expect(useCityExpandedContent(entry.cityName)).not.toBeNull()
    }
  })

  it('keeps the expanded-content contract populated without pinning copy', () => {
    for (const { content } of cityContentEntries) {
      expect(Object.keys(content).sort()).toEqual([
        'bestSeason',
        'destinations',
        'drivingTips',
        'intro',
      ])
      expectNonEmptyString(content.intro)
      expectNonEmptyString(content.bestSeason)
      expect(content.destinations.length).toBeGreaterThan(0)

      for (const destination of content.destinations) {
        expect(Object.keys(destination).sort()).toEqual(['description', 'name', 'time'])
        expectNonEmptyString(destination.name)
        expectNonEmptyString(destination.time)
        expectNonEmptyString(destination.description)
      }

      expect(Object.keys(content.drivingTips).sort()).toEqual([
        'parking',
        'picoPlaca',
        'tolls',
      ])
      expectNonEmptyString(content.drivingTips.picoPlaca)
      expectNonEmptyString(content.drivingTips.tolls)
      expectNonEmptyString(content.drivingTips.parking)
    }
  })
})

describe('Alquilame city FAQ structure and emitted schema parity (S3)', () => {
  it('contains 19 uniquely keyed FAQ lists with populated label/content fields', () => {
    expect(cityFAQEntries).toHaveLength(19)
    expect(new Set(cityFAQEntries.map((entry) => entry.cityName)).size).toBe(19)
    expect(new Set(cityFAQEntries.map((entry) => entry.citySlug)).size).toBe(19)

    for (const entry of cityFAQEntries) {
      expect(Object.keys(entry).sort()).toEqual(['cityName', 'citySlug', 'faqs'])
      expectNonEmptyString(entry.cityName)
      expectNonEmptyString(entry.citySlug)
      expect(entry.faqs.length).toBeGreaterThan(0)

      for (const faq of getCityFAQs(entry.cityName, branches)) {
        expect(Object.keys(faq).sort()).toEqual(['content', 'label'])
        expectNonEmptyString(faq.label)
        expectNonEmptyString(faq.content)
      }
    }

    for (const faq of getCityFAQs('Ciudad de prueba', branches)) {
      expect(Object.keys(faq).sort()).toEqual(['content', 'label'])
      expectNonEmptyString(faq.label)
      expectNonEmptyString(faq.content)
    }
  })

  it('emits Question nodes with resolver parity, stable @id and inLanguage', () => {
    for (const entry of cityFAQEntries) {
      const visibleFAQs = getCityFAQs(entry.cityName, branches)
      const canonicalUrl = `https://alquilame.co/${entry.citySlug}`
      const graph = createSchemaOrgGraph()
      graph.push(buildCityFAQSchema(visibleFAQs, canonicalUrl))
      const [resolvedSchema] = graph.resolveGraph({
        host: 'https://alquilame.co',
        path: `/${entry.citySlug}`,
        inLanguage: 'es',
      })
      const questions = resolvedSchema?.mainEntity ?? []

      expect(questions).toHaveLength(visibleFAQs.length)
      expect(questions.map((question: Record<string, any>) => ({
        label: question.name,
        content: question.acceptedAnswer.text,
      }))).toEqual(visibleFAQs)

      for (const [index, question] of questions.entries()) {
        expect(question['@type']).toBe('Question')
        expect(question['@id']).toBe(
          `${canonicalUrl}#/schema/question/faq-${index + 1}`,
        )
        expect(question.inLanguage).toBe('es')
        expect(question.acceptedAnswer).toEqual({
          '@type': 'Answer',
          text: visibleFAQs[index]!.content,
        })
      }
    }
  })
})

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(filePath)
    return /\.(?:ts|tsx|vue)$/.test(entry.name) ? [filePath] : []
  })
}

function scriptBlocks(filePath: string): string[] {
  const source = readFileSync(filePath, 'utf8')
  if (!filePath.endsWith('.vue')) return [source]
  return [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1] ?? '')
}

describe('Alquilame-only wiring and auto-import guard', () => {
  it('loads long content and visible FAQs from local modules', () => {
    expect(cityPage).toMatch(/from ['"]~\/data\/cityContent['"];/)
    expect(faqComponent).toMatch(/from ['"]~\/data\/cityFAQs['"];/)
  })

  it('uses local city SEO so meta copy and FAQ schema share local data', () => {
    expect(cityRoute).toMatch(/useAlquilameCityPageSEO/)
    expect(cityRoute).not.toMatch(/\buseCityPageSEO\(\)/)
  })

  it('requires explicit local imports for every city content/FAQ call in app', () => {
    const requiredImports: Record<string, string> = {
      getCityFAQs: '~/data/cityFAQs',
      useCityExpandedContent: '~/data/cityContent',
      useCityFAQs: '~/data/cityFAQs',
    }
    const localDefinitionDirectories = [
      join(appRoot, 'data/cityContent'),
      join(appRoot, 'data/cityFAQs'),
    ]
    const violations: string[] = []

    for (const filePath of sourceFiles(appRoot)) {
      if (localDefinitionDirectories.some((directory) => filePath.startsWith(directory))) {
        continue
      }

      for (const [blockIndex, script] of scriptBlocks(filePath).entries()) {
        const sourceFile = ts.createSourceFile(
          filePath,
          script,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        )
        const imports = new Set(sourceFile.statements
          .filter(ts.isImportDeclaration)
          .map((statement) => (statement.moduleSpecifier as ts.StringLiteral).text))
        const calls = new Set<string>()

        const visit = (node: ts.Node) => {
          if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
            calls.add(node.expression.text)
          }
          ts.forEachChild(node, visit)
        }
        visit(sourceFile)

        for (const [identifier, requiredImport] of Object.entries(requiredImports)) {
          if (calls.has(identifier) && !imports.has(requiredImport)) {
            const block = filePath.endsWith('.vue') ? ` script#${blockIndex + 1}` : ''
            violations.push(`${relative(appRoot, filePath)}${block}: ${identifier} requires ${requiredImport}`)
          }
        }
      }

      if (filePath.endsWith('.vue')) {
        const vueSource = readFileSync(filePath, 'utf8')
        const template = (vueSource.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i)?.[1] ?? '')
          .replace(/<!--[\s\S]*?-->/g, '')
        const importedModules = new Set(scriptBlocks(filePath).flatMap((script) => {
          const sourceFile = ts.createSourceFile(
            filePath,
            script,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
          )
          return sourceFile.statements
            .filter(ts.isImportDeclaration)
            .map((statement) => (statement.moduleSpecifier as ts.StringLiteral).text)
        }))

        for (const [identifier, requiredImport] of Object.entries(requiredImports)) {
          const callPattern = new RegExp(`\\b${identifier}\\s*\\(`)
          if (callPattern.test(template) && !importedModules.has(requiredImport)) {
            violations.push(`${relative(appRoot, filePath)} template: ${identifier} requires ${requiredImport}`)
          }
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('leaves W5 review selection deterministic and empty for current fallback', () => {
    expect(googleReviews).toEqual([])
    expect(pickCityReviews('bogota')).toEqual([])
    expect(pickCityReviews('bogota')).toEqual(pickCityReviews('bogota'))
  })
})
