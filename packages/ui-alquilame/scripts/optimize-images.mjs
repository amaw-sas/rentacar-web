#!/usr/bin/env node
/**
 * optimize-images.mjs — brand asset optimization convention for alquilame (F0).
 *
 * Reusable by F1/F2 when the heavy section assets (ventajas ~1.6 MB,
 * cta ~2.5 MB, hero, cities, vehicles) land with their consuming phase.
 * F0 only establishes the tooling; no heavy asset is committed here.
 *
 * Uses `sharp@^0.34.5` (the repo version — NOT sharp@^4), also pulled in by @nuxt/image.
 *
 * Capabilities:
 *   - pngToWebp(src, dest?)  PNG → webp, reports byte weight, warns over the 500 KB
 *                            critical-path threshold.
 *   - svgToPng(src, dest, { width }) SVG → PNG raster (used by step 05 for og-logo.png).
 *
 * CLI usage (F1/F2):
 *   node scripts/optimize-images.mjs webp  <input.png> [output.webp]
 *   node scripts/optimize-images.mjs svg2png <input.svg> <output.png> [width]
 *
 * Programmatic usage:
 *   import { pngToWebp, svgToPng } from './scripts/optimize-images.mjs'
 *   await svgToPng('/tmp/.../logo.svg', 'public/images/brand/og-logo.png', { width: 512 })
 */
import sharp from 'sharp'
import { stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'

/** Critical-path size budget; assets above this get a console warning. */
export const WEIGHT_WARN_BYTES = 500 * 1024

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function reportWeight(label, dest) {
  const { size } = await stat(dest)
  const over = size > WEIGHT_WARN_BYTES
  const flag = over ? '  ⚠ over 500 KB critical-path budget' : ''
  console.log(`${label} → ${dest} (${formatBytes(size)})${flag}`)
  return { size, over }
}

/**
 * Convert a PNG (or any sharp-readable raster) to webp and report the result weight.
 * @param {string} src   input image path
 * @param {string} [dest] output .webp path (defaults to src with .webp extension)
 * @param {{ quality?: number }} [opts]
 * @returns {Promise<{ dest: string, size: number, over: boolean }>}
 */
export async function pngToWebp(src, dest, opts = {}) {
  const out = dest ?? src.replace(new RegExp(`${extname(src)}$`), '.webp')
  await sharp(src)
    .webp({ quality: opts.quality ?? 80 })
    .toFile(out)
  const { size, over } = await reportWeight(`webp  ${basename(src)}`, out)
  return { dest: out, size, over }
}

/**
 * Rasterize an SVG to PNG at a target width (height auto from aspect-ratio).
 * @param {string} src   input .svg path
 * @param {string} dest  output .png path
 * @param {{ width?: number }} [opts]
 * @returns {Promise<{ dest: string, size: number }>}
 */
export async function svgToPng(src, dest, opts = {}) {
  await sharp(src)
    .resize({ width: opts.width ?? 512 })
    .png()
    .toFile(dest)
  const { size } = await reportWeight(`svg2png ${basename(src)}`, dest)
  return { dest, size }
}

// CLI entry — only runs when invoked directly, not on import.
const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (invokedDirectly) {
  const [cmd, src, dest, width] = process.argv.slice(2)
  try {
    if (cmd === 'webp') {
      if (!src) throw new Error('usage: optimize-images.mjs webp <input.png> [output.webp]')
      await pngToWebp(src, dest)
    } else if (cmd === 'svg2png') {
      if (!src || !dest) throw new Error('usage: optimize-images.mjs svg2png <input.svg> <output.png> [width]')
      await svgToPng(src, dest, { width: width ? Number(width) : undefined })
    } else {
      console.error('unknown command. use "webp" or "svg2png".')
      process.exit(1)
    }
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}
