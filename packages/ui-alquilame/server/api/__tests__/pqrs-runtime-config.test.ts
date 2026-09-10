/**
 * Holdout: rentacar-dashboard docs/specs/pqrs-mesa-de-ayuda/scenarios/pqrs.scenarios.md
 * Cubre SCEN-PQRS-027b — la clave configurada tiene que LLEGAR de verdad al servidor.
 *
 * Nuxt ignora las variables de entorno de claves ausentes de `runtimeConfig`, y el
 * propio nuxt.config.ts lo deja escrito a propósito de otra clave. Sin la declaración,
 * `NUXT_PQRS_API_KEY` nunca llega, el fail-closed dispara SIEMPRE y el canal muere en
 * producción con la variable correctamente puesta en Vercel. Este test es la única cosa
 * que se dará cuenta si alguien borra esa línea.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const config = readFileSync(join(__dirname, '../../../nuxt.config.ts'), 'utf8')

describe('runtimeConfig del canal PQRS', () => {
  it('declara pqrsApiKey, o NUXT_PQRS_API_KEY nunca llegaría', () => {
    expect(config).toMatch(/pqrsApiKey\s*:/)
  })

  it('la declara vacía: el valor real vive en el entorno, no en el repo', () => {
    expect(config).toMatch(/pqrsApiKey\s*:\s*['"]{2}/)
  })

  it('no la declara en la sección public: es un secreto', () => {
    // Todo lo que esté bajo `public` viaja al navegador.
    const publicIdx = config.indexOf('public: {')
    const keyIdx = config.search(/pqrsApiKey\s*:/)
    expect(keyIdx).toBeGreaterThan(-1)
    expect(keyIdx).toBeLessThan(publicIdx)
  })

  it('reutiliza rentacarAdminUrl en vez de duplicar la URL del dashboard', () => {
    expect(config).toMatch(/rentacarAdminUrl\s*:/)
    expect(config).not.toMatch(/pqrsUrl|pqrsEndpoint/)
  })
})
