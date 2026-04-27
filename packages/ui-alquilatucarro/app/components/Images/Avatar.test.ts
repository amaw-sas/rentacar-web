import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Scenario: testimonial avatars must render at their native ~27×27 px.
 * Source webp files in packages/logic/public/images/avatares/ are 27×27.
 * Previously `h-full w-full` upscaled the bitmap ~6× → visible pixelation.
 * Lock a small fixed CSS size so no upscale happens.
 */
describe('Images/Avatar — testimonial avatar sizing', () => {
  const source = readFileSync(join(__dirname, 'Avatar.vue'), 'utf8')

  it('uses a fixed small size class (no full-container upscale)', () => {
    expect(source).toMatch(/class="[^"]*\bsize-7\b[^"]*"/)
    expect(source).not.toMatch(/\bh-full\s+w-full\b/)
  })

  it('declares intrinsic width/height to avoid CLS', () => {
    expect(source).toMatch(/width="27"/)
    expect(source).toMatch(/height="27"/)
  })
})
