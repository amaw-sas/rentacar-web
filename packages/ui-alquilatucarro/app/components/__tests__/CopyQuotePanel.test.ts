// @vitest-environment jsdom
/**
 * Montaje real del panel «Copiar cotización» de alquilatucarro (el panel solo se
 * monta para asesores: el padre lo carga con LazyCopyQuotePanel + v-if="isAdvisor").
 * useCopyQuote se dobla; UButton/UCheckbox se reducen a controles nativos.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, toRef, onBeforeUnmount, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import CopyQuotePanel from '../CopyQuotePanel.vue'

const canCopy = ref(true)
const copy = vi.fn()

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('toRef', toRef)
  vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
  vi.stubGlobal('useCopyQuote', () => ({ canCopy, copy }))
})
afterAll(() => vi.unstubAllGlobals())

const UButton = defineComponent({
  props: { label: String },
  emits: ['click'],
  setup: (p, { emit }) => () => h('button', { type: 'button', onClick: () => emit('click') }, p.label),
})
const UCheckbox = defineComponent({
  props: { modelValue: Boolean, label: String },
  emits: ['update:modelValue'],
  setup: (p, { emit }) => () =>
    h('label', [
      h('input', {
        type: 'checkbox',
        checked: p.modelValue,
        onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).checked),
      }),
      p.label,
    ]),
})

const factory = () =>
  mount(CopyQuotePanel, { props: { rows: [] }, global: { stubs: { UButton, UCheckbox } } })

const box = (w: ReturnType<typeof factory>, label: string) =>
  w.findAll('label').find((l) => l.text() === label)!.find('input')
const button = (w: ReturnType<typeof factory>) => w.find('button')

beforeEach(() => {
  vi.useFakeTimers()
  canCopy.value = true
  copy.mockReset().mockResolvedValue(true)
})
afterEach(() => vi.useRealTimers())

describe('CopyQuotePanel — montaje', () => {
  it('pasa solo «Con silla de bebé» a copy', async () => {
    const w = factory()
    await box(w, 'Con silla de bebé').setValue(true)
    await button(w).trigger('click')
    expect(copy).toHaveBeenCalledWith({ totalCoverage: false, babySeat: true })
  })

  it('pasa solo «Con Seguro Total» a copy', async () => {
    const w = factory()
    await box(w, 'Con Seguro Total').setValue(true)
    await button(w).trigger('click')
    expect(copy).toHaveBeenCalledWith({ totalCoverage: true, babySeat: false })
  })

  it('muestra «Copiada» y a los 2000 ms vuelve a «Copiar cotización»', async () => {
    const w = factory()
    expect(button(w).text()).toBe('Copiar cotización')
    await button(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(button(w).text()).toBe('Copiada')
    await vi.advanceTimersByTimeAsync(1999)
    expect(button(w).text()).toBe('Copiada')
    await vi.advanceTimersByTimeAsync(1)
    expect(button(w).text()).toBe('Copiar cotización')
  })

  it('no pinta nada si canCopy es false', async () => {
    canCopy.value = false
    const w = factory()
    await nextTick()
    expect(w.find('[data-testid="copy-quote-panel"]').exists()).toBe(false)
    expect(w.find('button').exists()).toBe(false)
  })

  it('no dice «Copiada» si copy resuelve false', async () => {
    copy.mockResolvedValue(false)
    const w = factory()
    await button(w).trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(button(w).text()).toBe('Copiar cotización')
    expect(w.text()).not.toContain('Copiada')
  })
})

describe('CategorySelectionSection — montaje del panel', () => {
  const section = readFileSync(resolve(process.cwd(), 'app/components/CategorySelectionSection.vue'), 'utf8')

  it('carga el panel con Lazy y solo si isAdvisor (el visitante no lo descarga)', () => {
    expect(section).toMatch(/<LazyCopyQuotePanel\s+v-if="isAdvisor"\s+:rows="renderableCategories"\s*\/>/)
    expect(section).toMatch(/const \{ isAdvisor \} = useAdvisorMode\(\)/)
  })
})
