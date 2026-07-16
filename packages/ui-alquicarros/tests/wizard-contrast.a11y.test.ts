import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../app/components/wizard')

const FILES = [
  'WizardSummary.vue',
  'WizardVehicleCard.vue',
  'VehicleSegmentTile.vue',
  'steps/StepCoverage.vue',
]

describe('SCEN-322-A04 — wizard price/notice text contrast on white', () => {
  for (const rel of FILES) {
    it(`${rel} does not use text-gray-400 for body copy`, () => {
      const src = readFileSync(resolve(root, rel), 'utf8')
      expect(src).not.toMatch(/text-gray-400/)
    })
  }
})
