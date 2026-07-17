import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import usePhoneField, { PHONE_ERROR_ID } from '../usePhoneField'

// SCEN-322-X01 (issue #322): a visible telefono validation error must be
// programmatically associated with the input. vue-tel-input forwards
// 'aria-describedby' from inputOptions to its native <input>, so the composable
// sets it there while the field has errors; aria-invalid is NOT part of
// vue-tel-input's bound attribute list, so the composable reflects it onto the
// #telefono element directly (client-only). Functional slice: fake UForm ref
// whose getErrors reads a reactive errors array — same reactivity contract as
// @nuxt/ui's Form (errors live in a reactive ref that getErrors filters).

type FakeForm = {
  validate: (opts: { name: string }) => Promise<unknown>
  getErrors: (name: string) => unknown[]
}

function makeForm() {
  const errors = ref<Array<{ name: string; message: string }>>([])
  const form = ref<FakeForm>({
    validate: async () => undefined,
    getErrors: () => errors.value,
  })
  return { errors, form }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SCEN-322-X01 — telefono error is announced to the screen reader', () => {
  it('sets aria-describedby to the error message id only while the error is visible', async () => {
    const { errors, form } = makeForm()
    const { phoneInputOptions, phoneFieldInvalid } = usePhoneField(
      form as never,
      () => '3001234567',
    )

    expect(phoneFieldInvalid.value).toBe(false)
    expect(phoneInputOptions.value['aria-describedby']).toBeUndefined()

    errors.value = [{ name: 'telefono', message: 'Número no válido' }]
    await nextTick()
    expect(phoneFieldInvalid.value).toBe(true)
    expect(phoneInputOptions.value['aria-describedby']).toBe(PHONE_ERROR_ID)
    expect(PHONE_ERROR_ID).toBe('telefono-error')

    errors.value = []
    await nextTick()
    expect(phoneInputOptions.value['aria-describedby']).toBeUndefined()
  })

  it('reflects aria-invalid onto the #telefono input (vue-tel-input cannot bind it)', async () => {
    const el = { setAttribute: vi.fn(), removeAttribute: vi.fn() }
    vi.stubGlobal('document', { getElementById: (id: string) => (id === 'telefono' ? el : null) })

    const { errors, form } = makeForm()
    usePhoneField(form as never, () => '3001234567')

    errors.value = [{ name: 'telefono', message: 'Número no válido' }]
    await nextTick()
    expect(el.setAttribute).toHaveBeenCalledWith('aria-invalid', 'true')

    errors.value = []
    await nextTick()
    expect(el.removeAttribute).toHaveBeenCalledWith('aria-invalid')
  })

  it('keeps the #276 revalidation bridge intact (blur handler + debounced watch)', () => {
    const { form } = makeForm()
    const validateSpy = vi.spyOn(form.value, 'validate')
    const api = usePhoneField(form as never, () => '3001234567')
    api.validatePhoneField()
    expect(validateSpy).toHaveBeenCalledWith({ name: 'telefono' })
  })
})
