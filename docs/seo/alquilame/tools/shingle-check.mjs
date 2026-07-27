#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DEFAULT_SIZE = 8
const LOCAL_CITY_BASE = 'http://localhost:4002'
const REFERENCE_CITY_BASE = 'https://alquilatucarro.com'

function usage() {
  return `Usage:
  node shingle-check.mjs <file-or-url-a> <file-or-url-b>
  node shingle-check.mjs --city <slug>

The percentage is the share of ${DEFAULT_SIZE}-word sequences from A that are also present in B.`
}

function decodeEntities(text) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '…',
    laquo: '«',
    lt: '<',
    nbsp: ' ',
    ndash: '–',
    quot: '"',
    raquo: '»',
  }

  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith('#x') || code.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
    }
    if (code.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
    }
    return named[code.toLowerCase()] ?? entity
  })
}

/** Extract visible text without a DOM dependency. */
export function extractVisibleText(input) {
  if (!/<(?:!doctype|html|head|body|main|section|div|p|h[1-6])\b/i.test(input)) {
    return input
  }

  return decodeEntities(input
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, ' ')
    .replace(/<(script|style|template|noscript|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
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

export function compareTexts(textA, textB, size = DEFAULT_SIZE) {
  const wordsA = tokenize(textA)
  const wordsB = tokenize(textB)
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
  if (args[0] === '--city') {
    const slug = args[1]
    if (!slug || args.length !== 2) throw new Error(usage())
    return [
      `${LOCAL_CITY_BASE}/${slug}`,
      `${REFERENCE_CITY_BASE}/${slug}`,
    ]
  }

  if (args.length !== 2) throw new Error(usage())
  return args
}

async function main() {
  const [sourceA, sourceB] = parseArguments(process.argv.slice(2))
  const [textA, textB] = await Promise.all([
    loadSource(sourceA),
    loadSource(sourceB),
  ])
  const result = compareTexts(textA, textB)

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
