/**
 * Comprueba que el precio congelado en el hero de alquicarros sigue siendo la
 * mensualidad real.
 *
 * El hero del index es estático por decisión del dueño (2026-08-11): no consulta
 * Supabase, lleva la tarifa escrita. Eso significa que envejece en silencio. Este
 * script es el despertador: lee el payload de la página renderizada, aplica la
 * misma regla que Fleet.vue ("la 1k_kms activa positiva más barata de la Gama C")
 * y la compara contra la constante del componente.
 *
 * No vive en la suite de vitest a propósito: necesita red, y un test que depende
 * de red convierte cualquier corte en un CI rojo que nadie se cree.
 *
 *   node scripts/check-hero-pricing.mjs                        # contra localhost:4001
 *   node scripts/check-hero-pricing.mjs https://alquicarros.com
 *
 * Sale con código 1 si el hero y los datos han divergido.
 */
import { readFileSync } from 'node:fs'

/**
 * Resuelve el payload de Nuxt (formato devalue) sin importar `devalue`: el
 * paquete existe en .pnpm pero no está hoisted en la raíz, y no merece una
 * dependencia nueva. El formato es un array plano donde objetos y arrays
 * guardan ÍNDICES en lugar de valores; los primitivos se guardan tal cual.
 */
function parsePayload(json) {
  const flat = JSON.parse(json)
  const seen = new Map()
  // Nuxt envuelve los valores reactivos: ["ShallowReactive", 12] apunta al 12.
  const WRAPPERS = new Set([
    'ShallowReactive',
    'Reactive',
    'Ref',
    'ShallowRef',
    'EmptyRef',
    'EmptyShallowRef',
  ])
  const resolve = (i) => {
    if (seen.has(i)) return seen.get(i)
    const node = flat[i]
    if (Array.isArray(node) && node.length === 2 && WRAPPERS.has(node[0])) {
      return resolve(node[1])
    }
    if (Array.isArray(node)) {
      const out = []
      seen.set(i, out)
      node.forEach((ref) => out.push(resolve(ref)))
      return out
    }
    if (node && typeof node === 'object') {
      const out = {}
      seen.set(i, out)
      for (const [k, ref] of Object.entries(node)) out[k] = resolve(ref)
      return out
    }
    return node
  }
  return resolve(0)
}

const HERO = 'packages/ui-alquicarros/app/components/home/Hero.vue'
const url = process.argv[2] ?? 'http://localhost:4001/'

function heroConstant(name) {
  const digits = readFileSync(HERO, 'utf8').match(new RegExp(`const ${name} = ([\\d_]+)`))?.[1]
  if (!digits) throw new Error(`${HERO} ya no declara ${name}`)
  return Number(digits.replace(/_/g, ''))
}

const html = await fetch(url).then((r) => r.text())
const payload = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1]
if (!payload) {
  console.error(`No hay payload de Nuxt en ${url}. ¿Es la app o el sitio viejo?`)
  process.exit(2)
}

const state = parsePayload(payload).state ?? {}
const key = Object.keys(state).find((k) => k.includes('rentacar-data'))
const categories = state[key]?.categories ?? []
const gamaC = categories.find((c) => c.id === 'C')
if (!gamaC) {
  console.error('La Gama C no aparece en los datos. Revisa la regla antes de tocar el hero.')
  process.exit(2)
}

// Misma selección que pickRepresentativeMonthlyPrice en Fleet.vue.
const monthly = (gamaC.month_prices ?? [])
  .filter((p) => p.status === 'active' && p['1k_kms'] > 0)
  .map((p) => p['1k_kms'])
  .sort((a, b) => a - b)[0]

const frozen = heroConstant('MONTHLY_1K_KMS_COP')
const days = heroConstant('MONTHLY_PLAN_DAYS')
const cop = (n) => `$${n.toLocaleString('es-CO')}`

if (monthly === frozen) {
  console.log(`OK — el hero anuncia ${cop(Math.ceil(frozen / days))}/día y los datos siguen en ${cop(monthly)}/mes.`)
  process.exit(0)
}

console.error(
  `DESFASE — el hero dice ${cop(Math.ceil(frozen / days))}/día (${cop(frozen)}/mes) ` +
    `pero la mensualidad real es ${cop(monthly)}/mes, o sea ${cop(Math.ceil(monthly / days))}/día.\n` +
    `Actualiza MONTHLY_1K_KMS_COP en ${HERO} y su test.`,
)
process.exit(1)
