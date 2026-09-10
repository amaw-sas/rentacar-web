// @vitest-environment happy-dom
/**
 * Holdout: rentacar-dashboard docs/specs/pqrs-mesa-de-ayuda/scenarios/pqrs.scenarios.md
 * Cubre SCEN-PQRS-026 y la parte de 023 que decide el componente.
 *
 * ESTE FICHERO EXISTE PORQUE LA RED NO EXISTÍA. Se citaban tres suites como protección
 * del componente; dos de ellas (gana-route.test.ts:78, city-index-links.test.ts:103)
 * leen el `.vue` como TEXTO y le aplican una regex, así que pasarían con el componente
 * hecho trizas. Solo opinion.test.ts lo monta de verdad, y solo por la vía de /opinion.
 * Ampliar la unión de tipos sin esto sería tocar código compartido a ciegas.
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed, reactive, watch, nextTick } from 'vue'

// Los auto-imports de Nuxt no existen fuera de Nuxt: el componente llama a `reactive`,
// `ref` y `computed` como globales. Mismo arnés que opinion.test.ts, que es la única
// suite que ya montaba este componente de verdad.
beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('nextTick', nextTick)
})
import PublicContactForm, { type PublicFormField } from '../PublicContactForm.vue'

const montados: { unmount: () => void }[] = []
afterEach(() => {
  while (montados.length) montados.pop()!.unmount()
})

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ radicado: 'PQRS-2026-000123', due_at: null })
  vi.stubGlobal('$fetch', fetchMock)
})

const campos: PublicFormField[] = [
  { name: 'nombre', label: 'Nombre completo', type: 'text', required: true },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
  {
    name: 'pqrs_type',
    label: '¿Qué nos quieres decir?',
    type: 'radio',
    required: true,
    options: ['Petición', 'Queja', 'Reclamo', 'Sugerencia'],
  },
  { name: 'mensaje', label: 'Cuéntanos qué pasó', type: 'textarea', required: true },
  { name: 'consentimiento', label: 'Autorizo el tratamiento', type: 'checkbox', required: true },
]

function montar(props: Record<string, unknown> = {}) {
  const w = mount(PublicContactForm, {
    attachTo: document.body,
    props: { type: 'quejas', fields: campos, ...props },
  })
  montados.push(w)
  return w
}

const radios = (w: ReturnType<typeof montar>) =>
  w.findAll<HTMLInputElement>('input[type="radio"]')

async function rellenar(w: ReturnType<typeof montar>, opts: { tipo?: boolean } = {}) {
  await w.find('#f-nombre').setValue('Ana Pérez')
  await w.find('#f-email').setValue('ana@example.com')
  await w.find('#f-mensaje').setValue('El carro llegó sucio.')
  await w.find('#f-consentimiento').setValue(true)
  if (opts.tipo !== false) await radios(w)[1]!.setValue(true)
}

describe('tipo radio', () => {
  it('SCEN-026: pinta una opción por valor', () => {
    const w = montar()
    expect(radios(w)).toHaveLength(4)
  })

  it('las opciones comparten el mismo name, o el navegador no las agrupa', () => {
    const w = montar()
    const names = new Set(radios(w).map((r) => r.element.name))
    expect(names.size).toBe(1)
  })

  it('cada opción tiene su etiqueta asociada por id', () => {
    const w = montar()
    for (const r of radios(w)) {
      const id = r.element.id
      expect(w.find(`label[for="${id}"]`).exists(), `sin label para ${id}`).toBe(true)
    }
  })

  it('el grupo va en un fieldset con legend, para que se anuncie la pregunta', () => {
    // Sin esto, un lector de pantalla lee cuatro opciones sueltas sin saber de qué.
    const w = montar()
    const fieldsets = w.findAll('fieldset')
    const conRadios = fieldsets.filter((f) => f.findAll('input[type="radio"]').length > 0)
    expect(conRadios).toHaveLength(1)
    expect(conRadios[0]!.find('legend').text()).toContain('¿Qué nos quieres decir?')
  })

  it('no se envía sin elegir tipo, y el error se anuncia', async () => {
    const w = montar()
    await rellenar(w, { tipo: false })
    await w.find('form').trigger('submit')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(w.find('[role="alert"]').text()).toBeTruthy()
  })

  it('el valor elegido viaja en el cuerpo', async () => {
    const w = montar()
    await rellenar(w)
    await w.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].body).toMatchObject({ pqrs_type: 'Queja' })
  })

  it('SCEN-026: el campo del tipo NO pisa el discriminante del endpoint', async () => {
    // El cuerpo se compone como { type: props.type, ...values }: un campo llamado
    // `type` sobrescribiría el discriminante y la queja dejaría de enrutarse.
    const w = montar()
    await rellenar(w)
    await w.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))
    expect(fetchMock.mock.calls[0][1].body.type).toBe('quejas')
  })
})

describe('mensaje de éxito con la respuesta del servidor', () => {
  it('SCEN-023: puede mostrar el radicado que devuelve el endpoint', async () => {
    const w = montar({
      successMessage: (r: { radicado: string }) => `Radicado ${r.radicado}`,
    })
    await rellenar(w)
    await w.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))
    await w.vm.$nextTick()
    expect(w.find('form [role="status"]').text()).toContain('PQRS-2026-000123')
  })

  it('un successMessage de texto sigue funcionando igual que antes', async () => {
    // Los otros tres formularios lo pasan como string; no pueden notar el cambio.
    const w = montar({ successMessage: '¡Listo! Recibimos tu mensaje.' })
    await rellenar(w)
    await w.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))
    await w.vm.$nextTick()
    expect(w.find('form [role="status"]').text()).toContain('Recibimos tu mensaje')
  })

  it('si el envío falla, el error se ve y lo escrito se conserva', async () => {
    fetchMock.mockRejectedValue({ data: { statusMessage: 'No pudimos enviar tu mensaje.' } })
    const w = montar()
    await rellenar(w)
    await w.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))
    await w.vm.$nextTick()
    expect(w.find('[role="alert"]').text()).toContain('No pudimos enviar')
    // Lo escrito sigue ahí: quien ya contó su problema no debería contarlo dos veces.
    expect(w.find<HTMLInputElement>('#f-nombre').element.value).toBe('Ana Pérez')
  })
})
