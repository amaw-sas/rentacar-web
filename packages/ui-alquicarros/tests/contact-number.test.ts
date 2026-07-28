/**
 * Brand contact number — single source of truth (dogfood /reservas, finding #2).
 *
 * SoT = Supabase `franchises` row for alquicarros:
 *   phone = 3187703670, whatsapp = 573187703670  →  "318 770 3670".
 *
 * Regression context (same leak as alquilame): app.config `phone` carried
 * 301 672 9250 (ALQUILATUCARRO's line) and `whatsapp` a stale 314 682 6821
 * (no franchises row), with error.vue + the privacy policy hardcoding 301.
 * The wizard outage block (StepVehicle) carries the correct local number.
 *
 * Every alquicarros contact surface must resolve to 318 770 3670 and nothing
 * else. Static-source assertions; runtime hrefs/tel verified in the dogfood pass.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8')

// Todos los .vue bajo el árbol del wizard (SCEN-366-06: "ningún componente del wizard").
function wizardVueFiles(dir = 'app/components/wizard'): string[] {
  const out: string[] = []
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) out.push(...wizardVueFiles(rel))
    else if (entry.name.endsWith('.vue')) out.push(rel)
  }
  return out
}

// Numbers that must NEVER appear as an alquicarros contact:
//  - 301 672 9250 / 573016729250  -> alquilatucarro's line
//  - 314 682 6821 / 573146826821  -> stale, present in no franchises row
const FOREIGN = /301[\s-]?672[\s-]?9250|573016729250|314[\s-]?682[\s-]?6821|573146826821/

describe('alquicarros contact number — single SoT 318 770 3670', () => {
  const appConfig = read('app/app.config.ts')

  it('app.config.phone is the alquicarros number (318 770 3670), not 301', () => {
    expect(appConfig).toMatch(/phone:\s*["']\+?57\s*318\s*770\s*3670["']/)
  })

  it('app.config.whatsapp deep-links to wa.me/573187703670', () => {
    expect(appConfig).toContain('whatsapp: "https://wa.me/573187703670"')
  })

  it('app.config carries no foreign brand number', () => {
    expect(appConfig).not.toMatch(FOREIGN)
  })

  it('error.vue binds WhatsApp to franchise.whatsapp (no hardcoded number)', () => {
    const errpage = read('app/error.vue')
    expect(errpage).toMatch(/:href="franchise\.whatsapp"/)
    expect(errpage).not.toMatch(/wa\.me\/\d+/)
  })

  it('privacy policy derives contact from franchise (no foreign number)', () => {
    expect(read('app/pages/politica-privacidad.vue')).not.toMatch(FOREIGN)
  })

  it('the wizard outage contact derives from franchise (no hardcoded number) — issue #366 D5', () => {
    // Antes: un literal { phone: '3187703670', display: '318 770 3670' } propio del wizard,
    // tercera copia del mismo dato. Ahora comparte fuente con error.vue y el bloque de D3:
    // franchise (app.config). La regla es la MISMA que este archivo ya exige a error.vue —
    // referencia franchise.whatsapp y NO deja ningún wa.me/<dígitos> hardcodeado. Más
    // estricto, no más laxo: el literal ya no puede reaparecer.
    const step = read('app/components/wizard/steps/StepVehicle.vue')
    expect(step).toMatch(/franchise\.whatsapp/)
    expect(step).not.toMatch(/wa\.me\/\d+/)
    expect(step).not.toMatch(/3187703670/)
  })

  it('NINGÚN componente del wizard hardcodea un wa.me/<dígitos> (SCEN-366-06)', () => {
    // El escenario habla de "el wizard", no solo de StepVehicle: el bloque de estado
    // desconocido (D3) vive en ReservationWizard.vue y también consume franchise. Un
    // barrido del árbol atrapa cualquier reaparición del literal en cualquier paso.
    const offenders = wizardVueFiles().filter((f) => /wa\.me\/\d+/.test(read(f)))
    expect(offenders).toEqual([])
  })
})
