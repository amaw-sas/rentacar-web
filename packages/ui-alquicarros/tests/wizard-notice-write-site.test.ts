/**
 * Issue #368 B1 — dónde NO puede vivir la escritura del aviso del wizard.
 *
 * Los tests de montaje (`app/components/wizard/__tests__/ReservationWizard.mount.test.ts`)
 * cubren el comportamiento: qué se escribe, cuándo, y que no haya borrado. Lo que no
 * pueden cubrir es un invariante de ubicación, y hay una razón concreta: el arnés
 * stubea `useSearchByQueryParams`, así que si alguien moviera la escritura a ese
 * driver, el driver no correría, no se escribiría nada y los tests de "sin transición
 * de pending no pasa nada" seguirían verdes. Degenerarían en una tautología sobre un
 * watcher que no disparó.
 *
 * Un invariante de "esto no va aquí" es de las pocas cosas que una aserción
 * estructural hace mejor que un mount.
 *
 * Por qué importa la ubicación: enganchar la escritura a `useSearchByQueryParams`
 * parece equivalente y no lo es. Solo cubriría la superficie de query (`/reservas?…`),
 * porque las rutas por path y las de ciudad hidratan por `useSearchByRouteParams`, que
 * vive en `packages/logic` y es compartido por las tres marcas. El aviso es
 * brand-local de alquicarros, así que no puede vivir ahí.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf-8')

const shell = read('../app/components/wizard/ReservationWizard.vue')
const stepVehicle = read('../app/components/wizard/steps/StepVehicle.vue')
const queryDriver = read('../app/composables/useSearchByQueryParams.ts')
const routeDriver = read('../../logic/src/composables/useSearchByRouteParams.ts')

describe('#368 B1 — la escritura del aviso vive en el shell, no en los drivers de búsqueda', () => {
  it('el shell escribe la ranura dentro del watcher de `pending`', () => {
    // El bloque del watcher, no el archivo entero: la escritura tiene que compartir
    // transición con el reset de la selección, que es la invariante que sostiene el
    // modelo sin borrado.
    const watcher = shell.match(/watch\(pending,\s*\(isPending, wasPending\)[\s\S]*?^\}\)/m)?.[0] ?? ''

    expect(watcher, 'no se encontró el watcher de reset').not.toBe('')
    expect(watcher).toMatch(/selectedCategory\.value = null/)
    expect(watcher).toMatch(/setNotice\(/)
  })

  it('el Paso 2 escribe la ranura al elegir vehículo', () => {
    expect(stepVehicle).toMatch(/setNotice\(/)
  })

  it('NINGÚN driver de búsqueda escribe el aviso', () => {
    // `useSearchByRouteParams` además es de packages/logic: meter ahí un aviso
    // brand-local lo llevaría a las otras dos marcas.
    expect(queryDriver).not.toMatch(/setNotice|useWizardNotice/)
    expect(routeDriver).not.toMatch(/setNotice|useWizardNotice/)
  })

  it('no hay lógica de borrado colgada de `currentStep` ni de `next`', () => {
    // Las dos reglas envenenadas: un watcher sobre currentStep borra la nota antes de
    // que el Paso 2 la pinte (la red de seguridad llama goTo justo después del reset),
    // y dos de los cuatro invocadores de `wizard.next()` son el handshake de búsqueda.
    expect(shell).not.toMatch(/setNotice\(null\)[\s\S]{0,40}currentStep/)
    const nextBodies = shell.match(/function onNext[\s\S]*?^\}/m)?.[0] ?? ''
    expect(nextBodies).not.toMatch(/setNotice/)
  })
})
