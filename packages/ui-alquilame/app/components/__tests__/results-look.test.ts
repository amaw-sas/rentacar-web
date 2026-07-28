import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Reskin de la superficie de RESULTADOS (alquilame): el grid de categorías pasa
 * del degradado oscuro del layout al mismo gris de "Nuestra Flota" del home, y
 * las tarjetas heredan el marco blanco de esa sección.
 *
 * Los tests leen el fuente (mismo estilo que CategoryCard.a11y.test.ts): lo
 * observable aquí es qué tokens declara cada superficie, y el pareo con
 * home/Fleet.vue es el invariante — si la flota del home cambia de marco, estos
 * tests fallan y obligan a decidir, en vez de dejar las dos superficies
 * divergiendo en silencio.
 */
const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

const fleet = read('../home/Fleet.vue')
const categoryCss = read('../../assets/css/rentacar-main/category.css')
const baseCss = read('../../assets/css/rentacar-main/base.css')
const categoryCard = read('../CategoryCard.vue')
const categoryTags = read('../CategoryTags.vue')
const selectionSection = read('../CategorySelectionSection.vue')
const resultsSurface = read('../reservas/Results.vue')
const reservasHub = read('../../pages/reservas/index.vue')

/** El bloque `.categoria { ... }` (primera regla del archivo, hasta la 1ª línea vacía tras las @apply). */
const categoriaRoot = categoryCss.slice(0, categoryCss.indexOf('/* .agotado'))
/** Todo el interior de `.categoria { … }`, hasta el cierre de la regla anidada. */
const categoriaRoot0 = categoryCss.slice(0, categoryCss.indexOf('\n}\n'))

describe('SCEN-L01 — el fondo de los resultados es el gris de la flota del home', () => {
  it('home/Fleet.vue sigue siendo bg-surface-soft (fuente del token)', () => {
    expect(fleet).toMatch(/id="fleet"[^>]*class="[^"]*\bbg-surface-soft\b/)
  })

  it('la sección de resultados por path params usa ese mismo fondo', () => {
    expect(resultsSurface).toMatch(
      /id="seleccion-categorias"[\s\S]{0,160}class="[^"]*\bbg-surface-soft\b/,
    )
  })

  it('la sección de resultados del hub /reservas usa ese mismo fondo', () => {
    expect(reservasHub).toMatch(
      /id="seleccion-categorias"[\s\S]{0,160}class="[^"]*\bbg-surface-soft\b/,
    )
  })
})

describe('SCEN-L02 — las tarjetas llevan el marco de las tarjetas del home', () => {
  const frame = ['rounded-[22px]', 'border-[7px]', 'border-white', 'shadow-[0_8px_22px_rgba(17,17,34,0.055)]']

  it.each(frame)('home/Fleet.vue declara %s', (token) => {
    expect(fleet).toContain(token)
  })

  it.each(frame)('.categoria declara %s', (token) => {
    expect(categoriaRoot).toContain(token)
  })

  it('ya no queda el borde rojo translúcido ni el radio chico anteriores', () => {
    expect(categoriaRoot).not.toContain('border-red-600/12')
    expect(categoriaRoot).not.toMatch(/\brounded-lg\b/)
  })
})

describe('SCEN-L03 — sobre gris claro no queda texto blanco ni acento amarillo', () => {
  /**
   * Solo la parte que se pinta SOBRE el gris: banners, estados vacíos y de
   * error. El `<u-slideover>` es una capa aparte con fondo blanco propio y sus
   * botones sólidos sí llevan texto blanco legítimamente.
   */
  const sobreElGris = selectionSection.slice(0, selectionSection.indexOf('<u-slideover'))

  it('los estados sobre el gris no pintan texto blanco', () => {
    expect(sobreElGris).not.toMatch(/\btext-white\b/)
  })

  it('no fuerzan el contexto de texto a blanco', () => {
    expect(sobreElGris).not.toContain('--ctx-text-primary:#fff')
  })

  it('los enlaces de WhatsApp de los estados de error usan el acento de marca', () => {
    expect(sobreElGris).not.toMatch(/\btext-yellow-400\b/)
    expect(sobreElGris).toMatch(/\btext-brand-600\b/)
  })
})

describe('SCEN-L04 — el badge de descuento conserva el fondo verde, pero su texto se iguala al bloque', () => {
  const badge = categoryCss.slice(
    categoryCss.indexOf('.porcentaje-descuento'),
    categoryCss.indexOf('.precio-base-diario'),
  )

  it('el fondo sigue siendo verde lavado al 70% de transparencia', () => {
    expect(badge).toMatch(/bg-green-\d{3}\/30\b/)
    expect(badge).not.toContain('bg-red-600')
  })

  /**
   * Decisión 2026-07-24: dentro del desglose de la tarifa diaria todo se lee al
   * mismo tamaño, grosor y tono. El badge conserva SOLO el fondo verde como
   * realce del descuento; su texto deja de ser negro/negrita y se iguala al gris
   * del resto (hereda el text-gray-800 del contenedor, sin color propio).
   */
  it('el texto ya no es negro ni negrita: se iguala en tono y grosor al resto', () => {
    expect(badge).not.toContain('text-black')
    expect(badge).not.toContain('text-white')
    expect(badge).not.toContain('font-bold')
  })

  it('mide text-sm como las demás filas de la tarifa, no text-xs', () => {
    expect(badge).toMatch(/\btext-sm\b/)
    expect(badge).not.toContain('text-xs')
  })
})

describe('SCEN-L14 — el desglose de la tarifa diaria se lee uniforme: mismo tamaño y grosor', () => {
  const rule = (sel: string) =>
    categoryCss.slice(categoryCss.indexOf(sel), categoryCss.indexOf('}', categoryCss.indexOf(sel)))

  it('el precio diario ya no sobresale: text-sm, no text-xl', () => {
    const r = rule('.precio-diario {')
    expect(r).toContain('text-sm')
    expect(r).not.toContain('text-xl')
  })

  it('el precio base tachado también baja a text-sm, conservando el line-through', () => {
    const r = rule('.precio-base-diario {')
    expect(r).toContain('text-sm')
    expect(r).toContain('line-through')
    expect(r).not.toContain('text-xs')
  })

  /**
   * El total de la reserva (.precio-total) SÍ sigue destacando: vive bajo el
   * separador, fuera de este desglose, y es la cifra que el usuario decide. La
   * uniformidad es solo dentro de las filas de la tarifa diaria.
   */
  it('el total de la reserva sigue destacando aparte (text-xl), no se aplana', () => {
    const r = rule('.precio-total {')
    expect(r).toContain('text-xl')
  })
})

describe('SCEN-L15 — el badge de descuento se lee en orden natural, no abreviado al frente', () => {
  const badge = categoryCard.slice(
    categoryCard.indexOf('class="porcentaje-descuento"'),
    categoryCard.indexOf('</span>', categoryCard.indexOf('class="porcentaje-descuento"')),
  )

  it('empieza por "Hoy con" y conserva el porcentaje dinámico', () => {
    expect(badge).toContain('Hoy con')
    expect(badge).toMatch(/\{\{\s*getDiscount\s*\}\}\s*%/)
  })

  it('ya no arranca con la abreviatura suelta "Dto hoy"', () => {
    expect(badge).not.toContain('Dto hoy')
  })
})

describe('SCEN-L05 — "Grupo C (Económico)" es texto gris de párrafo, no titular rojo', () => {
  // Desde la declaración de la regla (no desde una mención en un comentario)
  // hasta su llave de cierre.
  const inicio = categoryCss.indexOf('.categoria-carro {')
  const kicker = categoryCss.slice(inicio, categoryCss.indexOf('}', inicio))

  it('no usa el rojo de marca ni el tamaño de titular', () => {
    expect(kicker).not.toContain('text-red-600')
    expect(kicker).not.toContain('text-lg')
  })

  it('usa gris y peso normal, sin peso de titular', () => {
    expect(kicker).toMatch(/text-gray-\d{3}/)
    expect(kicker).toContain('font-normal')
  })

  it('conserva el tamaño pequeño de metadato', () => {
    expect(kicker).toContain('text-sm')
  })
})

describe('SCEN-L21 — la franja gris de solicitud contiene únicamente el CTA', () => {
  const inicio = categoryCard.indexOf('<div class="seccion-boton-seleccion">')
  const cierre = categoryCard.indexOf('</div>', categoryCard.indexOf('</UButton>', inicio))
  const seccion = categoryCard.slice(inicio, cierre)

  it('retira el mensaje de método de pago de todas las tarjetas', () => {
    expect(seccion).not.toContain('Único método de pago')
    expect(seccion).not.toContain('Tarjeta de crédito en sede')
    expect(seccion).not.toContain('metodo-pago')
  })

  it('conserva el botón de solicitud y su fondo gris', () => {
    expect(seccion).toContain('class="boton-seleccion"')
    const estilos = categoryCss.slice(
      categoryCss.indexOf('.seccion-boton-seleccion {'),
      categoryCss.indexOf('.form-radio {'),
    )
    expect(estilos).toContain('bg-surface-softest')
  })
})

describe('SCEN-L06 — cabecera: nombre del vehículo, y debajo etiqueta + grupo en UNA fila', () => {
  const descripcion = categoryCard.indexOf('class="descripcion-corta"')
  const tags = categoryCard.indexOf('<CategoryTags')
  const kicker = categoryCard.indexOf('<span class="categoria-carro">')
  const filaInicio = categoryCard.indexOf('class="fila-etiquetas-grupo"')
  const fila = categoryCard.slice(filaInicio, categoryCard.indexOf('</span>\n', kicker))

  it('CategoryTags ya no está anidado dentro del kicker de gama', () => {
    const kickerSpan = categoryCard.slice(kicker, categoryCard.indexOf('</span>', kicker))
    expect(kickerSpan).not.toContain('CategoryTags')
  })

  it('la fila va después del nombre del vehículo', () => {
    expect(descripcion).toBeGreaterThan(-1)
    expect(filaInicio).toBeGreaterThan(descripcion)
  })

  it('etiquetas y grupo comparten esa fila, en ese orden', () => {
    expect(filaInicio).toBeGreaterThan(-1)
    expect(tags).toBeGreaterThan(filaInicio)
    expect(kicker).toBeGreaterThan(tags)
    expect(fila).toContain('<CategoryTags')
    expect(fila).toContain('categoria-carro')
  })

  it('la fila los alinea horizontalmente en una sola línea', () => {
    const css = categoryCss.slice(
      categoryCss.indexOf('.fila-etiquetas-grupo {'),
      categoryCss.indexOf('}', categoryCss.indexOf('.fila-etiquetas-grupo {')),
    )
    expect(css).toContain('flex')
    expect(css).toContain('items-center')
  })

  /**
   * Sin etiquetas, el grupo tiene que quedar pegado al nombre del vehículo: la
   * fila de etiquetas no puede dejar un hueco cuando está vacía.
   */
  it('la fila de etiquetas se colapsa cuando no hay ninguna', () => {
    const filaTags = categoryCss.slice(
      categoryCss.indexOf('.etiquetas-categoria {'),
      categoryCss.indexOf('}', categoryCss.indexOf('.etiquetas-categoria {')),
    )
    expect(filaTags).toContain('empty:hidden')
    expect(filaTags, 'el margen lo pone la fila contenedora, no las etiquetas').not.toContain('mt-2')
  })

  it('"sin pico y placa" lleva su propia clase de etiqueta amarilla', () => {
    expect(categoryTags).toMatch(
      /class="[^"]*\betiqueta-sin-pico-placa\b[^"]*"[^>]*>\s*sin pico y placa/,
    )
  })

  it('la clase amarilla existe en el CSS con texto negro', () => {
    const yellow = categoryCss.slice(
      categoryCss.indexOf('.etiqueta-sin-pico-placa'),
      categoryCss.indexOf('.etiqueta-sin-pico-placa') + 220,
    )
    expect(yellow).toMatch(/bg-yellow-\d{3}/)
    expect(yellow).toContain('text-black')
  })
})

describe('SCEN-L07 — el nombre del modelo cuelga centrado del borde superior de la foto', () => {
  const inicio = categoryCss.indexOf('.nombre-modelo {')
  const badge = categoryCss.slice(inicio, categoryCss.indexOf('}', inicio))

  it('va pegado al borde superior, no separado de él', () => {
    expect(badge).toContain('top-0')
    expect(badge).not.toContain('top-5')
  })

  it('va centrado horizontalmente, no anclado a la izquierda', () => {
    expect(badge).toContain('left-1/2')
    expect(badge).toContain('-translate-x-1/2')
    expect(badge).not.toContain('left-5')
  })

  it('curva abajo a 10px y recta arriba', () => {
    expect(badge).toContain('rounded-b-[10px]')
    expect(badge).toContain('rounded-t-none')
    expect(badge, 'rounded-b-full sería la cápsula completa (12px)').not.toContain('rounded-b-full')
    expect(badge, 'rounded-lg redondearía también las esquinas superiores').not.toMatch(
      /\brounded-lg\b/,
    )
  })

  /**
   * Nombres largos ("Suzuki Grand Vitara Híbrida MHEV" en la LU) partían la
   * píldora en dos líneas y rompían la simetría con la cápsula de puntos. Una
   * línea siempre: sin wrap, acotada al ancho de la foto y con elipsis.
   */
  it('nunca pasa a dos líneas', () => {
    expect(badge).toContain('whitespace-nowrap')
    expect(badge).toContain('max-w-')
    expect(badge).toContain('overflow-hidden')
    expect(badge).toContain('text-ellipsis')
  })

  it('el negro es opaco, sin transparencia', () => {
    expect(badge).toContain('bg-black')
    expect(badge).not.toContain('bg-black/')
  })
})

describe('SCEN-L08 — un contador "N de M" reemplaza los puntos del carrusel', () => {
  const carrusel = read('../Carrusel.vue')
  const inicio = categoryCss.indexOf('.contador-fotos {')
  const contador = categoryCss.slice(inicio, categoryCss.indexOf('}', inicio))

  it('el carrusel ya no pinta puntos', () => {
    const abre = carrusel.indexOf('<UCarousel')
    const props = carrusel.slice(abre, carrusel.indexOf('>', abre))
    expect(props).not.toMatch(/^\s*dots\s*$/m)
    expect(carrusel).not.toMatch(/\bdots:\s*'/)
    expect(carrusel).not.toMatch(/\bdot:\s*'/)
  })

  it('cada foto declara su posición con el índice que ya expone la slot, rotulada "Fotos"', () => {
    expect(carrusel).toMatch(/Fotos\s*\{\{\s*index \+ 1\s*\}\}\s*de\s*\{\{\s*vehicleModels\?*\.?length/)
  })

  it('las flechas del contador navegan las fotos (emblaApi scrollPrev/scrollNext) sin disparar la reserva', () => {
    // @click.stop → no propaga al @click de reserva del slide.
    expect(carrusel).toContain('@click.stop="scrollPrev"')
    expect(carrusel).toContain('@click.stop="scrollNext"')
    // Usa la API de Embla que expone UCarousel (defineExpose emblaApi).
    expect(carrusel).toMatch(/ref="carousel"/)
    expect(carrusel).toMatch(/carousel\.value\?\.emblaApi\?\.scrollPrev/)
    expect(carrusel).toMatch(/carousel\.value\?\.emblaApi\?\.scrollNext/)
  })

  it('las flechas solo aparecen si hay más de una foto', () => {
    expect(carrusel).toMatch(/v-if="\(vehicleModels\?\.length \?\? 0\) > 1"/)
  })

  it('cuelga del borde inferior, centrado y en negro opaco', () => {
    expect(contador).toContain('bottom-0')
    expect(contador).toContain('left-1/2')
    expect(contador).toContain('-translate-x-1/2')
    expect(contador).toMatch(/\bbg-black\b/)
    expect(contador).not.toContain('bg-black/')
  })

  // Misma altura que la etiqueta del modelo ⇒ misma curvatura, espejada.
  it('curva arriba a 10px y recta abajo — espejo de la etiqueta del modelo', () => {
    expect(contador).toContain('rounded-t-[10px]')
    expect(contador).toContain('rounded-b-none')
  })
})

describe('SCEN-L12 — el bloque de precios es "concepto a la izquierda, cifra a la derecha"', () => {
  const bloque = categoryCard.slice(
    categoryCard.indexOf('class="contenedor-tarifas'),
    categoryCard.indexOf('adicionales cabezera'),
  )

  it('deja de ser una grilla de dos columnas', () => {
    const css = categoryCss.slice(
      categoryCss.indexOf('.contenedor-tarifas{'),
      categoryCss.indexOf('}', categoryCss.indexOf('.contenedor-tarifas{')),
    )
    expect(css).not.toContain('grid-cols-2')
  })

  it('desaparece la línea vertical difuminada que separaba las columnas', () => {
    expect(bloque).not.toContain('con-borde-difuminado')
  })

  it('cada concepto y su cifra comparten fila', () => {
    const filas = bloque.match(/class="fila-tarifa"/g) ?? []
    expect(filas.length, 'tarifa base, tarifa con dto y total como mínimo').toBeGreaterThanOrEqual(3)
  })

  /**
   * La cifra se empuja al margen derecho con `ms-auto` (no con
   * `justify-between`) para que las filas SIN concepto —la del descuento cuando
   * no hay descuento— sigan alineando su cifra a la derecha.
   */
  it('las cifras se alinean al margen derecho por sí solas', () => {
    const css = categoryCss.slice(
      categoryCss.indexOf('.valor-tarifa {'),
      categoryCss.indexOf('}', categoryCss.indexOf('.valor-tarifa {')),
    )
    expect(css).toContain('ms-auto')
    const valores = bloque.match(/valor-tarifa/g) ?? []
    expect(valores.length).toBeGreaterThanOrEqual(3)
  })

  it('las decisiones opcionales salen del bloque de precio y no forman una segunda columna', () => {
    expect(bloque).not.toContain('contenedor-protecciones')
    expect(categoryCard).toContain('contenedor-adicionales-carro')
    expect(bloque).not.toContain('pl-5 flex flex-col justify-center')
  })

  /**
   * Issue #313: si la fecha cae más allá del horizonte de tarifas, TODA la zona
   * de precios se reemplaza por el estado inline. Reordenar filas no puede
   * abrir una rendija por donde se cuele un "$ 0".
   */
  it('el estado "tarifa no disponible" sigue reemplazando toda la zona de precios', () => {
    expect(bloque).toContain('v-if="isMonthlyPriceUnavailable"')
    expect(bloque).toContain('category-unavailable-test')
    const estado = bloque.indexOf('category-unavailable-test')
    const rama = bloque.indexOf('<template v-else>')
    expect(rama).toBeGreaterThan(estado)
    expect(bloque.slice(estado, rama)).not.toContain('precio-diario')
  })
})

describe('SCEN-L16 — la card surge el desglose "todo incluido" (opción C)', () => {
  const bloque = categoryCard.slice(
    categoryCard.indexOf('class="contenedor-tarifas'),
    categoryCard.indexOf('adicionales cabezera'),
  )

  it('el Seguro Básico va siempre incluido (línea fija con su "?"), ya no un radio', () => {
    expect(bloque).toContain('Seguro Básico')
    expect(bloque).toContain('incluido')
    expect(bloque).not.toContain('withTotalCoverage ? "Seguro Total" : "Seguro Básico"')
  })

  it('el diario mostrado es el básico estable: no cambia al subir a Total', () => {
    expect(bloque).toContain('currencyBasicDailyPrice')
  })

  it('el Seguro Total aparece como línea "+ ..." con su sobrecosto, gatillada por la selección', () => {
    expect(bloque).toContain('+ Seguro Total')
    expect(bloque).toContain('currencyTotalCoveragePrice')
    // Sin el veto a mensual: allí el diario NO incluye la cobertura, así que el
    // recargo movía el total $ 476.000 sin una línea que lo explicara.
    expect(bloque).toContain('v-if="withTotalCoverage"')
    expect(bloque).not.toContain('!haveMonthlyReservation')
  })

  it('surge tasa + IVA en una sola línea, con el monto real del composable', () => {
    expect(bloque).toContain('Tasa administrativa + IVA')
    expect(bloque).toContain('currencyIvaAndTax')
  })

  it('cuando hay impuestos, el total prominente es el "todo incluido", no el subtotal', () => {
    expect(bloque).toContain('Total a pagar')
    // El subtotal crudo (currencyTotalPrice) solo se usa en el fallback mensual;
    // el total prominente por-día es el all-in (con o sin adicionales).
    expect(bloque).toContain('currencyActualTotalPrice')
    expect(bloque).toContain('Precio final, todo incluido')
  })

  /**
   * La escalera (subtotal + tasa/IVA → total) solo aparece cuando hay impuestos
   * que surgir. En mensual getActualTotalPrice === getTotalPrice, así que la
   * compuerta cae a 0 y NO se pinta una línea "Tasa + IVA $0". La aritmética
   * (subtotal + tasa/IVA = total) la garantiza el composable:
   * getIvaAndTaxAmount = max(0, getActualTotalPrice − getTotalPrice).
   */
  it('la escalera está gatillada por getActualTotalPrice > getTotalPrice', () => {
    expect(categoryCard).toContain('getActualTotalPrice.value > getTotalPrice.value')
    const bloqueTaxes = bloque.slice(bloque.indexOf('hasSurfacedTaxes'))
    expect(bloqueTaxes).toContain('Tasa administrativa + IVA')
  })

  it('conserva el fallback mensual: "Total 30 días" e "Incluye IVA y tasa admin"', () => {
    expect(bloque).toContain('haveMonthlyReservation ? "30 días"')
    expect(bloque).toContain('Incluye IVA y tasa admin')
  })
})

describe('SCEN-L17 — Seguro Total se elige en "Servicios adicionales", no en "Escoge protección"', () => {
  it('ya no renderiza el encabezado "Escoge protección"', () => {
    expect(categoryCard).not.toMatch(/body-lg[^>]*>\s*Escoge protección/)
  })

  it('el toggle de Seguro Total vive dentro del contenedor de adicionales, con su sobrecosto', () => {
    const adicionales = categoryCard.slice(categoryCard.indexOf('adicionales-contenido'))
    expect(adicionales).toMatch(/v-model="withTotalCoverage"[\s\S]*?Seguro Total/)
    expect(adicionales).toContain('currencyTotalCoveragePrice')
  })

  it('solo se ofrece si el Seguro Total es cotizable a la fecha', () => {
    const adicionales = categoryCard.slice(categoryCard.indexOf('adicionales-contenido'))
    expect(adicionales).toMatch(/v-if="canQuoteTotalCoverage"[\s\S]*?withTotalCoverage/)
  })

  it('el kilometraje mensual pasa a ser una ampliación dentro de adicionales', () => {
    const adicionales = categoryCard.slice(categoryCard.indexOf('adicionales-contenido'))
    expect(adicionales).toMatch(/v-model="withMileageUpgrade"[\s\S]*?1\.000 km adicionales/)
    expect(adicionales).toContain('(2.000 km en total)')
    expect(categoryCard).not.toContain('Escoge kilometraje')
  })
})

describe('SCEN-L18 — Conductor/Silla/Lavado se inyectan en el desglose (sin IVA), y la sección queda sin precios', () => {
  const bloque = categoryCard.slice(
    categoryCard.indexOf('class="contenedor-tarifas'),
    categoryCard.indexOf('adicionales cabezera'),
  )
  const adicionales = categoryCard.slice(categoryCard.indexOf('adicionales-contenido'))

  it('hasSelectedAdditionals agrupa Conductor/Silla/Lavado (NO el Seguro Total)', () => {
    expect(categoryCard).toMatch(
      /hasSelectedAdditionals = computed\(\s*\(\)\s*=>\s*withExtraDriver\.value \|\| withBabySeat\.value \|\| withWash\.value/,
    )
  })

  it('al haber adicionales aparece "Total renta" y cada línea "+ ..."', () => {
    expect(bloque).toContain('v-if="hasSelectedAdditionals"')
    expect(bloque).toContain('Total renta')
    expect(bloque).toContain('+ Conductor adicional')
    expect(bloque).toContain('+ Silla para bebé')
    expect(bloque).toContain('+ Lavado del vehículo')
  })

  it('los adicionales NO pasan por el subtotal (van sin IVA): el total prominente los suma aparte', () => {
    // Los adicionales mandan sobre la compuerta de impuestos: antes iban dentro
    // de ella y en mensual —donde no hay impuestos que surgir— el total los
    // ignoraba aunque estuvieran marcados.
    expect(bloque).toContain('hasSelectedAdditionals ? currencyTotalToPayWithAdditionals')
    expect(bloque).toContain('hasSurfacedTaxes ? currencyActualTotalPrice : currencyTotalPrice')
    expect(bloque).not.toContain('hasSurfacedTaxes ? (hasSelectedAdditionals')
  })

  it('la sección de adicionales no muestra "$": el precio vive en la escalera', () => {
    // Antes sobrevivían en el caso mensual (!hasSurfacedTaxes), donde la escalera
    // no inyectaba. Ahora la escalera inyecta siempre, así que la sección no
    // vuelve a tener precio propio: dos sitios con la misma cifra es como se
    // llega a que digan cosas distintas.
    // Se prohíbe el PATRÓN del precio junto al selector (span .ml-4), no la
    // mención: el modal que explica las tarifas de lavado sigue citando su
    // precio con todo derecho.
    for (const precio of ['currencyExtraDriverPrice', 'currencyBabySeatPrice', 'currencyWashPrice', 'currencyTotalCoveragePrice']) {
      expect(adicionales).not.toMatch(new RegExp(`ml-4"[\\s\\S]{0,40}${precio}`))
    }
    expect(adicionales).not.toMatch(/!hasSurfacedTaxes/)
  })
})

describe('SCEN-L13 — el interior de la card usa el gris plano de las tarjetas del home', () => {
  it('home/Fleet.vue sigue siendo bg-surface-softest (fuente del token)', () => {
    expect(fleet).toContain('bg-surface-softest')
  })

  /**
   * El degradado `linear-gradient(to right, white, #ededed 50%, white)` pintaba
   * la zona de precios Y la del botón. Al aplanarlo hay que hacerlo en las dos
   * o queda una costura entre bloques contiguos.
   */
  it('no queda ningún degradado horizontal dentro de .categoria', () => {
    expect(categoriaRoot0).not.toMatch(/linear-gradient\(to right/)
  })

  it.each(['.sutil-fondo', '.seccion-boton-seleccion'])(
    '%s usa el mismo token que las tarjetas del home',
    (selector) => {
      const inicio = categoryCss.indexOf(`${selector} {`)
      expect(inicio, `${selector} no existe`).toBeGreaterThan(-1)
      const regla = categoryCss.slice(inicio, categoryCss.indexOf('}', inicio))
      expect(regla).toContain('bg-surface-softest')
    },
  )
})

describe('SCEN-L11 — las flechas del carrusel también existen en móvil', () => {
  it('ya no hay una regla que las oculte por debajo de 1024px', () => {
    expect(baseCss).not.toMatch(/\[data-slot="arrows"\]\s*\{\s*display:\s*none/)
  })

  /**
   * Con los puntos fuera, las flechas son la ÚNICA forma de navegar que no sea
   * swipe. Si vuelven a esconderse en móvil, el carrusel queda sin controles.
   */
  it('el estilo de los botones no vive dentro de un @media', () => {
    const inicio = baseCss.indexOf('[data-slot="arrows"] button {')
    expect(inicio).toBeGreaterThan(-1)
    const antes = baseCss.slice(0, inicio)
    const mediaAbierto = (antes.match(/@media[^{]*\{/g) ?? []).length
    const llavesCerradas = (antes.match(/\}/g) ?? []).length
    const llavesAbiertas = (antes.match(/\{/g) ?? []).length
    expect(llavesAbiertas - llavesCerradas, 'la regla está anidada en un @media').toBe(0)
    expect(mediaAbierto).toBeGreaterThanOrEqual(0)
  })
})

describe('SCEN-L09 — las flechas laterales usan negro opaco', () => {
  const arrows = baseCss.slice(
    baseCss.indexOf('[data-slot="arrows"] button {'),
    baseCss.indexOf('[data-slot="arrows"] button:first-child'),
  )

  it('el fondo en reposo no lleva alfa', () => {
    expect(arrows).toMatch(/background-color:\s*#000\b/)
    expect(arrows).not.toMatch(/background-color:\s*rgba\(0,\s*0,\s*0,\s*0\.45\)/)
  })

  it('el hover sigue siendo visible y tampoco lleva alfa', () => {
    const hover = baseCss.slice(
      baseCss.indexOf('[data-slot="arrows"] button:hover {'),
      baseCss.indexOf('[data-slot="arrows"] button:first-child'),
    )
    expect(hover).not.toMatch(/rgba\(/)
  })
})

describe('SCEN-L10 — el total de la reserva se lee en negro, no en rojo', () => {
  const inicio = categoryCss.indexOf('.precio-total {')
  const total = categoryCss.slice(inicio, categoryCss.indexOf('}', inicio))

  it('no usa el rojo de marca', () => {
    expect(total).not.toContain('text-red-600')
  })

  it('usa un negro/gris oscuro explícito', () => {
    expect(total).toMatch(/text-(black|gray-900)/)
  })
})

describe('CategoryCard — el kilometraje mensual se explica en el desglose', () => {
  it('muestra la base de 1.000 kilómetros como incluida', () => {
    expect(categoryCard).toMatch(/1\.000 kilómetros[\s\S]{0,120}incluidos/)
  })

  it('al marcarla muestra el recargo limpio junto al cambio de plan', () => {
    expect(categoryCard).toMatch(/v-if="haveMonthlyReservation && withMileageUpgrade"[\s\S]{0,180}\+ 1\.000 kilómetros adicionales/)
    expect(categoryCard).toContain('currencyMileageUpgradePrice')
  })
})

/**
 * `hasSurfacedTaxes` decidía DOS cosas a la vez: si se desglosan impuestos y si
 * los adicionales entran en la escalera y en el total. En mensual la primera
 * respuesta es "no" —el total ya los incluye— y arrastraba a la segunda: marcar
 * "Conductor adicional 30 días $ 360.000" dejaba el total en $ 4.166.000, con el
 * precio a la vista junto al checkbox. Dos cifras que no cuadraban.
 */
describe('CategoryCard — los adicionales entran en el total también en mensual', () => {
  const resume = read('../ReservationResume.vue')

  it('el bloque de adicionales ya no cuelga de hasSurfacedTaxes', () => {
    for (const vista of [categoryCard, resume]) {
      // El desglose de impuestos sigue gateado por hasSurfacedTaxes...
      expect(vista).toMatch(/v-if="hasSurfacedTaxes"[\s\S]{0,400}Tasa administrativa \+ IVA/)
      // ...pero "Total renta" + las líneas de extras cuelgan solo de que haya
      // adicionales marcados, sin anidarse dentro del gate de impuestos.
      const bloque = vista.match(/<template v-if="hasSelectedAdditionals">([\s\S]*?)<\/template>/)?.[1] ?? ''
      expect(bloque).toMatch(/Total renta/)
      expect(bloque).toMatch(/\+ Conductor adicional/)
    }
  })

  it('el total prominente suma los adicionales aunque no haya impuestos que surgir', () => {
    const expresion = /hasSelectedAdditionals\s*\?\s*currencyTotalToPayWithAdditionals\s*:\s*\(hasSurfacedTaxes\s*\?\s*currencyActualTotalPrice\s*:\s*currencyTotalPrice\)/
    expect(categoryCard).toMatch(expresion)
    expect(resume).toMatch(expresion)
  })

  it('los precios dejan de vivir junto al checkbox', () => {
    // Vivían ahí solo cuando !hasSurfacedTaxes, que en la práctica era "mensual".
    expect(categoryCard).not.toMatch(/v-show="[^"]*!hasSurfacedTaxes"/)
  })
})

describe('CategoryCard — el Seguro Total tiene línea también en mensual', () => {
  const resume = read('../ReservationResume.vue')

  it('la línea no está vetada en reservas mensuales', () => {
    // El veto venía de cuando el diario mensual incluía la cobertura y la línea
    // duplicaba. Hoy no la incluye (el diario no cambia al marcarla) y el
    // recargo movía el total $ 476.000 sin una sola línea que lo explicara.
    for (const vista of [categoryCard, resume]) {
      expect(vista).toMatch(/v-if="withTotalCoverage"[\s\S]{0,120}\+ Seguro Total/)
      expect(vista).not.toMatch(/withTotalCoverage && !haveMonthlyReservation/)
    }
  })
})
