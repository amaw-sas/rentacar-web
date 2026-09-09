// @vitest-environment happy-dom
/**
 * Que cada campo pinte UN control y sólo uno.
 *
 * Nació de un fallo real: al meter el contador de caracteres ENTRE el
 * `<textarea v-if>` y el `<input v-else>`, el `v-else` dejó de ser hermano
 * inmediato de su `v-if` y se enganchó al del contador. Resultado: el campo
 * `mensaje` pintaba un textarea Y un input fantasma con el MISMO id, lo que
 * rompe la relación <label for> y deja dos controles compitiendo por el foco.
 *
 * Las pruebas que ya existían no lo vieron porque `wrapper.find('#f-mensaje')`
 * devuelve el primer coincidente y ese era el textarea correcto. Hay que CONTAR,
 * no buscar.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed, reactive, watch, nextTick } from 'vue'
import PublicContactForm from '~/components/PublicContactForm.vue'

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('nextTick', nextTick)
  vi.stubGlobal('$fetch', vi.fn())
})
afterAll(() => vi.unstubAllGlobals())

const FIELDS = [
  { name: 'nombre', label: 'Nombre', type: 'text' as const },
  { name: 'mensaje', label: 'Mensaje', type: 'textarea' as const },
]

const factory = () => mount(PublicContactForm, { props: { type: 'resenas', fields: FIELDS } })

/** Inputs que la persona ve; el honeypot no cuenta. */
const visibleInputs = (w: ReturnType<typeof factory>) =>
  w.findAll('input').filter((i) => i.attributes('id') !== 'f-website').length

describe('un campo, un control', () => {
  it('sin el contador a la vista', () => {
    const w = factory()
    expect(w.findAll('textarea')).toHaveLength(1)
    expect(visibleInputs(w)).toBe(1)
    expect(w.find('#f-mensaje').element.tagName).toBe('TEXTAREA')
  })

  it('y con el contador a la vista', async () => {
    const w = factory()
    await w.find('#f-mensaje').setValue('x'.repeat(1600))
    expect(w.find('[data-test="contador-mensaje"]').exists()).toBe(true)
    expect(w.findAll('textarea')).toHaveLength(1)
    expect(visibleInputs(w)).toBe(1)
    expect(w.find('#f-mensaje').element.tagName).toBe('TEXTAREA')
  })

  it('ningún id se repite en el formulario', async () => {
    const w = factory()
    await w.find('#f-mensaje').setValue('x'.repeat(1600))
    const ids = w.findAll('[id]').map((e) => e.attributes('id')!)
    expect(ids).toHaveLength(new Set(ids).size)
  })
})
