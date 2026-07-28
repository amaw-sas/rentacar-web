import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../ReservationResume.vue', import.meta.url)),
  'utf8',
)
const card = readFileSync(
  fileURLToPath(new URL('../CategoryCard.vue', import.meta.url)),
  'utf8',
)
const styles = readFileSync(
  fileURLToPath(
    new URL('../../assets/css/rentacar-main/reservation-resume.css', import.meta.url),
  ),
  'utf8',
)
const categoryStyles = readFileSync(
  fileURLToPath(
    new URL('../../assets/css/rentacar-main/category.css', import.meta.url),
  ),
  'utf8',
)
const categoryNameRule = styles.match(
  /\.category-name\s*\{([\s\S]*?)\}/,
)?.[1] ?? ''
const seccion = readFileSync(
  fileURLToPath(new URL('../CategorySelectionSection.vue', import.meta.url)),
  'utf8',
)

/**
 * El recorrido del cliente es una sola cadena verde: "Solicitar este vehículo"
 * en la card → "Siguiente" en el Resumen. Un rojo en medio leía como alerta
 * justo donde el cliente avanza.
 */
describe('ReservationResume — el avance usa el verde de las cards', () => {
  it('"Siguiente" lleva el mismo verde que "Solicitar este vehículo"', () => {
    const boton = seccion.match(/label="Siguiente"[\s\S]*?\/?>/)?.[0] ?? ''
    expect(boton).toMatch(/bg-green-700/)
    expect(boton).toMatch(/hover:bg-green-800/)
    expect(boton).not.toMatch(/bg-brand-600/)
  })

  it('es literalmente el verde de .boton-seleccion en category.css', () => {
    const cta = categoryStyles.match(/\.boton-seleccion\s*\{([\s\S]*?)\}/)?.[1] ?? ''
    expect(cta).toMatch(/bg-green-700/)
    expect(cta).toMatch(/hover:bg-green-800/)
  })
})

/**
 * El Resumen es un ESPEJO de la card de resultados, no un resumen propio.
 *
 * Antes cada superficie calculaba su cierre por su cuenta: la card mostraba
 * `currencyActualTotalPrice` ("Total a pagar, precio final todo incluido") y el
 * Resumen `currencyTotalPrice` ("Total renta, no incluye IVA ni tasa admin").
 * Para la MISMA reserva eran $ 505.488 y $ 386.164 — el cliente pulsaba
 * "Solicitar" con un precio y el panel siguiente le mostraba otro.
 *
 * El padre (CategorySelectionSection) pasa al Resumen la MISMA instancia de
 * useCategory que ya usó la card, así que basta con que ambos lean las mismas
 * variables para que no puedan divergir. Estos tests fijan eso.
 */
describe('ReservationResume — espejo de la escalera de precios de la card', () => {
  // Filas del desglose que ambas superficies deben nombrar igual. Si alguien
  // renombra una en la card y no aquí, este test cae.
  const filasCompartidas = [
    'Tarifa Diaria',
    'Seguro Básico',
    '1.000 kilómetros',
    '+ 1.000 kilómetros adicionales',
    'Subtotal {{ getFormattedDays }}',
    'Tasa administrativa + IVA',
    'Total a pagar',
    'Total renta',
    'Precio final, todo incluido',
    'No incluye IVA ni tasa admin',
  ]

  it.each(filasCompartidas)('la fila "%s" existe en la card y en el Resumen', (fila) => {
    expect(card).toContain(fila)
    expect(source).toContain(fila)
  })

  it('cierra con el total CON impuestos, nunca con el subtotal', () => {
    // Mismo ternario que la card: con adicionales el prominente es el que los
    // suma; sin ellos, el total real. `currencyTotalPrice` solo sobrevive como
    // fallback cuando no hay impuestos que surgir (mensual).
    // Los adicionales mandan sobre la compuerta de impuestos: anidados dentro
    // de ella, en mensual —donde no hay impuestos que surgir— el total los
    // ignoraba aunque estuvieran marcados y cobrados.
    expect(source).toMatch(
      /hasSelectedAdditionals\s*\?\s*currencyTotalToPayWithAdditionals\s*:\s*\(hasSurfacedTaxes\s*\?\s*currencyActualTotalPrice\s*:\s*currencyTotalPrice\)/,
    )
    expect(source).not.toMatch(/hasSurfacedTaxes\s*\?\s*\(hasSelectedAdditionals/)
  })

  it('surge la tasa + IVA como línea propia con la cifra de la card', () => {
    expect(source).toContain('currencyIvaAndTax')
    expect(card).toContain('currencyIvaAndTax')
  })

  it('usa la diaria CON seguro básico, igual que la card', () => {
    // getDailyPrice ≠ getBasicDailyPrice en cuanto se marca Seguro Total: la
    // card muestra la básica y añade "+ Seguro Total" como línea aparte. El
    // Resumen hacía lo otro y las dos diarias se separaban.
    expect(source).toContain('currencyBasicDailyPrice')
    expect(source).not.toMatch(/\{\{\s*currencyDailyPrice\s*\}\}/)
  })

  it('replica la compuerta de impuestos comparando las mismas dos cifras', () => {
    expect(card).toMatch(/getActualTotalPrice\.value\s*>\s*getTotalPrice\.value/)
    // El Resumen recibe la instancia por props, y ahí Vue ya desenvolvió los
    // refs (selectedCategory es un ref profundo ⇒ reactive() por dentro): pedir
    // `.value` devuelve undefined SIN lanzar, y `undefined > undefined` es
    // false, que es como la escalera quedaba muda y el panel cerraba en el
    // subtotal. `toValue` sirve para las dos formas; leer a través de
    // `props.category` conserva la reactividad del proxy.
    expect(source).toMatch(
      /toValue\(props\.category\.getActualTotalPrice\)\s*>\s*toValue\(props\.category\.getTotalPrice\)/,
    )
  })

  it('no pide .value a nada que venga desenvuelto por props', () => {
    const script = source.slice(source.indexOf('<script setup'))
    expect(script).not.toMatch(/\b(?:getActualTotalPrice|getTotalPrice|withExtraDriver|withBabySeat|withWash|withTotalCoverage)\.value\b/)
  })

  it('falla en cerrado más allá del horizonte de tarifas, como la card', () => {
    // Issue #313: nunca un "$ 0" fabricado en una superficie visible.
    expect(source).toContain('isMonthlyPriceUnavailable')
  })

  it('refleja la ampliación mensual y su recargo con las mismas variables', () => {
    for (const vista of [card, source]) {
      expect(vista).toContain('withMileageUpgrade')
      expect(vista).toContain('currencyMileageUpgradePrice')
      expect(vista).toContain('+ 1.000 kilómetros adicionales')
    }
  })
})

describe('ReservationResume — layout de una sola columna', () => {
  it('ya no parte el panel en datos | precios', () => {
    // A ~420px de slideover la columna derecha apretaba las cifras contra el
    // borde y no dejaba sitio al desglose completo.
    expect(source).not.toContain('grid grid-cols-2')
  })

  it('usa las clases del desglose de la card, no las suyas propias', () => {
    for (const clase of ['fila-tarifa', 'valor-tarifa', 'precio-total', 'separador-tarifa', 'texto-no-incluye']) {
      expect(source).toContain(clase)
    }
    // Los bloques `text-right mt-3 leading-tight` + `!text-xl` eran el desglose
    // propio del Resumen; los reemplaza la escalera compartida.
    expect(source).not.toMatch(/!text-xl/)
  })

  it('category.css sirve esas clases a las dos superficies desde una sola regla', () => {
    const reglaCompartida = categoryStyles.match(
      /\.categoria,\s*\.reservation-resume\s*\{([\s\S]*?)\n\}/,
    )?.[1] ?? ''
    for (const clase of ['.fila-tarifa', '.valor-tarifa', '.precio-total', '.separador-tarifa', '.texto-no-incluye']) {
      expect(reglaCompartida).toContain(clase)
    }
  })
})

/**
 * El panel mide 840px de contenido contra 669px visibles en escritorio, y en
 * móvil el hueco es mucho peor. Recortar píxeles es una carrera que se pierde en
 * cuanto baja la pantalla: el "Total a pagar" —la cifra que la card acaba de
 * prometer— se ancla al pie del área scrolleable y deja de depender del alto.
 */
describe('ReservationResume — el total no cae bajo el pliegue', () => {
  it('ancla el cierre al fondo del área scrolleable', () => {
    expect(source).toMatch(/class="cierre-precio"/)
    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    expect(regla).toMatch(/\bsticky\b/)
    // El offset es negativo, no 0: ver "el fondo del cierre cubre el padding
    // inferior del cuerpo" para el porqué.
    expect(regla).toMatch(/-bottom-\d/)
  })

  it('el cierre tapa el contenido que scrollea por debajo', () => {
    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    // Sin fondo OPACO propio el desglose se leería a través del total; y sin
    // sangrar más allá del padding del cuerpo, asomaría por los costados.
    expect(regla).toMatch(/bg-surface-softest/)
    expect(regla).toMatch(/-mx-/)
  })

  /**
   * El total y los botones forman UNA franja gris continua hasta el borde
   * inferior del panel. Antes eran dos bloques grises separados por costuras
   * blancas: el padding del cuerpo, el del footer y el fondo blanco del propio
   * cierre. Sobrevive solo un filete blanco a cada lado, como el marco de la
   * card.
   */
  it('el cierre no corta la franja con fondo blanco propio', () => {
    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    expect(regla).not.toMatch(/bg-white/)
    expect(regla).toMatch(/bg-surface-softest/)
  })

  it('deja filete blanco a los lados en vez de ir a sangre', () => {
    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    // El cuerpo del slideover tiene 16px de padding lateral (24 en sm). Se
    // sangra uno menos para que quede blanco visible al borde.
    expect(regla).toMatch(/-mx-2[^;]*px-2|px-2[^;]*-mx-2/)
    expect(regla).toMatch(/sm:-mx-4[^;]*sm:px-4|sm:px-4[^;]*sm:-mx-4/)
    expect(regla).not.toMatch(/sm:-mx-6/)
  })

  it('el footer del paso Resumen continúa la misma franja', () => {
    // Se busca por la clase del contenedor de botones ADEMÁS de por el v-if: el
    // v-if aparece antes en <reservation-resume>, así que por sí solo apuntaba
    // al bloque equivocado.
    const bloque = (seccion.match(/slideoverStep === 'resumen'"[\s\S]{0,400}/)?.[0] ?? '')
      + (seccion.match(/class="w-full flex flex-col gap-3([^"]*)"/)?.[1] ?? '')
    expect(bloque).toMatch(/bg-surface-softest/)
    // Mismo sangrado lateral que el cierre: si no coinciden, el filete blanco
    // cambia de ancho a media franja y se ve el escalón.
    expect(bloque).toMatch(/-mx-2/)
    expect(bloque).toMatch(/sm:-mx-4/)
    // `grow` es obligatorio: como item flex, `w-full` lo clava en el ancho del
    // contenido del footer y los márgenes negativos lo CORREN a la izquierda en
    // vez de ensancharlo — medido, el filete quedaba en 8px a la izquierda y 40
    // a la derecha. Con `grow` absorbe los 32px que abren esos márgenes.
    expect(bloque).toMatch(/\bgrow\b/)
  })

  it('las esquinas redondeadas quedan solo en los extremos de la franja', () => {
    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    const bloque = (seccion.match(/slideoverStep === 'resumen'"[\s\S]{0,400}/)?.[0] ?? '')
      + (seccion.match(/class="w-full flex flex-col gap-3([^"]*)"/)?.[1] ?? '')
    expect(regla).toMatch(/rounded-t-/)
    expect(bloque).toMatch(/rounded-b-/)
  })

  it('la zona del total va rellena, sin línea gris', () => {
    const wrapper = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    // La zona del total son las dos capas juntas: el envoltorio pone el relleno
    // —es quien llega hasta el borde de la franja— y el panel, el aire interior.
    const panel = (styles.match(/\.cierre-precio-panel\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? '')
      + (styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? '')
    // Nada de filete gris de 1px: la separación la hace el relleno. Lo que sí
    // lleva el envoltorio es un borde BLANCO y grueso, que no es una línea sino
    // el aire entre la última fila del desglose y la franja — y que además tapa
    // lo que pasa por debajo al scrollear, cosa que un margen no haría.
    expect(wrapper).not.toMatch(/border-t border-gray|border-t-\[1px\]|border-gray-\d/)
    expect(wrapper).toMatch(/border-t-8\b/)
    expect(wrapper).toMatch(/border-white\b/)
    // Solo la regla del panel: `panel` concatena panel + envoltorio para leer el
    // relleno, y el borde blanco de este último no cuenta como borde del panel.
    const panelSolo = styles.match(/\.cierre-precio-panel\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    expect(panelSolo).not.toMatch(/border/)
    // Mismo token que .sutil-fondo de la card, y esquinas redondeadas.
    expect(panel).toMatch(/bg-surface-softest/)
    expect(panel).toMatch(/rounded-/)
    expect(source).toMatch(/class="cierre-precio-panel"/)
  })

  /** El cierre conserva el mismo relleno exterior de la franja gris de la card. */
  it('respeta el mismo ritmo vertical que la zona de CTA de la card', () => {
    const cta = categoryStyles.match(/\.seccion-boton-seleccion\s*\{([\s\S]*?)\n\s{6}\./)?.[1] ?? ''
    // Referencia: la card conserva p-4 (16px) alrededor del único CTA.
    expect(cta).toMatch(/\bp-4\b/)

    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    const panel = styles.match(/\.cierre-precio-panel\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    const footer = seccion.match(/class="w-full flex flex-col gap-3([^"]*)"/)?.[1] ?? ''
    // 16px sobre "Total a pagar".
    expect(regla).toMatch(/\bpt-4\b/)
    // Nada de aire propio bajo el texto: el hueco hasta los botones lo mide el
    // footer, y sumar los dos daba los 36px que descuadraban la franja.
    expect(regla).not.toMatch(/\bpb-\d/)
    expect(panel).not.toMatch(/\bpb-\d/)
    // 12px entre el texto y los botones, y 16px debajo de ellos.
    expect(footer).toMatch(/\bpt-3\b/)
    expect(footer).toMatch(/\bpb-4\b/)
  })

  /**
   * Los datos de la reserva son un bloque relleno, como la zona de precios de
   * la card: gris con el marco blanco alrededor. Antes iban sobre blanco y se
   * separaban de la escalera con un filete, que ahora sobra.
   */
  it('los datos de la reserva van en un bloque relleno', () => {
    const datos = styles.match(/\.reservation-data\s*\{([\s\S]*?)\n\s{8}\./)?.[1] ?? ''
    expect(datos).toMatch(/bg-surface-softest/)
    expect(datos).toMatch(/rounded-xl/)
    // El padding supera al sangrado en 8px, que es el sangrado que ya tenía
    // "Total a pagar" y que es el bueno.
    expect(datos).toMatch(/\bpx-4\b/)
    expect(datos).toMatch(/sm:px-6\b/)
    expect(datos).toMatch(/\bpy-3\b/)
  })

  it('todo el texto del panel arranca en la misma vertical', () => {
    const datos = styles.match(/\.reservation-data\s*\{([\s\S]*?)\n\s{8}\./)?.[1] ?? ''
    const escalera = styles.match(/\.contenedor-precios-tarifa\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    const panel = styles.match(/\.cierre-precio-panel\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    const footer = seccion.match(/class="w-full flex flex-col gap-3([^"]*)"/)?.[1] ?? ''
    // Medido antes: datos en 20px, escalera y botones en 24, "Total a pagar" en
    // 32. El 32 es el que se conserva, así que cada bloque mete su texto 8px
    // por dentro del borde de contenido del cuerpo:
    //   datos y footer sangran 16 y devuelven 24 → +8
    //   la escalera no sangra y añade 8 → +8
    //   el cierre se cancela a 0 y el panel añade 8 → +8
    expect(datos).toMatch(/sm:-mx-4[\s\S]*sm:px-6|sm:px-6[\s\S]*sm:-mx-4/)
    expect(escalera).toMatch(/\bpx-2\b/)
    expect(panel).toMatch(/\bpx-2\b/)
    expect(footer).toMatch(/sm:px-6\b/)
  })

  it('no queda ningún filete suelto al final de un bloque', () => {
    // Dos <hr> quedaban colgando sin nada que separar: el que cerraba la
    // escalera contra la franja del total y el que iba bajo los datos, que
    // ahora se separan por relleno.
    const cuerpo = source.slice(source.indexOf('class="resumen-cuerpo"'), source.indexOf('class="cierre-precio"'))
    expect(cuerpo).not.toMatch(/<hr class="separador-tarifa">\s*<\/template>/)
    expect(cuerpo).not.toMatch(/<\/div>\s*<hr class="separador-tarifa">\s*<!--[\s\S]*?contenedor-precios-tarifa/)
    // El separador interno entre impuestos y adicionales solo aparece cuando
    // existe ese primer grupo. En mensual no hay desglose de impuestos y el
    // separador general ya cumple la función, evitando dos líneas consecutivas.
    expect(cuerpo).toMatch(
      /hasSelectedAdditionals[\s\S]{0,500}<hr v-if="hasSurfacedTaxes" class="separador-tarifa">/,
    )
  })

  it('el relleno usa exactamente el token de la card', () => {
    const sutil = categoryStyles.match(/\.sutil-fondo\s*\{([\s\S]*?)\}/)?.[1] ?? ''
    expect(sutil).toMatch(/bg-surface-softest/)
  })

  it('no deja aire muerto contra los botones', () => {
    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    // Con el contenido más corto que el panel no hay overflow, así que `sticky`
    // queda inerte: sin `mt-auto` el cierre se queda a media altura y el hueco
    // hasta los botones es el espacio libre del cuerpo flex.
    expect(regla).toMatch(/mt-auto/)
  })

  it('el fondo del cierre cubre el padding inferior del cuerpo', () => {
    const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    // El cuerpo del slideover pone 24px de padding abajo. Sin sangrar hasta
    // ahí, quedaba una franja descubierta por la que asomaban las filas del
    // desglose entre el relleno del total y los botones.
    //
    // El margen negativo saca la caja del flujo hacia abajo...
    expect(regla).toMatch(/-mb-4\b/)
    expect(regla).toMatch(/sm:-mb-6\b/)
    // ...pero quien la PINTA hasta el borde es el `bottom` negativo. Medido en
    // navegador: sin `pb` propio la franja descubierta sigue en 0px. Ese padding
    // solo sumaba al del footer y daba 36px de hueco donde la card tiene 12.
    expect(regla).not.toMatch(/\bpb-\d/)
    // Y el anclaje baja esos mismos 24px: Chrome fija el sticky al borde de
    // CONTENIDO del scroller, así que con `bottom-0` la caja se para antes del
    // fondo y el sangrado por sí solo no cierra la franja.
    expect(regla).toMatch(/-bottom-4/)
    expect(regla).toMatch(/sm:-bottom-6/)
    expect(regla).not.toMatch(/\bbottom-0\b/)
    // Y deja de vivir en la raíz, donde no movía nada.
    const raiz = styles.match(/\.reservation-resume\s*\{([\s\S]*?)\n\s{4}\./)?.[1] ?? ''
    expect(raiz).not.toMatch(/-mb-/)
  })

  it('la cadena flex llega desde la raíz hasta el cierre', () => {
    // mt-auto solo empuja si TODOS los eslabones son flex column que crecen.
    const raiz = styles.match(/\.reservation-resume\s*\{([\s\S]*?)\n\s{4}\./)?.[1] ?? ''
    const cuerpo = styles.match(/\.resumen-cuerpo\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    const escalera = styles.match(/\.contenedor-precios-tarifa\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    expect(raiz).toMatch(/flex flex-col/)
    expect(raiz).toMatch(/min-h-full/)
    expect(cuerpo).toMatch(/flex flex-col grow/)
    expect(escalera).toMatch(/flex flex-col grow/)
    expect(source).toMatch(/class="resumen-cuerpo"/)
  })

  it('el total sigue dentro del Resumen, no en otro componente', () => {
    // Si el cierre migrara al footer del slideover, el Resumen dejaría de ser
    // autocontenido y las dos superficies podrían volver a divergir.
    expect(source).toContain('cierre-precio')
    expect(source).toContain('Total a pagar')
    expect(seccion).not.toContain('cierre-precio')
  })

  it('el cierre cuelga de la raíz para que sticky tenga recorrido', () => {
    // `sticky` solo se mueve dentro de su bloque contenedor: anidado en
    // .contenedor-precios-tarifa (≈257px) se queda sin sitio y el total vuelve
    // a caer bajo el pliegue en cuanto hay scroll.
    const escalera = source.slice(
      source.indexOf('class="contenedor-precios-tarifa"'),
      source.indexOf('class="cierre-precio"'),
    )
    expect(escalera).not.toContain('cierre-precio-panel')
    // Y conserva la compuerta del horizonte de tarifas que tenía al estar
    // dentro del <template v-else> del desglose.
    expect(source).toMatch(/v-if="!isMonthlyPriceUnavailable" class="cierre-precio"/)
  })
})

describe('ReservationResume — bloque de datos compacto', () => {
  it('pone Recogida y Entrega en dos columnas en vez de apilarlas', () => {
    // Se probó a una sola columna ("Recogida: <sede>" y debajo "<fecha> ·
    // <hora>") y se descartó: las dos columnas se leen mejor porque los dos
    // tramos quedan enfrentados y se comparan de un vistazo.
    expect(source).toMatch(/class="pickup-return-grid"/)
    expect(styles).toMatch(/\.pickup-return-grid/)
    expect(source).not.toMatch(/linea-sede|linea-fecha/)
  })

  it('la foto y el bloque gris se ensanchan hasta el filete del total', () => {
    // La franja del total sangra hasta dejar 8px de blanco; la foto y los datos
    // iban con los 24px del padding del cuerpo y se veían más estrechos.
    const carrusel = styles.match(/\.carrusel-container\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    const datos = styles.match(/\.reservation-data\s*\{([\s\S]*?)\n\s{8}\./)?.[1] ?? ''
    expect(carrusel).toMatch(/-mx-2\b/)
    expect(carrusel).toMatch(/sm:-mx-4\b/)
    expect(datos).toMatch(/-mx-2\b/)
    expect(datos).toMatch(/sm:-mx-4\b/)
  })

  it('la foto se ensancha sin ganar altura', () => {
    // A 448px de panel: 400px de ancho con 5/3 daban 240 de alto. Ensanchando a
    // 432 el mismo 5/3 la subiría a 259; con 9/5 vuelve a 240 exactos y el
    // object-cover recorta en vez de estirar.
    expect(styles).toMatch(/aspect-\[9\/5\]/)
    const carrusel = styles.match(/\.carrusel-container\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    expect(carrusel).toMatch(/aspect-\[9\/5\]/)
  })

  it('no gasta un renglón por etiqueta en fecha y hora', () => {
    // "Fecha 10 de agosto de 2026" y "Hora 10:00 a. m." ocupaban dos líneas cada
    // uno por bloque; el dato se lee solo.
    expect(source).not.toMatch(/>Fecha</)
    expect(source).not.toMatch(/>Hora</)
  })

  it('mantiene los datos que el cliente necesita verificar', () => {
    for (const campo of [
      'selectedPickupLocation',
      'selectedReturnLocation',
      'formattedPickupDate',
      'formattedReturnDate',
      'formattedPickupHour',
      'formattedReturnHour',
    ]) {
      expect(source).toContain(campo)
    }
  })
})

/**
 * Compartir pertenece a la ficha, no a la decisión. En el footer competía de
 * frente con "Siguiente" —la zona donde el cliente avanza— y sus cuatro colores
 * de marcas ajenas eran lo más saturado de un panel que ya es gris plano con un
 * solo verde. Facebook y X además no son canal: nadie manda una cotización de
 * alquiler por ahí.
 */
describe('ReservationResume — compartir vive sobre la foto', () => {
  it('las acciones cuelgan del carrusel, no del footer', () => {
    const foto = source.match(/class="carrusel-container"[\s\S]*?<\/div>\s*\n/)?.[0] ?? ''
    expect(foto).toContain('acciones-compartir')
    expect(seccion).not.toContain('acciones-compartir')
  })

  it('solo quedan WhatsApp y copiar enlace', () => {
    expect(source).toMatch(/shareWhatsapp/)
    expect(source).toMatch(/copyLink/)
    expect(source).not.toMatch(/Facebook|Twitter|shareTwitter/i)
    expect(seccion).not.toMatch(/shareFacebook|shareTwitter/)
  })

  it('la cápsula de colores desapareció del footer', () => {
    expect(seccion).not.toMatch(/bg-green-500 hover:bg-green-600/)
    expect(seccion).not.toMatch(/bg-blue-600 hover:bg-blue-700/)
  })

  it('el icono de WhatsApp se resuelve de verdad', () => {
    // Los iconos viven en components/Icons/, así que el auto-import los expone
    // como IconsWhatsappIcon: sin el alias, Vue renderiza un elemento
    // desconocido y la ficha queda como un círculo negro vacío.
    expect(source).toMatch(/IconsWhatsappIcon as WhatsappIcon/)
  })

  it('las fichas son monocromas, en el lenguaje del chrome de la foto', () => {
    const regla = styles.match(/\.ficha-compartir\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
    expect(regla).toMatch(/bg-black/)
    expect(regla).not.toMatch(/bg-(?:green|blue|red|brand)-/)
  })

  it('el tap en una ficha no dispara el flujo de reserva de la foto', () => {
    // La foto abre el paso siguiente al tocarla; las fichas van encima.
    expect(source).toMatch(/@click\.stop="[^"]*shareWhatsapp/)
    expect(source).toMatch(/@click\.stop="[^"]*copyLink/)
  })

  it('el padre sigue siendo dueño de la URL a compartir', () => {
    // getReservationShareUrl depende de `vehiculo`, el router y el store: vive
    // donde están sus entradas, y el Resumen solo avisa.
    expect(seccion).toContain('getReservationShareUrl')
    // Se mira el código, no los comentarios que explican dónde vive la lógica.
    const sinComentarios = source
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\/[^\n]*/g, '')
    expect(sinComentarios).not.toContain('getReservationShareUrl')
  })
})

describe('ReservationResume — sin barra roja', () => {
  it('el acento rojo sobre el título ya no está', () => {
    expect(source).not.toMatch(/bg-red-\d{3}/)
  })
})

describe('ReservationResume — chrome de la foto compartido con la card', () => {
  it('no redefine el nombre del modelo por su cuenta', () => {
    // Cuando `.contador-fotos` no tenía regla aquí, el "Fotos 1 de N" caía en
    // flujo normal y aparecía ENCIMA de la foto en vez de colgado de su borde.
    expect(styles).not.toMatch(/\.carrusel-container[\s\S]*?\.nombre-modelo/)
  })

  it('category.css posiciona el chrome para las dos superficies', () => {
    const reglaChrome = categoryStyles.match(
      /\.categoria,\s*\.reservation-resume \.carrusel-container\s*\{([\s\S]*?)\n\}/,
    )?.[1] ?? ''
    expect(reglaChrome).toContain('.nombre-modelo')
    expect(reglaChrome).toContain('.contador-fotos')
  })
})

/**
 * Jerarquía del encabezado: manda el vehículo, la gama es metadato. Es la misma
 * relación que en la card (.descripcion-corta grande y oscura, .categoria-carro
 * gris y pequeña), solo que aquí caben en una línea.
 */
describe('ReservationResume — encabezado: el vehículo manda, la gama acompaña', () => {
  const descripcionRule = styles.match(/\.category-description\s*\{([\s\S]*?)\}/)?.[1] ?? ''

  it('pone descripción y gama en la misma línea', () => {
    expect(source).toMatch(/class="category-heading"/)
    const bloque = source.match(/class="category-heading"[\s\S]*?<\/div>/)?.[0] ?? ''
    expect(bloque).toContain('category-description')
    expect(bloque).toContain('category-name')
  })

  it('el encabezado va fuera del bloque gris, como en la card', () => {
    // En la card el nombre del vehículo y el grupo van sobre blanco y el gris
    // empieza en los precios. Aquí el gris agrupa los datos de la reserva, así
    // que el encabezado —título, gama y pico y placa— le queda por encima.
    expect(source).toMatch(/class="resumen-encabezado"/)
    const encabezado = source.match(/class="resumen-encabezado"([\s\S]*?)class="reservation-data"/)?.[1] ?? ''
    expect(encabezado).toMatch(/category-heading/)
    expect(encabezado).toMatch(/category-picoyplaca/)
    // Y el bloque gris se queda solo con recogida, entrega y alquiler.
    const gris = source.match(/class="reservation-data"([\s\S]*?)contenedor-precios-tarifa/)?.[1] ?? ''
    expect(gris).not.toMatch(/category-heading|category-picoyplaca/)
    expect(gris).toMatch(/pickup-return-grid/)
  })

  it('la descripción del vehículo pesa más que la gama', () => {
    // 20px, no los 24 de la card: a 420px de slideover un nombre largo
    // ("Compacto automático" + "Gama CX") se parte en dos líneas, y a 24/800
    // empataría en peso con la cifra del total, que es lo que debe mandar abajo.
    expect(descripcionRule).toMatch(/\btext-xl\b/)
    expect(descripcionRule).toMatch(/font-extrabold/)
    // La gama baja a texto normal: dejó de ser un titular en rojo y negrita.
    expect(categoryNameRule).toMatch(/font-normal/)
    expect(categoryNameRule).toMatch(/\btext-sm\b/)
    expect(categoryNameRule).not.toMatch(/font-bold|font-extrabold/)
  })

  /**
   * Mismas tintas que la card: gris-900 para títulos, gris-800 para el cuerpo,
   * gris-600 para etiquetas. El Resumen usaba negro puro en los datos de la
   * reserva —más oscuro que las cifras de dinero, al revés de lo que importa—
   * y negrita gris-900 en las etiquetas, que las volvía el texto más pesado del
   * panel por encima del nombre del vehículo.
   */
  describe('tintas emparejadas con la card', () => {
    it('el cuerpo va en gris-800, no en negro puro', () => {
      const datos = styles.match(/\.reservation-data\s*\{([\s\S]*?)\n\s{8}\./)?.[1] ?? ''
      expect(datos).toMatch(/text-gray-800/)
      expect(datos).not.toMatch(/text-black/)
    })

    it('las etiquetas se callan en color, pero Recogida y Entrega van en negrilla', () => {
      const recogida = styles.match(/\.pickup-location-label[\s\S]{0,120}?\{([\s\S]*?)\}/)?.[1] ?? ''
      const alquiler = styles.match(/\.renting-label\s*\{([\s\S]*?)\}/)?.[1] ?? ''
      // El gris-600 se mantiene: lo que las separaba del resto era el color,
      // no el peso. La negrilla las marca como cabecera de cada tramo sin
      // devolverlas al gris-900 que competía con el nombre del vehículo.
      expect(recogida).toMatch(/text-gray-600/)
      expect(recogida).toMatch(/font-bold/)
      // "Alquiler:" no encabeza un tramo con dos renglones, así que se queda en
      // peso normal.
      expect(alquiler).toMatch(/text-gray-600/)
      expect(alquiler).not.toMatch(/font-bold/)
    })

    it('el cierre recupera el gris-800 que perdió al salir del desglose', () => {
      // Al colgarlo de la raíz dejó de heredar el text-gray-800 de
      // .contenedor-precios-tarifa y su "Total a pagar" quedaba en gris-900,
      // un tono más oscuro que el mismo label en la card.
      const regla = styles.match(/\.cierre-precio\s*\{([\s\S]*?)\n\s{4}\}/)?.[1] ?? ''
      expect(regla).toMatch(/text-gray-800/)
    })
  })

  it('la píldora de pico y placa va amarilla, como en la card', () => {
    // Iba en verde (#a3f78b), el mismo color que el pill de descuento y el CTA:
    // tres cosas distintas con el mismo código de color. La card ya la resuelve
    // en amarillo y ese es el token que manda.
    const cardPill = categoryStyles.match(/\.etiqueta-sin-pico-placa\s*\{([\s\S]*?)\}/)?.[1] ?? ''
    expect(cardPill).toMatch(/bg-yellow-300\/50/)
    const pill = styles.match(/\.category-picoyplaca\s*\{([\s\S]*?)\n\s{8}\}/)?.[1] ?? ''
    expect(pill).toMatch(/bg-yellow-300\/50/)
    expect(source).not.toMatch(/#a3f78b/)
    expect(source).not.toMatch(/text-green-900/)
  })

  it('no queda ni un texto rojo en el panel', () => {
    // Gama, "Recogida:", "Entrega:" y "Alquiler:" iban todos en text-red-700 y
    // competían entre sí; el rojo se reserva para la marca, no para etiquetas.
    // Se miran los estilos aplicados, no los comentarios que explican el cambio.
    const sinComentarios = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(sinComentarios(styles)).not.toMatch(/text-red-\d{3}/)
    expect(sinComentarios(source.replace(/<!--[\s\S]*?-->/g, ''))).not.toMatch(/text-red-\d{3}/)
  })
})

describe('ReservationResume — la píldora de descuento también aparece en mensual', () => {
  it('la compuerta mira el ahorro calculado, no discountAmount', () => {
    for (const archivo of [source, card]) {
      expect(archivo).toMatch(/class="porcentaje-descuento" v-if="hasDiscountToShow"/)
      expect(archivo).not.toMatch(/class="porcentaje-descuento" v-if="hasDiscount\(\)"/)
    }
  })
})
