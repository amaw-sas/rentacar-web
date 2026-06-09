import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Issue #108 holdout. Each brand must serve its OWN og:image:
// alquilame served a 404, alquicarros served alquilatucarro's image.
// "Done" = every brand's ogImage points to its own asset, the asset exists,
// is a valid 1200x630 JPEG, and the three assets are mutually distinct.

const ROOT = join(__dirname, '..', '..') // packages/

const EXPECTED: Record<string, string> = {
  alquilatucarro: '/img/og-alquilatucarro.jpg',
  alquilame: '/img/og-alquilame.jpg',
  alquicarros: '/img/og-alquicarros.jpg',
}

function readOgImage(brand: string): string {
  const file = join(ROOT, `ui-${brand}`, 'app', 'app.config.ts')
  const content = readFileSync(file, 'utf-8')
  const m = content.match(/ogImage:\s*"([^"]+)"/)
  if (!m) throw new Error(`ogImage not found in ${brand} app.config.ts`)
  return m[1]
}

function assetPath(brand: string, ogImage: string): string {
  return join(ROOT, `ui-${brand}`, 'public', ogImage)
}

/** Parse JPEG intrinsic dimensions from the SOF marker (no image deps). */
function jpegSize(buf: Buffer): { width: number; height: number } {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG')
  let o = 2
  while (o + 1 < buf.length) {
    if (buf[o] !== 0xff) {
      o++
      continue
    }
    const marker = buf[o + 1]
    // 0xFF fill bytes and standalone markers (SOI/EOI) carry no length segment.
    if (marker === 0xff) {
      o++
      continue
    }
    if (marker === 0xd8 || marker === 0xd9) {
      o += 2
      continue
    }
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 carry dimensions
    const isSOF =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    if (isSOF) {
      if (o + 8 >= buf.length) break
      const height = buf.readUInt16BE(o + 5)
      const width = buf.readUInt16BE(o + 7)
      return { width, height }
    }
    if (o + 3 >= buf.length) break
    const len = buf.readUInt16BE(o + 2)
    if (len < 2) break // malformed segment length would not advance the cursor
    o += 2 + len
  }
  throw new Error('no SOF marker found')
}

describe('og:image per brand (issue #108)', () => {
  // SCEN-001 / SCEN-002 / SCEN-003
  for (const [brand, expected] of Object.entries(EXPECTED)) {
    it(`${brand}: ogImage points to its own asset and resolves to a 1200x630 JPEG`, () => {
      const ogImage = readOgImage(brand)
      expect(ogImage).toBe(expected)
      // must reference its own brand, never another brand's image
      expect(ogImage).toContain(`og-${brand}.jpg`)

      const file = assetPath(brand, ogImage)
      expect(existsSync(file), `${file} must exist (no 404)`).toBe(true)
      const { width, height } = jpegSize(readFileSync(file))
      expect({ width, height }).toEqual({ width: 1200, height: 630 })
    })
  }

  // SCEN-004 — the three OG assets are mutually distinct (no brand reuses another's)
  it('the three brand OG assets are mutually distinct', () => {
    const buffers = Object.entries(EXPECTED).map(([brand, ogImage]) =>
      readFileSync(assetPath(brand, ogImage)),
    )
    for (let i = 0; i < buffers.length; i++) {
      for (let j = i + 1; j < buffers.length; j++) {
        expect(buffers[i].equals(buffers[j])).toBe(false)
      }
    }
  })
})
