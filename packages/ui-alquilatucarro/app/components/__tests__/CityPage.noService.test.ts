import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Lo encontro la revision en navegador, no los tests: el aviso salia bien, y JUSTO ENCIMA seguia
// el encabezado del buscador — "Consulta disponibilidad y precios / Elige ciudades, fechas y
// horarios" — sobre un mensaje que dice que no alquilamos aqui. Se contradecian en la misma
// pantalla. Ningun test unitario podia verlo porque cada pieza, por separado, era correcta.

const src = readFileSync(
  resolve(process.cwd().endsWith('ui-alquilatucarro') ? process.cwd() : resolve(process.cwd(), 'packages/ui-alquilatucarro'), 'app/components/CityPage.vue'),
  'utf8',
)

describe('CityPage — aviso de ciudad sin servicio', () => {
  it('el encabezado del buscador se va con el buscador', () => {
    // Las dos apariciones (movil y escritorio) tienen que estar gateadas.
    const headings = src.split('Consulta disponibilidad y precios').length - 1
    expect(headings).toBe(2)
    const gated = src.split(/v-if="cityIsBookable"/).length - 1
    expect(gated).toBeGreaterThanOrEqual(2)
  })

  it('el aviso reemplaza el buscador en movil y en escritorio', () => {
    expect(src.split(/<CityNoService/).length - 1).toBe(2)
    expect(src).toMatch(/v-if="!cityIsBookable"/)
  })

  it('importa isBookable explicitamente, y como valor', () => {
    // El auto-import de Nuxt cubre los composables `use*`, no una funcion suelta de utils. Sin
    // esta linea la pagina daba 500 en SSR — la pagina que la feature existe para mantener viva.
    //
    // Se mira la LISTA de especificadores, no la forma literal de un import suelto: `isBookable`
    // puede compartir declaracion con otro valor del mismo modulo (asi lo exige
    // import/no-duplicates) sin que eso cambie nada. Lo que no vale es que desaparezca, que
    // cambie de modulo, ni que pase a ser de solo tipos: `import type { isBookable }` o
    // `{ type isBookable }` se borran al compilar y devolverian el 500. La primera forma no
    // casa con /import \{/ porque lleva `type` antes de la llave; la segunda la descarta el
    // segundo filtro.
    const declaraciones = src.match(/import \{([^}]*)\} from '@rentacar-main\/logic\/utils'/g) ?? []
    const comoValor = declaraciones.some(
      d => /\bisBookable\b/.test(d) && !/\btype\s+isBookable\b/.test(d),
    )
    expect(comoValor).toBe(true)
  })

  it('el aviso no va dentro de ClientOnly: una arana lo lee en el HTML servido', () => {
    // Se mira DENTRO de cada par <ClientOnly>...</ClientOnly>. Una ventana de N caracteres tras
    // el aviso no serviria: el buscador viene justo despues, con su propio ClientOnly, y el test
    // pasaria o fallaria segun el tamano de la ventana en vez de segun el anidamiento.
    const dentroDeClientOnly = src.match(/<ClientOnly>[\s\S]*?<\/ClientOnly>/g) ?? []
    expect(dentroDeClientOnly.length).toBeGreaterThan(0)
    for (const bloque of dentroDeClientOnly) {
      expect(bloque).not.toMatch(/CityNoService/)
    }
  })
})
