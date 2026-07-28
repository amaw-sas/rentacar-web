import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const src = readFileSync(
  fileURLToPath(new URL('../WizardSummary.vue', import.meta.url)),
  'utf8',
)

/**
 * F0 finding: WizardSummary wrote `reservationOverlayOpen = true` on mount with
 * no viewport condition. The ChatWidget hides the whole contact stack on EVERY
 * viewport while that flag is on, but the bottom CTA bar the FAB must dodge is
 * `lg:hidden` — it only exists below 1024px. Net effect on desktop: alquicarros
 * lost chat, WhatsApp and phone during the entire booking funnel, dodging a bar
 * that was not on screen. The flag must follow the viewport that shows the bar.
 */
describe('WizardSummary — the overlay flag follows the mobile bar viewport', () => {
  it('gates the write on the same 1024px breakpoint as the lg:hidden bar', () => {
    expect(src).toContain("useMediaQuery('(min-width: 1024px)')")
    expect(src).toMatch(/reservationOverlayOpen\.value = !isWideViewport\.value/)
  })

  it('no longer writes true unconditionally on mount', () => {
    expect(src).not.toContain('onMounted(() => { reservationOverlayOpen.value = true })')
  })

  it('still releases the flag on unmount', () => {
    expect(src).toMatch(/onBeforeUnmount\(\(\) => \{[\s\S]*reservationOverlayOpen\.value = false/)
  })
})
