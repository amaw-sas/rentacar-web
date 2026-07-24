// @vitest-environment jsdom
//
// Issue #368 B1 — evidencia DOM del SHELL del wizard. `vitest.config.ts:12` fija
// `environment: 'node'` para toda la marca, así que el docblock de arriba es lo que
// hace que exista DOM en este archivo.
//
// Este archivo arranca con lo que demuestra que el arnés es load-bearing (paso 4 del
// plan) y crece con los escenarios de arrastre y aviso (pasos 5 a 7).
import { describe, it, expect, afterEach, vi } from 'vitest'

import { mountWizard } from './harness'

afterEach(() => vi.unstubAllGlobals())

describe('arnés — el shell monta con disponibilidad real', () => {
  it('pinta la rama de tiles, no el estado vacío, y el resumen está presente', async () => {
    // Las precondiciones las afirma `mountWizard`; esto fija que existen las cards,
    // que son el único disparador de onSelect.
    const { wrapper } = await mountWizard()

    expect(wrapper.find('[data-testid="wizard-select-C-test"]').exists()).toBe(true)
  })

  it('la fila "Vehículo" del resumen refleja la gama elegida (humo de extremo a extremo)', async () => {
    const { summaryRow, selectGama } = await mountWizard()

    expect(summaryRow('Vehículo')).toBe('Elige →')

    await selectGama('C')

    expect(summaryRow('Vehículo')).toContain('C')
  })

  it('fijar withTotalCoverage en la instancia se observa en haveTotalInsurance (la ruta flush: sync está viva)', async () => {
    // Es lo que prueba que este arnés vale para los pasos 5 a 7: el watcher de
    // derivación de ReservationWizard.vue:129-142 corre de verdad sobre la instancia
    // real, no sobre un doble.
    const { search, form, selectGama, wrapper } = await mountWizard()

    await selectGama('C')
    expect(form.haveTotalInsurance).toBe(false)

    search.selectedCategory!.withTotalCoverage = true
    await wrapper.vm.$nextTick()

    expect(form.haveTotalInsurance).toBe(true)
  })

  it('togglear pending descarta la gama elegida (el reset del shell corre)', async () => {
    const { search, selectGama, runSearch } = await mountWizard()

    await selectGama('C')
    expect(search.selectedCategory).not.toBeNull()

    await runSearch()

    expect(search.selectedCategory).toBeNull()
  })
})
