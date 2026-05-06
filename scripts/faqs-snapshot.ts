/**
 * One-shot snapshot of faqsConfig → faqs-data.json for FAQs Supabase migration (#12).
 *
 * Extrae los 3 campos que migran a Supabase: label, content, display_order.
 * El display_order viene del índice del array (orden semántico actual del config).
 * El resultado vive en `scripts/faqs-data.json` y es input del seed via MCP
 * en Step 7 del plan.
 *
 * Después de Step 9 del plan (`faqs.config.ts` borrado), este script no compila —
 * queda como artefacto histórico. faqs-data.json sobrevive y es lo que importa.
 *
 * Run: npx tsx scripts/faqs-snapshot.ts
 */
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { faqsConfig } from '../packages/logic/src/config/faqs.config'

interface FAQSnapshot {
  label: string
  content: string
  display_order: number
}

const snapshot: FAQSnapshot[] = faqsConfig.map((faq, index) => ({
  label: faq.label,
  content: faq.content,
  display_order: index,
}))

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(scriptDir, 'faqs-data.json')
writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')

console.log(`Wrote ${snapshot.length} FAQs to ${outPath}`)
