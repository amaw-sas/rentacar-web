import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { imageScreens } from '../../../image-screens'
import {
  getBlogCardDensities,
  getBlogFeaturedDensities,
  getBlogFeaturedSizes,
  getBlogHeroSizes,
  getBlogImageWidth,
} from '../../utils/blogResponsiveImages'

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

describe('PERF-5 — responsive blog images', () => {
  const indexPage = source('../../pages/blog/index.vue')
  const detailPage = source('../../pages/blog/[...slug].vue')

  it('routes all blog template images through NuxtImg', () => {
    expect(indexPage).not.toMatch(/<img\b/)
    expect(detailPage).not.toMatch(/<img\b/)
    expect(indexPage.match(/<NuxtImg\b/g)).toHaveLength(2)
    expect(detailPage.match(/<NuxtImg\b/g)).toHaveLength(4)
  })

  it('declares responsive sizes, WebP output, and fixed image geometry', () => {
    for (const page of [indexPage, detailPage]) {
      expect(page).toMatch(/sizes="[^"]+"/)
      expect(page).toContain('format="webp"')
      expect(page).toMatch(/width="\d+"/)
      expect(page).toMatch(/height="\d+"/)
    }
    expect(detailPage).toContain(':sizes="getBlogHeroSizes(post.image)"')
    expect(detailPage).not.toContain('sizes="100vw"')
    expect(detailPage).toContain('class="relative h-40 overflow-hidden"')
  })

  const screens = imageScreens as Record<string, number>

  function candidateWidths(sizes: string, densities: string): number[] {
    const widths = new Set<number>()
    for (const entry of sizes.split(/\s+/)) {
      const [key, size] = entry.split(':')
      const screen = screens[key!] ?? Number.parseInt(key!, 10)
      const cssWidth = size!.endsWith('vw')
        ? Math.round(Number.parseInt(size!, 10) / 100 * screen)
        : Number.parseInt(size!, 10)
      for (const density of densities.split(/\s+/).map(value => Number.parseInt(value, 10))) {
        widths.add(cssWidth * density)
      }
    }
    return [...widths].sort((a, b) => a - b)
  }

  it.each([
    '/img/blog/guatape-piedra.webp',
    '/img/blog/precios-alquiler-carros.jpg',
    '/img/blog/viajar-carretera.jpg',
  ])('keeps every %s candidate truthful and unique', (src) => {
    const intrinsicWidth = getBlogImageWidth(src)
    const candidates = [
      ...candidateWidths(getBlogHeroSizes(src), '1x'),
      ...candidateWidths(getBlogFeaturedSizes(src), getBlogFeaturedDensities(src)),
      ...candidateWidths('xs:320px md:400px', getBlogCardDensities(src)),
    ]

    expect(candidates.every(width => width <= intrinsicWidth)).toBe(true)
    expect(candidates.every(width => Object.values(imageScreens).includes(width as never))).toBe(true)

    const uniqueCandidates = [...new Set(candidates)]
    const providerUrls = uniqueCandidates.map(width => `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}`)
    expect(new Set(providerUrls).size).toBe(uniqueCandidates.length)
  })
})

describe('PERF-6 — responsive decorative images', () => {
  const heroCar = source('../Images/HeroCar.vue')
  const monthlyTeaser = source('../MonthlyRatesTeaser.vue')

  it('keeps the city hero at 480x239 with real 480w/960w optimizer candidates', () => {
    expect(heroCar).toContain('<NuxtImg')
    expect(heroCar).toContain('src="/images/hero/car.webp"')
    expect(heroCar).toContain('v-if="isMounted && isDesktop"')
    expect(heroCar).toContain('sizes="480px"')
    expect(heroCar).toContain('densities="1x 2x"')
    expect(heroCar).toMatch(/\.hero-car \{[\s\S]*?aspect-ratio: 1203 \/ 600;/)
    expect(heroCar).toMatch(/\.hero-car-image \{[\s\S]*?width: 100%;[\s\S]*?height: 100%;/)
    expect(Object.values(imageScreens)).toEqual(expect.arrayContaining([480, 960]))
  })

  it('keeps the confirmed-safe monthly teaser on its versioned NuxtImg path', () => {
    expect(monthlyTeaser).toContain('<NuxtImg')
    expect(monthlyTeaser).toContain('src="/images/monthly/teaser-suv-bogota-c5a.webp"')
    expect(monthlyTeaser).not.toMatch(/background-image\s*:/)
  })
})

describe('CLS safeguards', () => {
  const carousel = source('../Carrusel.vue')
  const categoryCard = source('../CategoryCard.vue')
  const categorySelection = source('../CategorySelectionSection.vue')
  const unableCategoryCard = source('../Placeholders/UnableCategoryCard.vue')
  const cityPage = source('../CityPage.vue')
  const chatWidget = source('../ChatWidget.vue')
  const chatConversation = source('../ChatConversation.vue')
  const defaultLayout = source('../../layouts/default.vue')
  const nuxtConfig = source('../../../nuxt.config.ts')

  it('reserves the final header height in critical CSS before the main bundle loads', () => {
    expect(defaultLayout).toMatch(/<(?:UHeader|header)[\s\S]*?class="[^"]*\bh-16\b/)
  })

  it('matches the blog hero breakpoint geometry in the critical CSS', () => {
    expect(nuxtConfig).toContain('html { line-height: 1.5; }')
    expect(nuxtConfig).toContain('h1, h2, h3, p { margin: 0; }')
    expect(nuxtConfig).toContain('.inset-x-0 { left: 0; right: 0; }')
    expect(nuxtConfig).toContain('.max-w-2xl { max-width: 42rem; }')
    expect(nuxtConfig).toContain('.sm\\\\:py-16')
    expect(nuxtConfig).toContain('.md\\\\:text-4xl')
    expect(nuxtConfig).toContain('.lg\\\\:py-24')
  })

  it('keeps carousel dot slots fixed and animates only the inner transform', () => {
    expect(carousel).toContain("dot: 'category-carousel-dot'")
    expect(carousel).not.toContain('data-[state=active]:w-6')
    expect(carousel).toMatch(/category-carousel-dot\) \{[\s\S]*?width: 0\.75rem;/)
    expect(carousel).toMatch(/transition: transform 300ms ease, background-color 300ms ease;/)
  })

  it('server-renders a full results-grid reservation on deep search routes', () => {
    expect(cityPage).toContain('data-testid="vehicle-results-shell"')
    expect(cityPage).toContain(':reserve-initial-results="isVehicleResultsRoute"')
    expect(cityPage).toMatch(/data-testid="vehicle-results-shell"[\s\S]*?<CategorySelectionSection/)
    expect(cityPage).toContain("route.path.includes('/buscar-vehiculos/')")
    expect(cityPage).toContain('isCategoryVisibleInCity(')
    expect(categorySelection).toContain("'vehicle-result-slot-loading'")
    expect(categorySelection).toContain("'min-h-[690px]' : 'min-h-[724px]'")
    expect(categorySelection).toContain(":style=\"{ minHeight: index < 6 ? '690px' : '724px' }\"")
    expect(categorySelection).toContain('style="min-height: 52px"')
    expect(categorySelection).toContain("'vehicle-result-placeholder' : 'vehicle-result-card-slot'")
    expect(categorySelection).toContain(':key="`vehicle-result-slot-${index}`"')
  })

  it('reserves the async carousel paint box before vehicle cards insert it', () => {
    expect(categoryCard).toContain('class="carrusel aspect-[5/3]"')
    expect(unableCategoryCard).toContain('class="carrusel aspect-[5/3]"')
  })

  it('preserves the established glow visuals while keeping the teaser entrance composited', () => {
    expect(chatWidget).toMatch(/@keyframes chip-glow \{[\s\S]*?box-shadow: 0 0 7px 2px/)
    expect(chatWidget).toMatch(/@keyframes pulse-attention \{[\s\S]*?0 0 0 14px/)
    expect(chatWidget).toMatch(/@keyframes teaser-pop \{[\s\S]*?transform: scale/)
    expect(chatWidget).not.toContain('.fab-chip-glow::after')
    expect(chatWidget).not.toContain('.animate-pulse-attention::after')
  })

  it('reserves the proactive teaser geometry before either message appears', () => {
    expect(chatWidget).toContain('class="teaser-slot"')
    expect(chatWidget).toContain('class="teaser-bubble teaser-sizer"')
    expect(chatWidget).toContain(':key="teaserStep"')
    expect(chatWidget).toContain('ref="teaserCloseEl"')
    expect(chatWidget).toContain("teaserCloseEl.value?.focus({ preventScroll: true })")
    expect(chatWidget).toMatch(/\.teaser-sizer \{[\s\S]*?visibility: hidden;/)
  })

  it('preserves the inline chat availability glow', () => {
    const keyframes = chatConversation.match(/@keyframes cc-chip-glow \{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(keyframes).toContain('box-shadow: 0 0 7px 2px rgba(34, 197, 94, 0.95)')
    expect(chatConversation).not.toContain('.cc-avatar-dot::after')
  })
})
