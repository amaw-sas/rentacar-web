import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { CLARITY_FALLBACK_DELAY_MS, deferredClarityBootstrap } from '../deferredClarity'

type Listener = () => void

interface FakeScript {
  async?: boolean
  dataset: Record<string, string>
  src?: string
}

const PACKAGES = join(__dirname, '..', '..', '..', '..')

function createHarness(projectId = 'abc123', readyState: 'loading' | 'complete' = 'loading') {
  const listeners = new Map<string, Set<Listener>>()
  const appendedScripts: FakeScript[] = []
  const timers: Array<{ callback: Listener, delay: number }> = []

  const fakeWindow = {
    clarity: undefined as undefined | ((...args: unknown[]) => void) & { q?: unknown[] },
    addEventListener: vi.fn((name: string, listener: Listener) => {
      const registered = listeners.get(name) ?? new Set<Listener>()
      registered.add(listener)
      listeners.set(name, registered)
    }),
    removeEventListener: vi.fn((name: string, listener: Listener) => {
      listeners.get(name)?.delete(listener)
    }),
    setTimeout: vi.fn((callback: Listener, delay: number) => {
      timers.push({ callback, delay })
      return timers.length
    }),
    clearTimeout: vi.fn(),
  }

  const fakeDocument = {
    readyState,
    querySelector: vi.fn(() => appendedScripts[0] ?? null),
    createElement: vi.fn((): FakeScript => ({ dataset: {} })),
    head: { appendChild: vi.fn((script: FakeScript) => appendedScripts.push(script)) },
  }

  runInNewContext(deferredClarityBootstrap(projectId), { window: fakeWindow, document: fakeDocument })

  return {
    appendedScripts,
    emit(name: string) {
      for (const listener of [...(listeners.get(name) ?? [])]) listener()
    },
    fakeWindow,
    timers,
  }
}

describe('deferred Clarity bootstrap', () => {
  it.each([
    ['ui-alquilatucarro', 'yuw76trk8s'],
    ['ui-alquilame', 'yuw7k2nhpt'],
  ])('%s injects its own project id through the inline bootstrap', (brand, projectId) => {
    const config = readFileSync(join(PACKAGES, brand, 'nuxt.config.ts'), 'utf8')

    expect(config).toContain(`innerHTML: deferredClarityBootstrap('${projectId}')`)
    expect(config).not.toMatch(/src:\s*['"]https:\/\/www\.clarity\.ms/)
  })

  it('keeps alquicarros free of Clarity while it is under construction', () => {
    const config = readFileSync(join(PACKAGES, 'ui-alquicarros', 'nuxt.config.ts'), 'utf8')

    expect(config).not.toMatch(/clarity/i)
  })

  it('rejects ids that could break out of the inline script', () => {
    expect(() => deferredClarityBootstrap("x';alert(1)//")).toThrow()
  })

  it('queues early clarity() calls without loading the tag', () => {
    const harness = createHarness()

    harness.fakeWindow.clarity?.('set', 'brand', 'alquilame')

    expect(Array.from(harness.fakeWindow.clarity?.q?.[0] as ArrayLike<unknown>)).toEqual(['set', 'brand', 'alquilame'])
    expect(harness.appendedScripts).toHaveLength(0)
  })

  it.each(['pointerdown', 'touchstart', 'keydown', 'scroll'])(
    'loads the tag once on the first %s interaction',
    (interaction) => {
      const harness = createHarness('yuw7k2nhpt')

      harness.emit(interaction)
      harness.emit(interaction)
      harness.emit('scroll')

      expect(harness.appendedScripts).toHaveLength(1)
      expect(harness.appendedScripts[0]).toMatchObject({
        async: true,
        src: 'https://www.clarity.ms/tag/yuw7k2nhpt',
        dataset: { deferredClarity: '' },
      })
    },
  )

  it('falls back to loading four seconds after window.load', () => {
    expect(CLARITY_FALLBACK_DELAY_MS).toBe(4_000)
    const harness = createHarness()

    harness.emit('load')
    expect(harness.appendedScripts).toHaveLength(0)
    expect(harness.timers[0]?.delay).toBe(CLARITY_FALLBACK_DELAY_MS)

    harness.timers[0]?.callback()

    expect(harness.appendedScripts).toHaveLength(1)
  })
})
