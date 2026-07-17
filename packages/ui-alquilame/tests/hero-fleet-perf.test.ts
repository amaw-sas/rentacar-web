import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const hero = readFileSync(
  fileURLToPath(new URL('../app/components/home/Hero.vue', import.meta.url)),
  'utf8',
)
const fleet = readFileSync(
  fileURLToPath(new URL('../app/components/home/Fleet.vue', import.meta.url)),
  'utf8',
)

describe('SCEN-322-P01 — hero default paint is poster, not multi-MB autoplay', () => {
  it('renders NuxtImg poster on the default path', () => {
    expect(hero).toMatch(/NuxtImg/)
    expect(hero).toMatch(/hero-poster\.jpg/)
  })

  it('does not autoplay video until videoActive is set', () => {
    expect(hero).toMatch(/v-if="!videoActive"/)
    expect(hero).toMatch(/v-else/)
    // No bare autoplay outside the deferred branch as the only paint path.
    expect(hero).toMatch(/videoActive/)
  })

  it('prefers mp4 over heavier webm as the deferred source', () => {
    expect(hero).toMatch(/hero\.mp4/)
    expect(hero).not.toMatch(/hero\.webm/)
  })
})

describe('SCEN-322-P02 — fleet uses NuxtImg pipeline', () => {
  it('uses NuxtImg for vehicle cards, not raw img src JPEG', () => {
    expect(fleet).toMatch(/<NuxtImg/)
    expect(fleet).not.toMatch(/<img[\s\S]*:src="card\.image"/)
  })
})
