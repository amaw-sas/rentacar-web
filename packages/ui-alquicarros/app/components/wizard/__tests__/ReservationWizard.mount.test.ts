// @vitest-environment jsdom
//
// Issue #368 B1 — evidencia DOM del SHELL del wizard. `vitest.config.ts:12` fija
// `environment: 'node'` para toda la marca, así que el docblock de arriba es lo que
// hace que exista DOM en este archivo.
//
// Este archivo arranca con lo que demuestra que el arnés es load-bearing (paso 4 del
// plan) y crece con los escenarios de arrastre y aviso (pasos 5 a 7).
import { describe, it, expect, afterEach, vi } from 'vitest'
import { watch } from 'vue'

import { mountWizard, monthPriceRow } from './harness'

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

/**
 * Paso 5 del plan — `onSelect` arrastra antes de asignar.
 *
 * Cambiar de gama construye una instancia fresca de `useCategory`. Estos escenarios
 * son la evidencia de DOM de que lo elegido sobrevive al cambio.
 *
 * El orden importa y no se puede afirmar solo por el resultado final: el watcher de
 * derivación es `flush: 'sync'`, así que asignar `selectedCategory` antes de aplicar
 * los flags lo dispara con los defaults frescos. Eso deja el estado final correcto y
 * un `haveTotalInsurance = false` intermedio que el payload puede leer. Por eso hay
 * un espía, además de las aserciones de resumen.
 */
describe('arrastre de la selección al cambiar de gama (paso 5)', () => {
  it('SCEN-368B1-01: el Seguro Total sobrevive y el total pasa a ser el de la gama nueva', async () => {
    const { search, summaryRow, selectGama, wrapper } = await mountWizard({
      codes: ['C', 'F'],
      availability: {
        F: { totalAmount: 1_200_000, estimatedTotalAmount: 1_500_000, coverageTotalAmount: 240_000 },
      },
    })

    await selectGama('C')
    // Lo que hace `StepCoverage.choose(true)`: la instancia manda.
    search.selectedCategory!.withTotalCoverage = true
    await wrapper.vm.$nextTick()

    expect(summaryRow('Seguro')).toBe('Seguro Total')
    const totalGamaA = wrapper.get('[data-testid="wizard-total-a-pagar"]').text()

    await selectGama('F')

    expect(summaryRow('Seguro')).toBe('Seguro Total')
    const totalGamaB = wrapper.get('[data-testid="wizard-total-a-pagar"]').text()
    expect(totalGamaB).not.toBe(totalGamaA)
  })

  it('SCEN-368B1-01: haveTotalInsurance nunca pasa por false durante un arrastre que conserva Total', async () => {
    // La mitad de orden del escenario. Con la asignación primero el estado final es
    // idéntico, así que solo el espía distingue las dos implementaciones.
    const { search, form, selectGama, wrapper } = await mountWizard({ codes: ['C', 'F'] })

    await selectGama('C')
    search.selectedCategory!.withTotalCoverage = true
    await wrapper.vm.$nextTick()
    expect(form.haveTotalInsurance).toBe(true)

    const observed: boolean[] = []
    const stop = watch(() => form.haveTotalInsurance, (v) => observed.push(v), { flush: 'sync' })

    await selectGama('F')
    stop()

    expect(observed, 'el watcher sync vio los defaults frescos antes que los arrastrados').not.toContain(false)
    expect(form.haveTotalInsurance).toBe(true)
  })

  it('SCEN-368B1-04: los adicionales sobreviven al cambio de gama', async () => {
    const { search, summaryRow, selectGama, wrapper } = await mountWizard({ codes: ['C', 'F'] })

    await selectGama('C')
    search.selectedCategory!.withExtraDriver = true
    search.selectedCategory!.withWash = true
    await wrapper.vm.$nextTick()
    expect(summaryRow('Adicionales')).toBe('Conductor · Lavado')

    await selectGama('F')

    expect(summaryRow('Adicionales')).toBe('Conductor · Lavado')
  })

  it('SCEN-368B1-05: el re-tap de la misma gama no construye instancia nueva', async () => {
    // Mitad de estado del escenario; la del banner llega en el paso 6.
    const { search, selectGama, wrapper } = await mountWizard({ codes: ['C', 'F'] })

    await selectGama('C')
    search.selectedCategory!.withTotalCoverage = true
    await wrapper.vm.$nextTick()
    const instancia = search.selectedCategory

    await selectGama('C')

    expect(search.selectedCategory).toBe(instancia)
    expect(search.selectedCategory!.withTotalCoverage).toBe(true)
  })

  it('SCEN-368B1-03: el plan de kilometraje se corrige sin montar StepCoverage', async () => {
    // La gama F solo vende 1.000 km. El salto por el stepper a "Datos" se salta el
    // Paso 3, que es donde vive hoy el único guardián de `withMileage`.
    const harness = await mountWizard({
      monthly: true,
      codes: ['C', 'F'],
      admin: { F: { month_prices: [monthPriceRow({ '2k_kms': 0 })] } },
    })
    const { search, summaryRow, selectGama, clickContinue, goToStep, currentStep, wrapper } = harness

    await selectGama('C')
    search.selectedCategory!.withMileage = '2k_kms'
    await wrapper.vm.$nextTick()
    expect(summaryRow('Kilometraje')).toBe('2.000 km')

    // Llegar de verdad al Paso 5 para que `maxReachedStep` valga 5.
    await clickContinue()
    await clickContinue()
    await clickContinue()
    expect(currentStep()).toBe('datos')

    await goToStep(2)
    await selectGama('F')
    await goToStep(5)

    expect(currentStep()).toBe('datos')
    expect(summaryRow('Kilometraje')).toBe('1.000 km')
    expect(wrapper.get('[data-testid="wizard-total-a-pagar"]').text()).not.toContain('—')
  })

  it('refuerza SCEN-368B1-03: corregir al plan que la gama SÍ vende, no al default', async () => {
    // La aserción literal del escenario no discrimina: la gama B vende 1.000 km y el
    // default de una instancia recién construida ya es "1k_kms", así que pasa aunque
    // no se arrastre nada (verificado — pasaba antes de escribir `carrySelection`).
    // Aquí la gama B vende SOLO 2.000 km: sin corrección el resumen diría "1.000 km"
    // y el total sería "$ 0", porque el plan de 1.000 no tiene precio.
    const { search, summaryRow, selectGama, wrapper } = await mountWizard({
      monthly: true,
      codes: ['C', 'F'],
      admin: { F: { month_prices: [monthPriceRow({ '1k_kms': 0 })] } },
    })

    await selectGama('C')
    search.selectedCategory!.withMileage = '1k_kms'
    await wrapper.vm.$nextTick()

    await selectGama('F')

    expect(summaryRow('Kilometraje')).toBe('2.000 km')
    expect(wrapper.get('[data-testid="wizard-total-a-pagar"]').text()).not.toContain('$ 0')
  })

  it('SCEN-368B1-12: la gama más allá del horizonte no se puede elegir, así que no hay precio que fabricar', async () => {
    // NO es el "When" literal del escenario, y esto es deliberado.
    //
    // El escenario dice "el usuario elige la gama B" con la fecha más allá del
    // horizonte. Ejecutándolo se ve que ese paso NO existe: la card de esa gama
    // renderiza la rama de `isMonthlyPriceUnavailable` (#313), sin CTA "Elegir", y
    // el clic sobre la card está gateado por ese mismo flag
    // (`WizardVehicleCard.vue:16`). La garantía que el escenario pide —ningún "$ 0",
    // nada que cotizar— la da una capa ANTES del arrastre.
    //
    // La gama sí aparece en resultados: `categoryOffersMonthly` cae a su regla 2
    // cuando ninguna fila activa cubre la fecha, así que la búsqueda mensual la
    // incluye y es el fail-closed quien la bloquea. La fila la construye el
    // useCategory REAL; con un stub esto mediría la forma del doble.
    const { search, selectGama, openSegment, wrapper } = await mountWizard({
      monthly: true,
      codes: ['C', 'F'],
      pickupDate: '2026-07-10',
      admin: { F: { month_prices: [monthPriceRow({ end_date: '2026-06-30' })] } },
    })

    await selectGama('C')
    search.selectedCategory!.withTotalCoverage = true
    search.selectedCategory!.withMileage = '2k_kms'
    await wrapper.vm.$nextTick()

    await openSegment('Sedanes')

    expect(wrapper.find('[data-testid="wizard-vehicle-F-test"]').exists(),
      'la gama sí se lista: la búsqueda mensual la incluye').toBe(true)
    expect(wrapper.find('[data-testid="wizard-vehicle-unavailable-test"]').exists(),
      'la card la marca como sin tarifa para la fecha').toBe(true)
    expect(wrapper.find('[data-testid="wizard-select-F-test"]').exists(),
      'no hay CTA "Elegir": el arrastre hacia esa gama es inalcanzable').toBe(false)
    // Sobre el texto VISIBLE, no sobre el HTML: `WizardVehicleCard.vue:41-43` tiene
    // un comentario que menciona "$ 0" y Vue lo conserva en el render, así que la
    // misma aserción contra `html()` falla midiendo un comentario del código fuente.
    expect(wrapper.text()).not.toContain('$ 0')

    // Y la selección previa sigue intacta, sin banner de pérdida.
    expect(search.selectedCategory!.categoryCode).toBe('C')
  })
})
