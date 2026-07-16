import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as v from 'valibot'
import { UserInformationFormValidationSchema } from '../../utils/validation/userInformationForm'

// Scenarios: docs/specs/2026-07-16-issue-311-consentimiento-datos/scenarios/
//            consentimiento-datos-pre-marcado.scenarios.md
// Issue:     https://github.com/amaw-sas/rentacar-web/issues/311
//
// Ley 1581/2012 (habeas data) exige consentimiento previo, EXPRESO e informado:
// la casilla de tratamiento de datos no puede venir pre-marcada. El default vive
// en el store compartido por las 3 marcas, así que un solo guard fuente-level
// cubre alquilatucarro, alquicarros y alquilame (SCEN-311-01). El bloqueo del
// submit sin consentimiento es conducta de la validación valibot (SCEN-311-02),
// verificable en runtime sin bootear Pinia/Nuxt.

const source = readFileSync(
  fileURLToPath(new URL('../useStoreReservationForm.ts', import.meta.url)),
  'utf8',
)

const CONSENT_MSG = 'Debe aceptar las políticas de privacidad'

const validBase = {
  nombreCompleto: 'Pablo',
  apellidos: 'Díaz',
  tipoIdentificacion: 'Cedula Ciudadania',
  identificacion: '1020304050',
  telefono: '+573001234567',
  email: 'pablo@example.com',
}

describe('politicaPrivacidad — consentimiento expreso (issue #311)', () => {
  // SCEN-311-01: la casilla aparece SIN marcar al abrir el formulario.
  // Source-level (convención de este archivo de tests): el ref del store —
  // única fuente del default para las 3 marcas — debe inicializar en false.
  it('el store inicializa politicaPrivacidad en false (no pre-marcada)', () => {
    expect(source).toMatch(
      /const politicaPrivacidad = ref<boolean \| undefined>\(false\);/,
    )
  })

  // SCEN-311-02: submit sin consentimiento → bloqueado con mensaje.
  it('la validación rechaza el formulario con la casilla sin marcar', () => {
    const result = v.safeParse(UserInformationFormValidationSchema, {
      ...validBase,
      politicaPrivacidad: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.map((i) => i.message)).toContain(CONSENT_MSG)
    }
  })

  it('la validación rechaza politicaPrivacidad ausente/undefined con el mismo mensaje', () => {
    const result = v.safeParse(UserInformationFormValidationSchema, {
      ...validBase,
      politicaPrivacidad: undefined,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.map((i) => i.message)).toContain(CONSENT_MSG)
    }
  })

  // SCEN-311-04 (mitad de validación): con consentimiento expreso el formulario pasa.
  it('la validación acepta el formulario con la casilla marcada', () => {
    expect(
      v.safeParse(UserInformationFormValidationSchema, {
        ...validBase,
        politicaPrivacidad: true,
      }).success,
    ).toBe(true)
  })
})
