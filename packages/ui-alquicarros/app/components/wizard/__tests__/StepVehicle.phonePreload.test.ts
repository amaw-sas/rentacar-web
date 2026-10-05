import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../steps/StepVehicle.vue', import.meta.url)),
  'utf8',
)
const scriptSetup = source.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? ''

// Review fix 3 (spec 2026-10-04 telefono-pais-visitante): the phone field's three
// loads start while the customer browses the vehicles (Paso 2), so the field is
// usually ready by the time the data step opens.
describe('Paso 2 warms up the reservation phone field', () => {
  it('imports preloadPhoneField from the logic utils', () => {
    expect(scriptSetup).toMatch(
      /import\s*\{[^}]*\bpreloadPhoneField\b[^}]*\}\s*from\s*["']@rentacar-main\/logic\/utils["']/,
    )
  })

  it('preloads vue-tel-input once there are vehicles to show', () => {
    expect(scriptSetup).toMatch(
      /watch\(\s*\(\)\s*=>\s*groups\.value\.length\s*>\s*0,\s*\(available\)\s*=>\s*\{\s*(?:\/\/[^\n]*\s*)?if\s*\(available\)\s*preloadPhoneField\(\(\)\s*=>\s*import\(["']vue-tel-input["']\)\);?\s*\},\s*\{\s*immediate:\s*true\s*\},?\s*\)/,
    )
  })
})
