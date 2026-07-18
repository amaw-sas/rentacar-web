const DEFAULT_BLOG_IMAGE_WIDTH = 1200

// Current post-cover exceptions. Most covers are 1200px wide; keeping the
// smaller originals explicit prevents Vercel from returning (for example) a
// 626px source under a false 640w/1280w descriptor.
const BLOG_IMAGE_WIDTHS: Record<string, number> = {
  '/img/blog/autopista-moderna.jpg': 626,
  '/img/blog/gps-navegacion-carro.jpg': 626,
  '/img/blog/tablero-navegacion-carro.jpg': 626,
  '/img/blog/viajar-carretera.jpg': 626,
  '/img/blog/precios-alquiler-carros.jpg': 1125,
  '/img/blog/precios-ciudad-colombia.jpg': 1125,
  '/img/blog/precios-roadtrip-carro.jpg': 1125,
}

function normalizedPath(src: string): string {
  return src.split(/[?#]/, 1)[0] ?? src
}

export function getBlogImageWidth(src: string): number {
  return BLOG_IMAGE_WIDTHS[normalizedPath(src)] ?? DEFAULT_BLOG_IMAGE_WIDTH
}

export function getBlogHeroSizes(src: string): string {
  const width = getBlogImageWidth(src)
  if (width === 626) return 'xs:100vw sm:626px'
  if (width === 1125) return 'xs:100vw sm:100vw md:100vw lg:100vw xl:1125px'
  return 'xs:100vw sm:100vw md:100vw lg:100vw xl:1200px'
}

export function getBlogFeaturedSizes(src: string): string {
  return getBlogImageWidth(src) === 1125
    ? 'xs:320px md:560px'
    : 'xs:320px md:600px'
}

export function getBlogFeaturedDensities(src: string): string {
  return getBlogImageWidth(src) >= 1125 ? '1x 2x' : '1x'
}

export function getBlogCardDensities(src: string): string {
  return getBlogImageWidth(src) >= 800 ? '1x 2x' : '1x'
}
