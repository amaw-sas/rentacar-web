/**
 * Partners "Empresas Aliadas" — los LOGOS son enlaces con destino mapeado.
 *
 * La sección ya renderiza logos SVG reales (ver Partners.test.ts). Este archivo
 * cubre lo que aquéllos no: que cada logo sea clicable y a dónde lleva.
 *
 *   - SCEN-ALLY-01: cada logo va envuelto en un <a> que abre en pestaña nueva
 *     con rel="noopener noreferrer" (salida a dominio externo).
 *   - SCEN-ALLY-02: el mapeo nombre → destino es el definido por negocio. Ojo:
 *     el destino NO coincide con la marca del logo en dos casos (decisión
 *     comercial, no un error):
 *       Localiza        → alquilatucarro.com
 *       Alquilatucarro  → alquilatucarro.com
 *       Avis            → alquicarros.com
 *       Alquicarros     → alquicarros.com
 *   - SCEN-ALLY-03: el nombre del aliado sigue siendo anunciable (alt + aria-label),
 *     porque el contenido clicable es una imagen.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..') // → packages/ui-alquilame
const partners = readFileSync(join(ROOT, 'app/components/home/Partners.vue'), 'utf-8')

describe('Partners — logos clicables', () => {
  it('SCEN-ALLY-01: cada logo abre en pestaña nueva y de forma segura', () => {
    expect(partners).toMatch(/<a[\s\S]*?:href="ally\.href"/)
    expect(partners).toMatch(/target="_blank"/)
    expect(partners).toMatch(/rel="noopener noreferrer"/)
    // el <img> vive DENTRO del enlace
    expect(partners).toMatch(/<a[\s\S]*?<img[\s\S]*?<\/a>/)
  })

  it('SCEN-ALLY-02: el mapeo nombre → destino es el de negocio', () => {
    expect(partners).toMatch(/name:\s*'Localiza'[^}]*href:\s*'https:\/\/alquilatucarro\.com'/)
    expect(partners).toMatch(/name:\s*'Alquilatucarro'[^}]*href:\s*'https:\/\/alquilatucarro\.com'/)
    expect(partners).toMatch(/name:\s*'Avis'[^}]*href:\s*'https:\/\/alquicarros\.com'/)
    expect(partners).toMatch(/name:\s*'Alquicarros'[^}]*href:\s*'https:\/\/alquicarros\.com'/)
  })

  it('SCEN-ALLY-03: el nombre del aliado sigue siendo anunciable', () => {
    expect(partners).toMatch(/:alt="ally\.name"/)
    expect(partners).toMatch(/:aria-label="ally\.name"/)
  })
})
