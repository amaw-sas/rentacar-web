// Esqueleto del buscador: se renderiza en SSR como #fallback de <ClientOnly> y
// el cliente lo hidrata tal cual, así que su marcado debe ser idéntico en ambos
// lados.
//
// Lo que se rompió en producción (/reservas, 28-jul): UForm y UFormField piden
// su id a `useId()` de Vue, cuyo contador se bifurca en cada frontera asíncrona
// por encima (`markAsyncBoundary`: ids = [ids[0] + ids[2]++ + '-', 0, 0]).
// <Icon> (NuxtIconCss) ES una frontera asíncrona en el servidor pero NO en el
// bundle cliente de producción, así que el icono del header consumía una
// bifurcación solo en SSR y los ids del esqueleto salían corridos: servidor
// `v-0-1-*` / `v-0-2-*`, cliente `v-0-0-*` / `v-0-1-*` → 14 avisos de hidratación
// y "Hydration completed but contains mismatches".
//
// La invariante que se fija aquí no son los ids literales (serían frágiles) sino
// la propiedad observable: el marcado del esqueleto NO puede depender del
// contador de useId. Se renderiza el componente real como componente asíncrono
// —igual que lo montan reservas/index.vue y city/Hero.vue— precedido por
// distinto número de fronteras asíncronas, y se exige HTML byte a byte igual.
import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, defineAsyncComponent, defineComponent, h, ref, useId } from 'vue'
import { renderToString } from 'vue/server-renderer'

// `ref` llega por auto-import de Nuxt; fuera del runtime de Nuxt hay que darlo.
vi.stubGlobal('ref', ref)

import PlaceholdersSearcher from '../Searcher.vue'

// Dobles fieles de los componentes de @nuxt/ui 4.2.1 que pedían id: Form.vue usa
// `props.id ?? useId()` y FormField.vue `ref(useId())`. Si el esqueleto vuelve a
// usarlos, este test se pone rojo otra vez.
const UForm = defineComponent({
  props: { id: { type: String, required: false } },
  setup(props, { slots }) {
    const id = props.id ?? useId()
    return () => h('form', { id }, slots.default?.())
  },
})

const UFormField = defineComponent({
  props: { label: { type: String, required: false } },
  setup(props, { slots }) {
    const id = useId()
    return () => h('div', [h('label', { for: id }, props.label), slots.default?.()])
  },
})

const UProgress = defineComponent({ setup: () => () => h('div', { class: 'progress' }) })
const UButton = defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) })

// Lo mismo que NuxtIconCss durante el SSR: un componente con setup asíncrono.
// Cada uno bifurca el contador de ids para todo lo que se cree después.
const AsyncBoundary = defineComponent({
  async setup() {
    return () => h('i')
  },
})

/**
 * Renderiza el esqueleto igual que la app: como componente asíncrono (por eso es
 * él mismo una frontera y hereda el prefijo del padre), precedido por
 * `boundariesBefore` fronteras asíncronas. Devuelve solo el marcado del
 * esqueleto — desde su <form> — para no comparar las fronteras de prueba.
 */
async function renderSkeleton(boundariesBefore: number): Promise<string> {
  const AsyncSkeleton = defineAsyncComponent(async () => PlaceholdersSearcher)
  const app = createSSRApp({
    render: () =>
      h('div', [
        ...Array.from({ length: boundariesBefore }, (_, i) => h(AsyncBoundary, { key: `b${i}` })),
        h(AsyncSkeleton),
      ]),
  })
  app.component('UForm', UForm)
  app.component('UFormField', UFormField)
  app.component('UProgress', UProgress)
  app.component('UButton', UButton)

  const html = await renderToString(app)
  const start = html.indexOf('<form')
  expect(start).toBeGreaterThan(-1)
  return html.slice(start)
}

describe('Placeholders/Searcher — marcado estable entre SSR e hidratación', () => {
  it('renderiza el mismo HTML aunque cambie el número de fronteras asíncronas previas', async () => {
    const sinIcono = await renderSkeleton(0)
    const conIcono = await renderSkeleton(1)
    const conDosIconos = await renderSkeleton(2)

    expect(conIcono).toBe(sinIcono)
    expect(conDosIconos).toBe(sinIcono)
  })

  it('no emite ningún id autogenerado por useId', async () => {
    const html = await renderSkeleton(1)

    expect(html).not.toMatch(/\bid="v-[\d-]+"/)
    expect(html).not.toMatch(/\bfor="v-[\d-]+"/)
  })

  it('ninguna etiqueta apunta con `for` a un control que el esqueleto no tiene', async () => {
    const html = await renderSkeleton(0)

    expect(html).toContain('Lugar de recogida')
    expect(html).not.toMatch(/<label[^>]*\sfor=/)
  })
})
