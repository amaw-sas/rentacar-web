import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scenario captured: return-date picker accepted dates BEFORE the selected
// pickup date because Searcher.vue bound `:min-value="minPickupDate"` (a
// constant "today" floor) to the return calendar. With pickup set to a future
// day (e.g. May 10) the user could still land on May 1–9 — either by clicking
// a grid day or editing the day spinbutton — and BUSCAR VEHÍCULOS navigated
// with fechaRecogida > fechaDevolucion, producing "no disponible" for every
// category.
//
// Fix (minimum, replicated across all three brands): each Searcher.vue now
// derives a local `minReturnDate` computed whose floor tracks
// `selectedPickupDate` (falling back to `minPickupDate` when no pickup is
// selected), and binds the return picker's min to it. Source-level test
// avoids booting Nuxt/Pinia for template bindings.

const BRANDS = ['ui-alquilatucarro', 'ui-alquicarros', 'ui-alquilame'] as const

function readSearcher(brand: (typeof BRANDS)[number]): string {
  return readFileSync(
    fileURLToPath(
      new URL(`../../../../${brand}/app/components/Searcher.vue`, import.meta.url),
    ),
    'utf8',
  )
}

function extractBlock(source: string, startNeedle: string, endNeedle: string): string {
  const start = source.indexOf(startNeedle)
  expect(start).toBeGreaterThan(-1)
  const end = source.indexOf(endNeedle, start)
  expect(end).toBeGreaterThan(-1)
  return source.slice(start, end + endNeedle.length)
}

describe.each(BRANDS)(
  '%s Searcher — return picker min floor tracks selected pickup',
  (brand) => {
    const source = readSearcher(brand)

    it('declares a minReturnDate computed that falls back to minPickupDate when no pickup is selected', () => {
      const match = source.match(
        /const minReturnDate = computed<[^>]+>\(\(\) =>\s*([\s\S]*?)\);/,
      )
      expect(match).not.toBeNull()
      const body = match![1]
      expect(body).toContain('selectedPickupDate.value')
      expect(body).toContain('minPickupDate.value')
      expect(body).toMatch(/selectedPickupDate\.value\s*(\?\?|\?)/)
    })

    it('binds the desktop return u-input-date min-value to minReturnDate, not minPickupDate', () => {
      const returnInput = extractBlock(source, 'id="return-date"', '</u-input-date>')
      expect(returnInput).toContain(':min-value="minReturnDate"')
      expect(returnInput).not.toMatch(/:min-value="minPickupDate"/)
    })

    it('binds the desktop return u-calendar min-value to minReturnDate, not minPickupDate', () => {
      const returnInput = extractBlock(source, 'id="return-date"', '</u-input-date>')
      const calendarBlock = extractBlock(returnInput, '<u-calendar', '/>')
      expect(calendarBlock).toContain(':min-value="minReturnDate"')
      expect(calendarBlock).not.toMatch(/:min-value="minPickupDate"/)
    })

    it('binds the mobile return <input type="date"> min to minReturnDate, not minPickupDate', () => {
      const mobileInput = extractBlock(source, 'id="return-date-mobile"', '>')
      expect(mobileInput).toContain(':min="minReturnDate.toString()"')
      expect(mobileInput).not.toMatch(/:min="minPickupDate\.toString\(\)"/)
    })
  },
)
