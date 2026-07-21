import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// WhatsApp visibility windows — widget wiring (S1/S2/S5/S4). The three brand
// widgets are byte-identical (enforced by ChatWidget.burbuja-mission E10), so the
// gate must be present and identical in all three.
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
const chatStatusSource = readFileSync(
  `${repoRoot}/packages/logic/src/composables/useChatStatus.ts`,
  'utf8',
)

describe('WhatsApp schedule gate — widget integration', () => {
  it('every widget derives whatsappVisible from useChatStatus', () => {
    for (const { brand, source } of brandWidgets) {
      expect(source, brand).toMatch(
        /const \{[^}]*whatsappVisible[^}]*\} = useChatStatus\(/,
      )
    }
  })

  it('every widget gates ONLY the WhatsApp option with whatsappVisible', () => {
    for (const { brand, source } of brandWidgets) {
      // The WhatsApp <li> carries the gate.
      expect(source, brand).toMatch(
        /<li v-if="whatsappVisible" class="flex">\s*<a\s+:href="franchise\.whatsapp"/,
      )
      // The Chat option keeps its own gate; the Call option stays ungated.
      expect(source, brand).toContain('<li v-if="chatEnabled"')
      expect(source, brand).toMatch(
        /<li class="flex">\s*<a\s+:href="`tel:\$\{franchise\.phone\}`"/,
      )
      // whatsappVisible must not leak onto Chat or Call.
      expect(source, brand).not.toMatch(/fab-call[\s\S]*v-if="whatsappVisible"/)
    }
  })

  it('the composable exposes a fail-open whatsappVisible ref and re-evaluates', () => {
    // Fail-open default: the button never disappears on a network error.
    expect(chatStatusSource).toMatch(/const whatsappVisible = ref\(true\)/)
    expect(chatStatusSource).toMatch(/return \{[^}]*whatsappVisible[^}]*\}/)
    // 60s re-evaluation timer + evaluation via the pure predicate.
    expect(chatStatusSource).toContain('setInterval(reevaluateWhatsapp, 60_000)')
    expect(chatStatusSource).toMatch(
      /whatsappVisible\.value = evaluateWhatsappVisibility\(/,
    )
  })
})
