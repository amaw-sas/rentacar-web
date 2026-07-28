// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import HeroVisual from '../HeroVisual.vue'
import { parseImageQualityConfig } from '../../../../tests/nuxt-image-quality'

const ROOT = join(__dirname, '..', '..', '..', '..')
const { defaultQuality, allowedQualities } = parseImageQualityConfig(
  readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8'),
)

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void

let observerCallback: ObserverCallback
let idleCallback: (() => void) | undefined

class IntersectionObserverMock {
  constructor(callback: ObserverCallback) {
    observerCallback = callback
  }

  observe = vi.fn()
  disconnect = vi.fn()
}

const NuxtImgStub = defineComponent({
  name: 'NuxtImg',
  inheritAttrs: false,
  props: {
    src: String,
    alt: String,
    width: String,
    height: String,
    sizes: String,
    quality: String,
  },
  setup(props, { attrs }) {
    return () => h('img', { ...attrs, ...props })
  },
})

function mountVisual() {
  return mount(HeroVisual, {
    global: {
      stubs: { NuxtImg: NuxtImgStub },
    },
  })
}

function renderVisualSsr() {
  const app = createSSRApp(HeroVisual)
  app.component('NuxtImg', NuxtImgStub)
  return renderToString(app)
}

beforeEach(() => {
  idleCallback = undefined
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: false, effectiveType: '4g' },
  })
  window.requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
    idleCallback = () => callback({ didTimeout: false, timeRemaining: () => 50 })
    return 1
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(window, 'requestIdleCallback')
  Reflect.deleteProperty(navigator, 'connection')
})

describe('HeroVisual.vue media loading', () => {
  it('renders poster-only SSR and mounted first paint with no eager media URL', async () => {
    const html = await renderVisualSsr()

    expect(html).toContain('/videos/hero-poster.jpg')
    expect(html).not.toMatch(/<video\b/)
    expect(html).not.toMatch(/<source\b/)
    expect(html).not.toContain('/videos/hero.mp4')
    expect(html).not.toContain('/videos/hero-audio.mp4')

    const wrapper = mountVisual()
    const carAttributes = wrapper.get('img[src="/images/carro_hero.webp"]').attributes()

    expect(carAttributes).toMatchObject({
      alt: 'SUV disponible para alquilar en Colombia con Alquilame',
      width: '1199',
      height: '678',
      sizes: 'sm:100vw lg:50vw xl:576px',
      densities: 'x1',
      fetchpriority: 'high',
    })
    expect(carAttributes).not.toHaveProperty('quality')
    expect(carAttributes).not.toHaveProperty('format')
    expect(allowedQualities).toContain(defaultQuality)
    expect(wrapper.get('img[src="/videos/hero-poster.jpg"]')).toBeTruthy()
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('/videos/hero.mp4')
    expect(wrapper.html()).not.toContain('/videos/hero-audio.mp4')
  })

  it('creates the muted autoplay source after visibility and idle without interaction', async () => {
    const wrapper = mountVisual()

    observerCallback([{ isIntersecting: true }])
    await nextTick()
    expect(wrapper.find('video').exists()).toBe(false)
    expect(idleCallback).toBeTypeOf('function')
    expect(window.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 2500 })

    idleCallback?.()
    await nextTick()

    const preview = wrapper.get('video[aria-label*="silenciado"]')
    expect(preview.attributes()).toMatchObject({
      autoplay: '',
      muted: '',
      loop: '',
      playsinline: '',
      preload: 'metadata',
    })
    expect((preview.element as HTMLVideoElement).muted).toBe(true)
    expect((preview.element as HTMLVideoElement).autoplay).toBe(true)
    expect(preview.get('source').attributes('src')).toBe('/videos/hero.mp4')
  })

  it('loads and plays the audio video only after the sound interaction', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const wrapper = mountVisual()

    await wrapper.get('button[aria-label="Activar sonido del video"]').trigger('click')
    await nextTick()

    expect(wrapper.html()).not.toContain('/videos/hero.mp4')
    const audio = wrapper.get('video[aria-label*="con audio"]')
    expect(audio.attributes()).toMatchObject({ controls: '', preload: 'none' })
    expect(audio.get('source').attributes('src')).toBe('/videos/hero-audio.mp4')
    expect(play).toHaveBeenCalledOnce()
  })
})
