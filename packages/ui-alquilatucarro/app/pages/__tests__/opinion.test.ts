// @vitest-environment happy-dom
/**
 * /opinion — la página de calificación posterior al alquiler.
 * Contrato: docs/specs/2026-07-29-alquilame-opinion-design.md — el mismo para
 * las dos marcas. Esta suite es el puerto de la de ui-alquilame; si una cambia,
 * la otra también.
 *
 *   - SCEN-1: recién cargada hay 5 estrellas huecas, sin formulario, y la ficha
 *     de Google NO está en el DOM (verla antes de calificar delata el filtro).
 *   - SCEN-2: 4★ agradece y a los 800 ms se va a la ficha de Google.
 *   - SCEN-3: 2★ bloquea las estrellas, abre el formulario y NO navega.
 *   - SCEN-4: enviar ese formulario postea a /api/contact con type 'resenas' y
 *     la calificación como `estrellas`.
 *   - SCEN-6: sin mensaje hay error inline y CERO llamadas a la API.
 *   - SCEN-7: el mismo recorrido por teclado dispara la misma rama que el clic.
 *   - SCEN-8: la página se marca noindex y queda fuera del sitemap.
 *
 * Montaje hermético (sin Nuxt): los auto-imports se exponen como globales y
 * `PublicContactForm`/`StarRating` se registran REALES — SCEN-4 y SCEN-6 son
 * escenarios del formulario, así que stubearlo sería probar el stub.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed, reactive, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Opinion from '../opinion.vue'
import StarRating from '~/components/StarRating.vue'
import PublicContactForm from '~/components/PublicContactForm.vue'
import { OPINION_CONSENT_TEXT } from '../../utils/policy'

// Ficha de alquilatucarro con el cuadro de reseña abierto (`!12e1`). alquilame
// usa la forma corta g.page/r/…; esta ficha no tiene ese alias.
const GBP_URL
  = 'https://www.google.com/maps/place//data=!4m3!3m2!1s0xa2258f5934dd7fc3:0x61229dafa110309c!12e1'
/**
 * Centinela de «la ficha no está en el DOM». Tiene que ser un trozo del enlace
 * que NINGÚN otro texto de la página contenga: con la forma larga de Maps no
 * sirve buscar 'google', que aparece en la copia («te llevamos a Google»).
 */
const GBP_SENTINEL = 'google.com/maps'

let post: ReturnType<typeof vi.fn>
let navigate: ReturnType<typeof vi.fn>
let head: ReturnType<typeof vi.fn>

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('nextTick', nextTick)
  vi.stubGlobal('onMounted', onMounted)
  vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
  vi.stubGlobal('definePageMeta', () => {})
  vi.stubGlobal('useSeoMeta', () => {})
  // La página lee `franchise.whatsapp` del appConfig (SCEN-11824); la marca se
  // deja correcta a propósito: si alguien hace que la página lea también la
  // marca, el stub dirá la verdad en vez de colar «Alquilame» en esta suite.
  vi.stubGlobal('useAppConfig', () => ({
    organization: { brand: 'Alquilatucarro', logo: '/images/brand/logo.svg' },
    // La página lee el WhatsApp de la marca para la salida de SCEN-11824.
    franchise: { whatsapp: 'https://wa.me/570000000000' },
  }))
})
afterAll(() => vi.unstubAllGlobals())

beforeEach(() => {
  document.body.innerHTML = ''
  post = vi.fn(async () => ({ ok: true }))
  navigate = vi.fn()
  head = vi.fn()
  vi.stubGlobal('$fetch', post)
  vi.stubGlobal('navigateTo', navigate)
  vi.stubGlobal('useHead', head)
})

// NuxtLink no existe fuera de Nuxt; se sustituye por el <a> que renderiza, que
// es lo que hay que poder afirmar (a dónde lleva y cómo se llama).
const NuxtLink = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

/**
 * Todo lo montado se desmonta al terminar cada caso.
 *
 * Sin esto, un caso que califica con 4-5★ y NO usa temporizadores falsos deja
 * vivo el `setTimeout` de la redirección. Cuando salta, ya corrió el
 * `afterAll` que hace `unstubAllGlobals`, así que `navigateTo` ya no existe y
 * vitest reporta un «Unhandled Error» — fuera de cualquier caso, con los 475
 * en verde. Fue exactamente lo que rompió CI en el PR #485: bajar la espera de
 * 800 ms a 300 movió la carrera y los temporizadores empezaron a saltar DENTRO
 * de la corrida en vez de después de que el proceso terminara.
 *
 * Desmontar dispara el `onBeforeUnmount` de la página, que es quien limpia los
 * dos temporizadores. O sea: esto no es solo higiene del test, ejercita el
 * camino de limpieza real del componente.
 */
const mounted: { unmount: () => void }[] = []

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
})

const factory = () => {
  const w = mount(Opinion, {
    attachTo: document.body,
    global: { components: { StarRating, PublicContactForm, NuxtLink } },
  })
  mounted.push(w)
  return w
}

type Wrapper = ReturnType<typeof factory>

// El parámetro de tipo es lo que da acceso a `.focus()`: sin él VTU devuelve
// `DOMWrapper<Element>` y `element.focus()` no existe para TypeScript.
const stars = (w: Wrapper) => w.findAll<HTMLButtonElement>('button[role="radio"]')
const form = (w: Wrapper) => w.find('form')
/** El acuse de recibo del formulario, no la región de la página. */
const formStatus = (w: Wrapper) => w.find('form [role="status"]')

/** Cuántas estrellas se ven doradas (el <svg> pinta ámbar sólo si lo están). */
const gold = (w: Wrapper) => w.findAll('svg').filter((s) => s.attributes('fill') === '#d97706').length

/** Rellena el formulario de queja. `omit` deja un campo obligatorio vacío. */
async function fillForm(w: Wrapper, omit?: string) {
  const values: Record<string, string> = {
    nombre: 'Ana Ramírez',
    email: 'ana@ejemplo.com',
    mensaje: 'El carro llegó sin gasolina y esperé 40 minutos.',
  }
  for (const [name, value] of Object.entries(values)) {
    if (name === omit) continue
    await w.find(`#f-${name}`).setValue(value)
  }
}

describe('SCEN-1 — la página recién cargada no delata el filtro', () => {
  it('muestra cinco estrellas huecas y ningún formulario', () => {
    const w = factory()
    expect(stars(w)).toHaveLength(5)
    expect(stars(w).every((s) => s.attributes('aria-checked') === 'false')).toBe(true)
    expect(form(w).exists()).toBe(false)
  })

  it('la ficha de Google no aparece en el DOM antes de calificar', () => {
    // Ojo con lo que esto NO dice: `GBP_URL` y el umbral viajan en claro dentro
    // del chunk JS de la página, así que quien mire el bundle ve el filtro. Lo
    // que se afirma aquí es sólo que la interfaz no lo enseña de entrada.
    expect(factory().html()).not.toContain(GBP_SENTINEL)
  })

  it('la región de avisos ya existe, vacía, antes de calificar', () => {
    // Un aria-live que se inserta con el texto ya dentro no lo anuncian ni NVDA
    // ni VoiceOver: la región tiene que preexistir al cambio.
    const region = factory().find('[role="status"]')
    expect(region.exists()).toBe(true)
    expect(region.text()).toBe('')
  })
})

describe('SCEN-2 — 4★ va a la ficha de Google sin mover la pantalla', () => {
  /**
   * Medido en producción el 2026-09-04: al tocar la 4ª estrella la sección
   * pasaba de 380 px a 541 px de alto. 161 px de salto por tres cosas que
   * aparecían a la vez — «Calificaste con 4 de 5», el párrafo «¡Gracias por
   * calificarnos! Redirigiendo…» y el enlace de salida.
   *
   * Y el texto mentía: «Gracias por calificarnos» le decía a la persona que
   * había terminado cuando la reseña todavía no existía. Al saltar a Google
   * después, el salto se leía como si el sitio hiciera algo por su cuenta.
   *
   * Ahora la única confirmación visible es la estrella pintándose.
   */
  /**
   * Texto que una persona VE. `sr-only` esconde por CSS y no por `display:none`,
   * así que su contenido sigue en el DOM (tiene que seguir, o el lector de
   * pantalla no lo anuncia) y `wrapper.text()` lo devuelve. Afirmar sobre
   * `text()` a secas mediría el DOM, no la pantalla.
   */
  function visible(w: ReturnType<typeof factory>): string {
    const root = w.element.cloneNode(true) as HTMLElement
    root.querySelectorAll('.sr-only').forEach((n) => n.remove())
    return (root.textContent ?? '').replace(/\s+/g, ' ').trim()
  }

  it('no imprime NADA visible: la pantalla se queda quieta', async () => {
    const w = factory()
    const antes = visible(w)
    await stars(w)[3]!.trigger('click')

    expect(gold(w)).toBe(4)
    expect(visible(w)).toBe(antes)
    expect(form(w).exists()).toBe(false)
  })

  it('pero el lector de pantalla sí se entera, en una región invisible', async () => {
    // Quien no ve la estrella pintarse necesita saber que va camino a Google:
    // sin esto el cambio de página la deja sin explicación.
    const w = factory()
    await stars(w)[3]!.trigger('click')

    const region = w.find('[role="status"]')
    expect(region.text()).toMatch(/Google/i)
    // Invisible para todos los demás: no ocupa espacio ni empuja nada.
    expect(region.classes()).toContain('sr-only')
    // Y no promete que ya terminó, porque no ha terminado.
    expect(region.text()).not.toMatch(/gracias/i)
  })

  it('redirige a los 300 ms, no a los 800', async () => {
    vi.useFakeTimers()
    try {
      const w = factory()
      await stars(w)[3]!.trigger('click')

      // Lo justo para ver la estrella pintarse. 800 ms era casi un segundo
      // mirando una pantalla en la que no pasaba nada.
      vi.advanceTimersByTime(299)
      expect(navigate).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      // `replace`: sin esto, volver con Atrás restaura /opinion desde bfcache
      // con el estado congelado y las estrellas muertas.
      expect(navigate).toHaveBeenCalledWith(GBP_URL, { external: true, replace: true })
    } finally {
      vi.useRealTimers()
    }
  })

  it('5★ toma la misma rama', async () => {
    vi.useFakeTimers()
    try {
      const w = factory()
      await stars(w)[4]!.trigger('click')
      vi.advanceTimersByTime(300)
      expect(navigate).toHaveBeenCalledWith(GBP_URL, { external: true, replace: true })
    } finally {
      vi.useRealTimers()
    }
  })

  it('la ficha de Google NO está en el DOM mientras la redirección va bien', async () => {
    // El enlace de salida era la tercera cosa que empujaba la página. En el
    // camino normal nadie tiene que verlo: la redirección ya se lo lleva.
    vi.useFakeTimers()
    try {
      const w = factory()
      await stars(w)[4]!.trigger('click')
      vi.advanceTimersByTime(300)
      await nextTick()
      expect(w.findAll('a').some((a) => a.attributes('href') === GBP_URL)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('si a los 2 s seguimos aquí, la redirección falló y aparece la salida', async () => {
    // Pestaña en segundo plano, un bloqueador: si el salto no ocurre, la persona
    // se queda con las estrellas pintadas y sin ninguna forma de continuar.
    vi.useFakeTimers()
    try {
      const w = factory()
      await stars(w)[4]!.trigger('click')
      vi.advanceTimersByTime(2000)
      await nextTick()

      const escape = w.findAll('a').find((a) => a.attributes('href') === GBP_URL)!
      expect(escape).toBeDefined()
      // "Si no pasa nada, entra aquí" no es un nombre accesible: en la lista de
      // enlaces del lector de pantalla no se sabe que es la ficha de Google.
      expect(escape.text()).toMatch(/Google/)
      // `rel="noopener"` sin `target` no protege de nada y su `noreferrer` le
      // quitaba a Google la atribución sólo por este camino.
      expect(escape.attributes('rel')).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('salir de la página antes de tiempo cancela la redirección', async () => {
    vi.useFakeTimers()
    try {
      const w = factory()
      await stars(w)[3]!.trigger('click')
      w.unmount()
      vi.advanceTimersByTime(5000)
      expect(navigate).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('volver con Atrás desde Google no deja la página congelada', async () => {
    // bfcache restaura el heap intacto: rating puesto y temporizador gastado.
    // Sin recargar, queda un «Redirigiendo…» permanente sin forma de calificar.
    const reload = vi.fn()
    const w = factory()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    })
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }))
    expect(reload).toHaveBeenCalled()

    // Y una restauración normal (sin bfcache) no recarga nada.
    reload.mockClear()
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false }))
    expect(reload).not.toHaveBeenCalled()
    w.unmount()
  })
})

describe('SCEN-3 — 1-3★ se queda en la página', () => {
  it('bloquea las estrellas, abre el formulario y no navega', async () => {
    vi.useFakeTimers()
    try {
      const w = factory()
      await stars(w)[1]!.trigger('click')

      expect(gold(w)).toBe(2)
      expect(stars(w).filter((s) => s.attributes('aria-checked') === 'true')).toHaveLength(1)
      expect(stars(w)[1]!.attributes('aria-checked')).toBe('true')
      // Congelado con aria-disabled, no con `disabled`: el nativo desenfoca el
      // botón enfocado y tira el foco a <body>.
      expect(stars(w).every((s) => s.attributes('aria-disabled') === 'true')).toBe(true)
      expect(stars(w).every((s) => s.attributes('disabled') === undefined)).toBe(true)
      expect(form(w).exists()).toBe(true)
      expect(w.html()).not.toContain(GBP_SENTINEL)

      // Ninguna espera escondida que acabe llevándolo a Google igual.
      vi.advanceTimersByTime(5000)
      expect(navigate).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('el foco se va al formulario recién aparecido', async () => {
    // En móvil el bloque nace bajo el pliegue: sin mover el foco, la persona ve
    // las estrellas doradas, cree que terminó y cierra. Enfocar el encabezado
    // lo anuncia y lo trae a la vista de una vez.
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await nextTick()

    const heading = w.find('h2')
    expect(heading.attributes('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(heading.element)
  })

  it('la página enlaza la política de privacidad donde pide datos', async () => {
    // Nombre, correo, teléfono, número de reserva y texto libre: Ley 1581/2012.
    const w = factory()
    await stars(w)[1]!.trigger('click')
    expect(w.findAll('a').some((a) => a.attributes('href') === '/politica-privacidad')).toBe(true)
  })

  it('re-calificar es imposible: las estrellas ya no responden', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await stars(w)[4]!.trigger('click')

    expect(stars(w)[1]!.attributes('aria-checked')).toBe('true')
    expect(stars(w)[4]!.attributes('aria-checked')).toBe('false')
    expect(gold(w)).toBe(2)
    expect(form(w).exists()).toBe(true)
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe('SCEN-4 — el envío lleva la calificación', () => {
  it('postea a /api/contact con type resenas y estrellas "2 de 5"', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await fillForm(w)
    await form(w).trigger('submit')
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1))

    const [url, options] = post.mock.calls[0]!
    expect(url).toBe('/api/contact')
    expect(options.method).toBe('POST')
    expect(options.body).toMatchObject({
      type: 'resenas',
      estrellas: '2 de 5',
      nombre: 'Ana Ramírez',
      email: 'ana@ejemplo.com',
      mensaje: 'El carro llegó sin gasolina y esperé 40 minutos.',
    })
  })

  it('la calificación enviada es la que se eligió, no una fija', async () => {
    const w = factory()
    await stars(w)[2]!.trigger('click')
    await fillForm(w)
    await form(w).trigger('submit')
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1))

    expect(post.mock.calls[0]![1].body.estrellas).toBe('3 de 5')
  })

  it('confirma el envío a quien escribió', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await fillForm(w)
    await form(w).trigger('submit')
    await vi.waitFor(() => expect(formStatus(w).text()).toContain('Gracias'))
  })

  it('volver a pulsar Enviar no borra el acuse de recibo', async () => {
    // Los campos quedan vacíos tras enviar: un segundo envío los validaba y
    // pintaba tres errores rojos encima del "gracias", así que quien SÍ había
    // enviado su queja concluía que no se había enviado.
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await fillForm(w)
    await form(w).trigger('submit')
    await vi.waitFor(() => expect(formStatus(w).text()).toContain('Gracias'))

    await form(w).trigger('submit')
    expect(post).toHaveBeenCalledTimes(1)
    expect(formStatus(w).text()).toContain('Gracias')
    expect(w.find('#e-mensaje').exists()).toBe(false)
    expect(w.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('pero escribir de nuevo vuelve a habilitar el envío', async () => {
    // El bloqueo es contra el doble clic, no un candado: quien tenga algo más
    // que contar tiene que poder mandarlo sin recargar.
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await fillForm(w)
    await form(w).trigger('submit')
    await vi.waitFor(() => expect(formStatus(w).text()).toContain('Gracias'))

    await fillForm(w)
    expect(w.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    await form(w).trigger('submit')
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(2))
  })
})

describe('SCEN-6 — sin mensaje no sale nada a la red', () => {
  it('marca el campo y no llama a la API', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await fillForm(w, 'mensaje')
    await form(w).trigger('submit')

    expect(post).not.toHaveBeenCalled()
    expect(w.find('#e-mensaje').exists()).toBe(true)
    expect(w.find('#f-mensaje').attributes('aria-invalid')).toBe('true')
  })

  it('lo anuncia y lleva el foco al campo, en vez de fallar en silencio', async () => {
    // Los mensajes inline son párrafos estáticos: sin región live ni foco, quien
    // usa lector de pantalla sólo percibe que el botón no hace nada.
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await fillForm(w, 'mensaje')
    await form(w).trigger('submit')

    expect(w.find('form [role="alert"]').text()).toContain('Revisa los campos marcados')
    expect(document.activeElement).toBe(w.find('#f-mensaje').element)
  })
})

describe('SCEN-7 — por teclado se llega a la misma rama que con el clic', () => {
  it('flecha derecha ×2 + Enter califica con 3 y abre el formulario', async () => {
    const w = factory()
    stars(w)[0]!.element.focus()

    const press = async (key: string) => {
      const focused = stars(w).find((s) => s.element === document.activeElement)
      await focused!.trigger('keydown', { key })
    }
    await press('ArrowRight')
    await press('ArrowRight')
    // Pasar por la 2ª estrella no puede haber abierto ya el formulario, ni
    // haber anunciado nada como marcado.
    expect(form(w).exists()).toBe(false)
    expect(stars(w).filter((s) => s.attributes('aria-checked') === 'true')).toHaveLength(0)

    await press('Enter')
    expect(form(w).exists()).toBe(true)
    expect(stars(w)[2]!.attributes('aria-checked')).toBe('true')

    await fillForm(w)
    await form(w).trigger('submit')
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1))
    expect(post.mock.calls[0]![1].body.estrellas).toBe('3 de 5')
  })

  it('por teclado también se llega a la rama de Google', async () => {
    vi.useFakeTimers()
    try {
      const w = factory()
      stars(w)[3]!.element.focus()
      await stars(w)[3]!.trigger('keydown', { key: 'Enter' })
      vi.advanceTimersByTime(800)
      expect(navigate).toHaveBeenCalledWith(GBP_URL, { external: true, replace: true })
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('SCEN-8 — fuera del índice de Google', () => {
  const ROOT = join(__dirname, '..', '..', '..') // → packages/ui-alquilatucarro
  const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf-8')

  it('la página pide noindex, nofollow al montarse', () => {
    // Se afirma sobre la LLAMADA, no sobre el texto del archivo: la cadena
    // podría quedar en una rama muerta o en un comentario y el archivo seguiría
    // conteniéndola.
    factory()
    expect(head).toHaveBeenCalled()
    const metas = head.mock.calls.flatMap(([arg]) => arg?.meta ?? [])
    expect(metas).toContainEqual({ name: 'robots', content: 'noindex, nofollow' })
  })

  it('nuxt.config la excluye del sitemap', () => {
    const config = read('nuxt.config.ts')
    const sitemapBlock = config.slice(config.indexOf('sitemap: {'))
    expect(sitemapBlock).toContain("'/opinion'")
  })

  it('la cabecera HTTP dice lo mismo que el <meta>', () => {
    // Sin el x-robots-tag, un crawler que solo mire cabeceras la trataría como
    // indexable — la misma incoherencia que ya se cerró para /chat y /pendiente.
    // Es una comprobación de TEXTO: nada aquí genera el sitemap ni sirve la
    // ruta, así que un patrón que radix3 no resuelva pasaría igual (ver el
    // precedente de /lab-** en los comentarios de nuxt.config.ts).
    const config = read('nuxt.config.ts')
    expect(config).toMatch(
      /'\/opinion':\s*\{\s*robots:\s*'noindex, nofollow',\s*headers:\s*\{\s*'x-robots-tag':\s*'noindex, nofollow'/,
    )
  })
})

describe('SCEN-10 — el tope de 2.000 no se descubre al enviar', () => {
  /**
   * El servidor rechaza a partir de 2.001 (contact-forms.ts, MAX_MESSAGE_LEN).
   * Que la persona se entere DESPUÉS de escribir y pulsar Enviar es la peor
   * versión posible: ya está molesta, y encima pierde el texto de vista.
   *
   * El `maxlength` del navegador es comodidad, no autoridad — el servidor valida
   * igual, porque un `curl` no ve ningún atributo.
   */
  async function abrirFormulario() {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    return w
  }

  it('el navegador no deja pasar de 2.000 en el mensaje', async () => {
    const w = await abrirFormulario()
    expect(w.find('#f-mensaje').attributes('maxlength')).toBe('2000')
  })

  it('los demás campos también tienen tope, con los números del servidor', async () => {
    const w = await abrirFormulario()
    expect(w.find('#f-nombre').attributes('maxlength')).toBe('120')
    expect(w.find('#f-email').attributes('maxlength')).toBe('254')
    expect(w.find('#f-telefono').attributes('maxlength')).toBe('40')
  })

  it('callado mientras sobra espacio: nadie necesita un contador en 20 palabras', async () => {
    const w = await abrirFormulario()
    await w.find('#f-mensaje').setValue('x'.repeat(1000))
    expect(w.text()).not.toMatch(/2000|2\.000/)
  })

  it('pero avisa al acercarse, con el número exacto', async () => {
    const w = await abrirFormulario()
    await w.find('#f-mensaje').setValue('x'.repeat(1501))
    expect(w.text()).toMatch(/1501\s*\/\s*2000/)
  })

  it('el aviso lo anuncia el lector de pantalla sin interrumpir al escribir', async () => {
    // `polite` y no `assertive`: un contador que corta la lectura en cada tecla
    // es peor que no tenerlo.
    const w = await abrirFormulario()
    await w.find('#f-mensaje').setValue('x'.repeat(1900))
    const contador = w.find('[data-test="contador-mensaje"]')
    expect(contador.exists()).toBe(true)
    expect(contador.attributes('aria-live')).toBe('polite')
  })

  it('si el servidor rechaza por largo, marca el campo culpable', async () => {
    // El servidor manda `tooLong` igual que manda `missing`. Sin esto, la
    // persona lee «hay campos demasiado largos» y no sabe cuál.
    const w = await abrirFormulario()
    post.mockRejectedValueOnce({
      data: {
        statusMessage: 'Hay campos demasiado largos. El mensaje admite hasta 2000 caracteres.',
        data: { tooLong: ['mensaje'] },
      },
    })
    await w.find('#f-nombre').setValue('Ana')
    await w.find('#f-email').setValue('ana@ejemplo.com')
    await w.find('#f-mensaje').setValue('texto')
    await form(w).trigger('submit')
    await nextTick()

    expect(w.find('#f-mensaje').attributes('aria-invalid')).toBe('true')
    expect(w.text()).toMatch(/demasiado largo/i)
  })

  it('el aviso de "espera un momento" del servidor se muestra tal cual', async () => {
    // Es el 429 del tope por hora. El texto lo escribe el servidor en español;
    // el formulario no debe taparlo con su mensaje genérico.
    const w = await abrirFormulario()
    post.mockRejectedValueOnce({
      data: { statusMessage: 'Recibimos varios mensajes tuyos hace poco. Espera un momento y vuelve a intentarlo.' },
    })
    await w.find('#f-nombre').setValue('Ana')
    await w.find('#f-email').setValue('ana@ejemplo.com')
    await w.find('#f-mensaje').setValue('texto')
    await form(w).trigger('submit')
    await nextTick()

    expect(w.text()).toContain('Espera un momento')
  })
})

/**
 * Holdout: rentacar-dashboard docs/specs/2026-10-19-calificaciones-web/scenarios/
 * calificaciones-web.scenarios.md — SCEN-11818.
 *
 * El handler guarda `OPINION_CONSENT_TEXT` en el tablero como la frase que la
 * persona aceptó. Eso solo prueba algo si es, letra por letra, lo que la página
 * le mostró bajo el formulario.
 */
describe('SCEN-11818 — el consentimiento guardado es la frase que se leyó', () => {
  /** El párrafo bajo el formulario: el que enlaza la política de privacidad. */
  const consentParagraph = (w: Wrapper) =>
    w.findAll('p').find((p) => p.find('a[href="/politica-privacidad"]').exists())

  /** Espacios normalizados y el hueco antes del punto final cerrado. */
  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim().replace(/\s+\.$/, '.')

  it('el texto renderizado es igual a OPINION_CONSENT_TEXT', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    const p = consentParagraph(w)
    expect(p).toBeDefined()
    expect(normalize(p!.element.textContent ?? '')).toBe(OPINION_CONSENT_TEXT)
  })

  it('sin hueco que cerrar: el enlace y el punto van pegados en el marcado', async () => {
    // Si alguien vuelve a partir el enlace en líneas, el texto pasa a «privacidad .»
    // y esta aserción, más estricta que la normalizada, lo dice antes que nadie.
    const w = factory()
    await stars(w)[1]!.trigger('click')
    const raw = consentParagraph(w)!.element.textContent!.replace(/\s+/g, ' ').trim()
    expect(raw).toBe(OPINION_CONSENT_TEXT)
  })

  it('«política de privacidad» aparece una sola vez y es el enlace', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    const p = consentParagraph(w)!
    const text = normalize(p.element.textContent ?? '')
    expect(text.match(/política de privacidad/g)).toHaveLength(1)
    expect(p.find('a').text().trim()).toBe('política de privacidad')
  })
})

/**
 * Holdout: SCEN-11804 (b, c, d), mitad de la página. Si el tablero no radica, el
 * servidor responde 429 o 502 con su propio texto; la persona tiene que verlo y no
 * perder lo que escribió, porque el reintento es lo único que le queda.
 */
describe('SCEN-11804 — si el tablero falla, el formulario conserva lo escrito', () => {
  it.each([
    ['502', 'No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.'],
    ['429', 'Recibimos varios mensajes tuyos hace poco. Espera un momento y vuelve a intentarlo.'],
  ])('con %s muestra el texto del servidor y deja los campos llenos', async (_status, statusMessage) => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await nextTick()
    post.mockRejectedValueOnce({ data: { statusMessage } })
    await fillForm(w)
    await form(w).trigger('submit')
    await nextTick()
    await nextTick()

    expect(post).toHaveBeenCalledTimes(1)
    expect(w.text()).toContain(statusMessage)
    expect((w.find('#f-nombre').element as HTMLInputElement).value).toBe('Ana Ramírez')
    expect((w.find('#f-email').element as HTMLInputElement).value).toBe('ana@ejemplo.com')
    expect((w.find('#f-mensaje').element as HTMLTextAreaElement).value).toBe(
      'El carro llegó sin gasolina y esperé 40 minutos.',
    )
  })
})

/**
 * Holdout: rentacar-dashboard docs/specs/2026-10-19-calificaciones-web/scenarios/
 * opinion-salida-whatsapp.scenarios.md — SCEN-11824 y SCEN-11825.
 *
 * Si el envío falla por nuestra culpa (500/502), la persona tiene por dónde
 * escribirnos: «Si prefieres, escríbenos por WhatsApp», con el WhatsApp de ESTA
 * marca. El número se lee de app.config.ts como texto y no se copia aquí: si
 * alguien lo cambia allí, la prueba sigue diciendo la verdad.
 */
describe('SCEN-11824/11825 — la salida por WhatsApp cuando el envío falla por nuestra culpa', () => {
  const WA_LINE = 'Si prefieres, escríbenos por WhatsApp'
  const appConfigSrc = readFileSync(join(__dirname, '..', '..', 'app.config.ts'), 'utf8')
  const BRAND_WHATSAPP = appConfigSrc.match(/whatsapp:\s*["']([^"']+)["']/)![1]!

  beforeEach(() => {
    vi.stubGlobal('useAppConfig', () => ({
      organization: { brand: 'Marca', logo: '/images/brand/logo.svg' },
      franchise: { whatsapp: BRAND_WHATSAPP },
    }))
  })

  /** Lo que lanza $fetch (ofetch) ante una respuesta con error. */
  const fetchError = (status: number, statusMessage: string, data?: Record<string, unknown>) => ({
    statusCode: status,
    status,
    data: { statusCode: status, statusMessage, ...(data ? { data } : {}) },
  })

  async function enviarCon(outcome: 'ok' | ReturnType<typeof fetchError>) {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await nextTick()
    if (outcome !== 'ok') post.mockRejectedValueOnce(outcome)
    await fillForm(w)
    await form(w).trigger('submit')
    await nextTick()
    await nextTick()
    return w
  }

  const waLink = (w: Wrapper) => w.find('[data-test="salida-whatsapp"] a')

  it('el número de la marca se encontró en app.config.ts', () => {
    expect(BRAND_WHATSAPP).toMatch(/^https:\/\/wa\.me\/57\d{10}$/)
  })

  it.each([502, 500])(
    'SCEN-11824 — con %s aparece la línea, enlaza al WhatsApp de la marca en pestaña nueva y conserva lo escrito',
    async (status) => {
      const w = await enviarCon(
        fetchError(status, 'No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.'),
      )
      expect(w.find('form [role="alert"]').text()).toContain('No pudimos enviar tu mensaje')
      const line = w.find('[data-test="salida-whatsapp"]')
      expect(line.exists()).toBe(true)
      expect(line.text().replace(/\s+/g, ' ').trim()).toBe(WA_LINE)
      expect(waLink(w).text().trim()).toBe('WhatsApp')
      expect(waLink(w).attributes('href')).toBe(BRAND_WHATSAPP)
      expect(waLink(w).attributes('target')).toBe('_blank')
      expect(waLink(w).attributes('rel')).toContain('noopener')
      expect((w.find('#f-nombre').element as HTMLInputElement).value).toBe('Ana Ramírez')
      expect((w.find('#f-email').element as HTMLInputElement).value).toBe('ana@ejemplo.com')
      expect((w.find('#f-mensaje').element as HTMLTextAreaElement).value).toBe(
        'El carro llegó sin gasolina y esperé 40 minutos.',
      )
    },
  )

  it('SCEN-11825 (d) — antes de enviar no aparece', async () => {
    const w = factory()
    await stars(w)[1]!.trigger('click')
    await nextTick()
    await fillForm(w)
    expect(w.text()).not.toContain('Si prefieres')
    expect(w.find('[data-test="salida-whatsapp"]').exists()).toBe(false)
  })

  it('SCEN-11825 (a) — con 200 no aparece', async () => {
    const w = await enviarCon('ok')
    expect(formStatus(w).text()).toContain('Gracias por contarnos')
    expect(w.text()).not.toContain('Si prefieres')
  })

  it('SCEN-11825 (b) — con 400 por campos se ve solo el aviso de siempre', async () => {
    const w = await enviarCon(fetchError(400, 'Faltan campos obligatorios', { missing: ['mensaje'] }))
    expect(w.find('form [role="alert"]').text()).toContain('Revisa los campos marcados.')
    expect(w.text()).not.toContain('Si prefieres')
  })

  it('SCEN-11825 (c) — con 429 se ve solo el aviso de siempre', async () => {
    const msg = 'Recibimos varios mensajes tuyos hace poco. Espera un momento y vuelve a intentarlo.'
    const w = await enviarCon(fetchError(429, msg))
    expect(w.find('form [role="alert"]').text()).toContain(msg)
    expect(w.text()).not.toContain('Si prefieres')
  })

  it('un 502 seguido de un reintento con 429 retira la línea', async () => {
    // La línea habla del ÚLTIMO fallo: si el tope llega después, ya no aplica.
    const w = await enviarCon(fetchError(502, 'No pudimos enviar tu mensaje.'))
    expect(w.find('[data-test="salida-whatsapp"]').exists()).toBe(true)
    post.mockRejectedValueOnce(fetchError(429, 'Espera un momento.'))
    await form(w).trigger('submit')
    await nextTick()
    await nextTick()
    expect(w.find('form [role="alert"]').text()).toContain('Espera un momento.')
    expect(w.find('[data-test="salida-whatsapp"]').exists()).toBe(false)
  })
})
