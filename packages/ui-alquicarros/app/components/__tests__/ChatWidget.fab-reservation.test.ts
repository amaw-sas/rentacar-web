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
const slideoverSections = ['ui-alquilame', 'ui-alquilatucarro'].map(brand => ({
  brand,
  source: readFileSync(
    `${repoRoot}/packages/${brand}/app/components/CategorySelectionSection.vue`,
    'utf8',
  ),
}))
const searchStore = readFileSync(
  `${repoRoot}/packages/logic/src/stores/useStoreSearchData.ts`,
  'utf8',
)

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
        'v-if="(chatEnabled || whatsappVisible) && !hideContactButtonsOnMobile"',
      )
      expect(source, brand).toMatch(
        /const \{ reservationOverlayOpen \} = storeToRefs\(useStoreSearchData\(\)\)/,
      )
      expect(source, brand).toMatch(
        /const hideContactButtonsOnMobile = computed\([\s\S]*!isDesktop\.value && reservationOverlayOpen\.value/,
      )
      expect(source, brand).toContain("'Abrir Chat 24 horas'")
      expect(source, brand).toContain('aria-label="Abrir WhatsApp"')
    }
  })

  it('refleja la apertura y el cierre real del slideover en el store compartido', () => {
    expect(searchStore).toContain('const reservationOverlayOpen = ref<boolean>(false)')
    expect(searchStore).toMatch(/return \{[\s\S]*reservationOverlayOpen,/)

    for (const { brand, source } of slideoverSections) {
      expect(source, brand).toMatch(
        /watch\(\s*slideoverOpen,[\s\S]*reservationOverlayOpen\.value = open/,
      )
      expect(source, brand).toMatch(
        /onBeforeUnmount\(\(\) => \{[\s\S]*reservationOverlayOpen\.value = false/,
      )
    }
  })
})
