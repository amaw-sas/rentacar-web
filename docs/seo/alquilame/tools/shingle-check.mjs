#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DEFAULT_SIZE = 8
const LOCAL_CITY_BASE = 'http://localhost:4002'
const REFERENCE_CITY_BASE = 'https://alquilatucarro.com'
const REGION_START_ID = 'introduccion'
const REGION_END_ID = 'faqs'

function usage() {
  return `Usage:
  node shingle-check.mjs <file-or-url-a> <file-or-url-b>
  node shingle-check.mjs --city <slug>
  node shingle-check.mjs --region <file-or-url-a> <file-or-url-b>
  node shingle-check.mjs --city <slug> --region

--region limits both HTML inputs to section#${REGION_START_ID} through section#${REGION_END_ID}.
The percentage is the share of ${DEFAULT_SIZE}-word sequences from A that are also present in B.`
}

export function decodeEntities(text) {
  const named = {
    Aacute: 'Á',
    Eacute: 'É',
    Iacute: 'Í',
    Iexcl: '¡',
    Iquest: '¿',
    Ntilde: 'Ñ',
    Oacute: 'Ó',
    Uacute: 'Ú',
    Uuml: 'Ü',
    aacute: 'á',
    amp: '&',
    apos: "'",
    bull: '•',
    copy: '©',
    deg: '°',
    eacute: 'é',
    gt: '>',
    hellip: '…',
    iacute: 'í',
    iexcl: '¡',
    iquest: '¿',
    laquo: '«',
    lt: '<',
    mdash: '—',
    middot: '·',
    nbsp: ' ',
    ndash: '–',
    ntilde: 'ñ',
    oacute: 'ó',
    quot: '"',
    raquo: '»',
    reg: '®',
    uacute: 'ú',
    uuml: 'ü',
  }

  return text.replace(/&(#x[\da-fA-F]+|#\d+|[A-Za-z][A-Za-z\d]+);/g, (entity, code) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
    }
    if (code.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
    }
    return named[code] ?? named[code.toLowerCase()] ?? entity
  })
}

/** Extract visible text without a DOM dependency. */
export function extractVisibleText(input) {
  if (!/<\/?[A-Za-z][\w:-]*(?:\s[^<>]*|\s*\/?)>/i.test(input)) {
    return input
  }

  return decodeEntities(input
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, ' ')
    .replace(/<(script|style|template|noscript|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
}

function openingTagById(html, id, fromIndex = 0) {
  const tags = /<([A-Za-z][\w:-]*)\b[^>]*>/g
  tags.lastIndex = fromIndex
  let match
  while ((match = tags.exec(html)) !== null) {
    const idMatch = match[0].match(/\bid\s*=\s*(["'])([^"']+)\1/i)
    if (idMatch?.[2] === id) {
      return {
        end: tags.lastIndex,
        index: match.index,
        tagName: match[1],
      }
    }
  }
  return null
}

function matchingElementEnd(html, opening) {
  const escapedTag = opening.tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const tags = new RegExp(`<\\/?${escapedTag}\\b[^>]*>`, 'gi')
  tags.lastIndex = opening.end
  let depth = 1
  let match

  while ((match = tags.exec(html)) !== null) {
    if (/^<\//.test(match[0])) depth -= 1
    else if (!/\/\s*>$/.test(match[0])) depth += 1
    if (depth === 0) return tags.lastIndex
  }

  throw new Error(`Could not find closing <${opening.tagName}> for #${REGION_END_ID}`)
}

/**
 * City-owned region in rendered CityPage HTML: section#introduccion starts the
 * expanded city copy and section#faqs closes the local FAQ block.
 */
export function extractCityContentRegion(html) {
  const start = openingTagById(html, REGION_START_ID)
  if (!start || start.tagName.toLowerCase() !== 'section') {
    throw new Error(`Could not find region start marker section#${REGION_START_ID}`)
  }
  const end = openingTagById(html, REGION_END_ID, start.end)
  if (!end || end.tagName.toLowerCase() !== 'section') {
    throw new Error(`Could not find region end marker section#${REGION_END_ID}`)
  }

  return html.slice(start.index, matchingElementEnd(html, end))
}

export function tokenize(input) {
  return extractVisibleText(input)
    .normalize('NFC')
    .toLocaleLowerCase('es-CO')
    .match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []
}

export function createShingles(words, size = DEFAULT_SIZE) {
  if (words.length < size) return []
  return Array.from(
    { length: words.length - size + 1 },
    (_, index) => words.slice(index, index + size).join(' '),
  )
}

export function compareTexts(textA, textB, size = DEFAULT_SIZE, options = {}) {
  const selectedA = options.region ? extractCityContentRegion(textA) : textA
  const selectedB = options.region ? extractCityContentRegion(textB) : textB
  const wordsA = tokenize(selectedA)
  const wordsB = tokenize(selectedB)
  const shinglesA = createShingles(wordsA, size)
  const shinglesB = new Set(createShingles(wordsB, size))
  const matches = shinglesA.filter((shingle) => shinglesB.has(shingle)).length

  return {
    size,
    wordsA: wordsA.length,
    wordsB: wordsB.length,
    shinglesA: shinglesA.length,
    shinglesB: shinglesB.size,
    matches,
    percentage: shinglesA.length === 0 ? 0 : (matches / shinglesA.length) * 100,
    region: options.region === true,
  }
}

function isUrl(source) {
  return /^https?:\/\//i.test(source)
}

async function loadSource(source) {
  if (!isUrl(source)) {
    return fs.readFile(path.resolve(source), 'utf8')
  }

  const response = await fetch(source, {
    headers: {
      'user-agent': 'Alquilame SEO shingle verifier/1.0',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(`Could not load ${source}: HTTP ${response.status}`)
  }
  return response.text()
}

function parseArguments(args) {
  const region = args.includes('--region')
  const positional = args.filter((argument) => argument !== '--region')

  if (positional[0] === '--city') {
    const slug = positional[1]
    if (!slug || positional.length !== 2) throw new Error(usage())
    return {
      region,
      sources: [
        `${LOCAL_CITY_BASE}/${slug}`,
        `${REFERENCE_CITY_BASE}/${slug}`,
      ],
    }
  }

  if (positional.length !== 2) throw new Error(usage())
  return { region, sources: positional }
}

async function main() {
  const { region, sources: [sourceA, sourceB] } = parseArguments(process.argv.slice(2))
  const [textA, textB] = await Promise.all([
    loadSource(sourceA),
    loadSource(sourceB),
  ])
  const result = compareTexts(textA, textB, DEFAULT_SIZE, { region })

  console.log(`Scope: ${region ? `section#${REGION_START_ID} through section#${REGION_END_ID}` : 'full page'}`)
  console.log(`A: ${sourceA} (${result.wordsA} words, ${result.shinglesA} shingles)`)
  console.log(`B: ${sourceB} (${result.wordsB} words, ${result.shinglesB} unique shingles)`)
  console.log(
    `Shared ${result.size}-word sequences from A: ${result.matches}/${result.shinglesA} (${result.percentage.toFixed(2)}%)`,
  )
}

const isEntryPoint = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isEntryPoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
