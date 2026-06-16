// Holdout para #64 — ReserveAction + eliminar SearchAction falso.
// Ejecuta useBaseSEO con los auto-imports de Nuxt stubbeados y captura el grafo
// que se pasa a useSchemaOrg, para aserción directa sobre el output (no el source).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useBaseSEO } from '../src/composables/useBaseSEO'

const FRANCHISE = {
  name: 'Marca Test',
  title: 'Marca Test — alquiler',
  shortname: 'MT',
  description: 'desc',
  website: 'https://marca.test',
  logo: 'https://marca.test/logo.png',
  phone: '+57 300',
  email: 'a@b.co',
  socialmedia: ['https://x.com/mt'],
}
const ORGANIZATION = { name: 'AMAW SAS', logo: 'l', brand: 'B', otherbrands: ['C'] }

let captured: any[] = []

beforeEach(() => {
  captured = []
  vi.stubGlobal('useAppConfig', () => ({ franchise: FRANCHISE, organization: ORGANIZATION }))
  // #116: useBaseSEO ahora lee la base de la API pública del dashboard.
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { rentacarPublicApiBase: 'https://api.test' } }))
  vi.stubGlobal('useRoute', () => ({ path: '/' }))
  vi.stubGlobal('useSeoMeta', () => {})
  vi.stubGlobal('useHead', () => {})
  // define* devuelven su input con @type, suficiente para inspeccionar el grafo.
  vi.stubGlobal('defineWebSite', (x: any) => ({ '@type': 'WebSite', ...x }))
  vi.stubGlobal('defineWebPage', (x: any) => ({ '@type': 'WebPage', ...x }))
  vi.stubGlobal('defineOrganization', (x: any) => ({ '@type': 'Organization', ...x }))
  vi.stubGlobal('useSchemaOrg', (graph: any[]) => { captured = graph })
})

afterEach(() => vi.unstubAllGlobals())

// Busca recursivamente nodos cuyo '@type' coincide (string o array).
function findByType(graph: any[], type: string): any[] {
  const out: any[] = []
  const walk = (n: any) => {
    if (!n || typeof n !== 'object') return
    const t = n['@type']
    if (t === type || (Array.isArray(t) && t.includes(type))) out.push(n)
    Object.values(n).forEach((v) => Array.isArray(v) ? v.forEach(walk) : walk(v))
  }
  graph.forEach(walk)
  return out
}

describe('#64 useBaseSEO — ReserveAction reemplaza SearchAction falso', () => {
  it('SCEN-001: no declara ningún SearchAction', () => {
    useBaseSEO()
    expect(findByType(captured, 'SearchAction')).toHaveLength(0)
    // y el WebSite ya no lleva potentialAction falso
    const website = findByType(captured, 'WebSite')[0]
    expect(website?.potentialAction).toBeUndefined()
  })

  it('SCEN-002: declara un ReserveAction resoluble con EntryPoint al sitio', () => {
    useBaseSEO()
    const actions = findByType(captured, 'ReserveAction')
    expect(actions).toHaveLength(1)
    const action = actions[0]
    // #116: target ahora es [web, programático]. El EntryPoint web es el que NO
    // lleva httpMethod (el programático sí). Sus garantías de #64 se mantienen tal cual.
    const targets = Array.isArray(action.target) ? action.target : [action.target]
    const web = targets.find((t: any) => t['@type'] === 'EntryPoint' && !t.httpMethod)
    // EntryPoint a una URL resoluble (no la raíz con {search_term_string})
    expect(web['@type']).toBe('EntryPoint')
    expect(web.urlTemplate).toBe(FRANCHISE.website)
    expect(web.urlTemplate).not.toContain('{search_term_string}')
    // actionPlatform debe usar los IRIs canónicos https:// del enum (no http://)
    expect(web.actionPlatform).toEqual([
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform',
    ])
    // result declara qué produce la acción
    expect(action.result['@type']).toBe('RentalCarReservation')
  })

  it('SCEN-002b: el ReserveAction cuelga del nodo AutoRental', () => {
    useBaseSEO()
    const autoRental = findByType(captured, 'AutoRental')[0]
    expect(autoRental).toBeDefined()
    expect(autoRental.potentialAction['@type']).toBe('ReserveAction')
  })
})
