import { describe, it, expect, vi } from 'vitest'
import * as v from 'valibot'

// Scenarios: docs/specs/2026-10-04-telefono-pais-visitante/scenarios/phone-country.scenarios.md
//
// SCEN-015 — without the full metadata loaded the schema cannot tell a valid
// number from an invalid one, so it fails closed with the generic message, never
// a flag message. Fresh module graph: nothing in this file loads the validator.

describe('UserInformationFormValidationSchema — validator not loaded', () => {
  it('rejects a real Colombian mobile with the generic message', async () => {
    vi.resetModules()
    const validator = await import('../phoneValidator')
    const { UserInformationFormValidationSchema } = await import('../userInformationForm')
    expect(validator.isPhoneValidatorReady()).toBe(false)

    const result = v.safeParse(UserInformationFormValidationSchema, {
      nombreCompleto: 'Juan',
      apellidos: 'Pérez',
      tipoIdentificacion: 'Cedula Ciudadania',
      identificacion: '1020304050',
      telefono: '+57 300 1234567',
      email: 'juan@example.com',
      politicaPrivacidad: true,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.issues
        .filter((i) => i.path?.some((p) => (p as { key?: unknown }).key === 'telefono'))
        .map((i) => i.message)
      expect(messages).toEqual(['Número de teléfono o WhatsApp no válido'])
    }
  })
})
