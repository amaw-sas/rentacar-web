// @vitest-environment jsdom
/**
 * Montaje real del panel «Copiar cotización» del wizard (solo asesores: StepVehicle
 * lo carga con defineAsyncComponent + v-if="advisor"). useCopyQuote se dobla.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const canCopy = ref(true)
const copy = vi.fn()

vi.mock('@rentacar-main/logic/composables/useCopyQuote', () => ({
  default: () => ({ canCopy, copy }),
}))

import CopyQuotePanel from '../CopyQuotePanel.vue'

const factory = () => mount(CopyQuotePanel, { props: { rows: [] }, global: { stubs: { UIcon: true } } })
type W = ReturnType<typeof factory>

const box = (w: W, label: string) =>
  w.findAll('label').find((l) => l.text() === label)!.find('input')
const button = (w: W) => w.find('[data-testid="copy-quote-button"]')

beforeEach(() => {
  vi.useFakeTimers()
  canCopy.value = true
  copy.mockReset().mockResolvedValue(true)
})
afterEach(() => vi.useRealTimers())

describe('wizard CopyQuotePanel — montaje', () => {
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
  })
})

describe('StepVehicle — montaje del panel', () => {
  const step = readFileSync(resolve(process.cwd(), 'app/components/wizard/steps/StepVehicle.vue'), 'utf8')

  it('carga el panel async y solo si hay asesor (el visitante no lo descarga)', () => {
    expect(step).toMatch(/<CopyQuotePanel\s+v-if="advisor"\s+:rows="quoteRows"\s+:advisor-name="advisor\.name"\s*\/>/)
    expect(step).toMatch(/defineAsyncComponent\(\(\) => import\('\.\.\/CopyQuotePanel\.vue'\)\)/)
    expect(step).toMatch(/const \{ advisor \} = useAdvisorMode\(\)/)
  })

  it('construye las filas desde groups y rowByCode', () => {
    expect(step).toMatch(/quoteRowsFromGroups\(groups\.value,\s*rowByCode\.value\)/)
  })
})

describe('CopyQuotePanel — nombre del asesor', () => {
  it('muestra «Asesor: {nombre}» junto al botón', () => {
    const w = mount(CopyQuotePanel, { props: { rows: [], advisorName: 'Daniela' }, global: { stubs: { UIcon: true } } })
    expect(w.find('[data-testid="copy-quote-advisor"]').text()).toBe('Asesor: Daniela')
  })

  it('sin nombre no pinta la etiqueta', () => {
    const w = mount(CopyQuotePanel, { props: { rows: [] }, global: { stubs: { UIcon: true } } })
    expect(w.find('[data-testid="copy-quote-advisor"]').exists()).toBe(false)
  })
})
