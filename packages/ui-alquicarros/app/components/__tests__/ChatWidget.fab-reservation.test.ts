import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../../../..', import.meta.url))
const brandWidgets = ['ui-alquicarros', 'ui-alquilame', 'ui-alquilatucarro'].map(
  brand => ({
    brand,
    source: readFileSync(
      `${repoRoot}/packages/${brand}/app/components/ChatWidget.vue`,
      'utf8',
    ),
  }),
)
const searchStore = readFileSync(
  `${repoRoot}/packages/logic/src/stores/useStoreSearchData.ts`,
  'utf8',
)

// Toda la superficie `app/` de cada marca, para poder BUSCAR el escritor en vez
// de darlo por sabido. La lista de escritores era fija —alquilame y
// alquilatucarro— mientras la de lectores eran las tres marcas, así que
// alquicarros leía `reservationOverlayOpen` sin que nadie lo escribiera y el
// guardia no se enteraba: su FAB se pintaba sobre el CTA del wizard. Se deriva
// del lector para que "lector sin escritor" no pueda volver en silencio.
const readdirSync = (await import('node:fs')).readdirSync
function brandSources(brand: string): { file: string, source: string }[] {
  const out: { file: string, source: string }[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') continue
        walk(full)
      }
      else if (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) {
        out.push({ file: full.slice(repoRoot.length), source: readFileSync(full, 'utf8') })
      }
    }
  }
  walk(`${repoRoot}/packages/${brand}/app`)
  return out
}

describe('FAB de contacto móvil durante la solicitud', () => {
  it('mantiene los canales abajo a la derecha sin elevarlos en reservas', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toMatch(
        /class="contact-fab-stack absolute right-6 flex flex-col items-end/,
      )
      expect(source, brand).toContain('.contact-fab-stack { bottom: 1.5rem; }')
      expect(source, brand).not.toContain('contact-fab-stack--reservation')
    }
  })

  it('oculta ambos canales sólo en móvil mientras el overlay está abierto', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toContain(
        'v-if="(chatEnabled || whatsappVisible) && !hideContactButtons"',
      )
      expect(source, brand).toMatch(
        /const \{ reservationOverlayOpen \} = storeToRefs\(useStoreSearchData\(\)\)/,
      )
      // Se oculta en TODO viewport mientras el overlay está abierto: el pie del
      // slideover ya trae su propio CTA de WhatsApp, y ocultar siempre cubre por
      // definición la banda donde la barra inferior del wizard de alquicarros
      // ocupa el ancho completo. Sin condición de viewport que pueda dejar hueco.
      expect(source, brand).toMatch(
        /const hideContactButtons = computed\(\(\) => reservationOverlayOpen\.value\)/,
      )
      expect(source, brand).toContain("'Abrir Chat 24 horas'")
      expect(source, brand).toContain('aria-label="Abrir WhatsApp"')
    }
  })

  it('el store expone la bandera compartida', () => {
    expect(searchStore).toContain('const reservationOverlayOpen = ref<boolean>(false)')
    expect(searchStore).toMatch(/return \{[\s\S]*reservationOverlayOpen,/)
  })

  // CADA marca que LEE la bandera tiene que tener quien la ESCRIBA. El mecanismo
  // puede diferir —alquilame y alquilatucarro la publican desde el watch del
  // slideover; alquicarros, desde el ciclo de vida del resumen del wizard, que
  // es cuando su barra inferior está en pantalla— pero la pareja encender/apagar
  // no es opcional: sin ella el FAB nunca se aparta y tapa el CTA.
  for (const { brand } of brandWidgets) {
    it(`${brand}: la bandera que su ChatWidget lee tiene escritor propio`, () => {
      const sources = brandSources(brand).filter(
        ({ file }) => !file.endsWith('ChatWidget.vue'),
      )

      const turnsOn = sources.filter(({ source }) =>
        /reservationOverlayOpen\.value = (true|open)\b/.test(source),
      )
      expect(
        turnsOn.map(({ file }) => file),
        `${brand}: su ChatWidget LEE reservationOverlayOpen y ninguna pantalla de `
        + `la marca la enciende. El FAB no se apartará del CTA de reserva.`,
      ).not.toHaveLength(0)

      const turnsOff = sources.filter(({ source }) =>
        /reservationOverlayOpen\.value = false/.test(source),
      )
      expect(
        turnsOff.map(({ file }) => file),
        `${brand}: la enciende pero nunca la apaga — el FAB quedaría oculto para `
        + `siempre al salir del flujo de reserva.`,
      ).not.toHaveLength(0)
    })
  }
})
