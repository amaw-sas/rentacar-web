import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

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
    expect(detailPage).toContain('sizes="xs:100vw xxl:1280px"')
    expect(detailPage).not.toContain('sizes="100vw"')
    expect(detailPage).toContain('aspect-[5/2]')
  })
})

describe('PERF-6 — versioned responsive decorative images', () => {
  const heroCar = source('../Images/HeroCar.vue')
  const monthlyTeaser = source('../MonthlyRatesTeaser.vue')

  it('uses versioned Vite imports with NuxtImg instead of CSS URLs', () => {
    for (const component of [heroCar, monthlyTeaser]) {
      expect(component).toContain('<NuxtImg')
      expect(component).toContain('~/assets/images/')
      expect(component).not.toMatch(/background-image\s*:/)
      expect(component).not.toMatch(/url\(['"]?\/images\//)
    }
    expect(heroCar).toContain('v-if="isMounted && isDesktop"')
  })
})

describe('CLS safeguards', () => {
  const carousel = source('../Carrusel.vue')
  const chatWidget = source('../ChatWidget.vue')
  const chatConversation = source('../ChatConversation.vue')
  const defaultLayout = source('../../layouts/default.vue')
  const nuxtConfig = source('../../../nuxt.config.ts')

  it('reserves the final header height in critical CSS before the main bundle loads', () => {
    expect(defaultLayout).toMatch(/<UHeader[\s\S]*?class="[^"]*\bh-16\b/)
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

  it('uses transform/opacity keyframes for FAB and teaser entrances', () => {
    expect(chatWidget).toMatch(/@keyframes chip-glow \{[\s\S]*?transform: scale/)
    expect(chatWidget).toMatch(/@keyframes pulse-attention \{[\s\S]*?transform: scale/)
    expect(chatWidget).toMatch(/@keyframes teaser-pop \{[\s\S]*?transform: scale/)

    for (const animation of ['chip-glow', 'pulse-attention', 'teaser-pop']) {
      const keyframes = chatWidget.match(new RegExp(`@keyframes ${animation} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ''
      expect(keyframes).not.toContain('box-shadow')
      expect(keyframes).not.toMatch(/\b(top|right|bottom|left|width|height|margin|padding):/)
    }
  })

  it('reserves the proactive teaser geometry before either message appears', () => {
    expect(chatWidget).toContain('class="teaser-slot"')
    expect(chatWidget).toContain('class="teaser-bubble teaser-sizer"')
    expect(chatWidget).toContain(':key="teaserStep"')
    expect(chatWidget).toContain('ref="teaserCloseEl"')
    expect(chatWidget).toContain("teaserCloseEl.value?.focus({ preventScroll: true })")
    expect(chatWidget).toMatch(/\.teaser-sizer \{[\s\S]*?visibility: hidden;/)
  })

  it('keeps the inline chat availability pulse on the compositor', () => {
    const keyframes = chatConversation.match(/@keyframes cc-chip-glow \{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(keyframes).toContain('transform: scale')
    expect(keyframes).toContain('opacity:')
    expect(keyframes).not.toContain('box-shadow')
  })
})
