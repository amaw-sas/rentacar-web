import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFERRED_GTAG_BOOTSTRAP,
  GTAG_FALLBACK_DELAY_MS,
  GTAG_MEASUREMENT_ID,
} from '../utils/deferred-gtag'

type Listener = () => void

interface FakeScript {
  async?: boolean
  dataset: Record<string, string>
  src?: string
}

function createHarness(
  readyState: 'loading' | 'complete' = 'loading',
  initialDataLayer: unknown[] = [],
) {
  const listeners = new Map<string, Set<Listener>>()
  const appendedScripts: FakeScript[] = []
  const timers: Array<{ callback: Listener, delay: number, cleared: boolean }> = []

  const fakeWindow = {
    dataLayer: initialDataLayer,
    gtag: undefined as undefined | ((...args: unknown[]) => void),
    addEventListener: vi.fn((name: string, listener: Listener) => {
      const registered = listeners.get(name) ?? new Set<Listener>()
      registered.add(listener)
      listeners.set(name, registered)
    }),
    removeEventListener: vi.fn((name: string, listener: Listener) => {
      listeners.get(name)?.delete(listener)
    }),
    setTimeout: vi.fn((callback: Listener, delay: number) => {
      timers.push({ callback, delay, cleared: false })
      return timers.length
    }),
    clearTimeout: vi.fn((id: number) => {
      const timer = timers[id - 1]
      if (timer) timer.cleared = true
    }),
  }

  const fakeDocument = {
    readyState,
    querySelector: vi.fn(() => appendedScripts[0] ?? null),
    createElement: vi.fn((tagName: string): FakeScript => {
      if (tagName !== 'script') throw new Error('Unexpected element: ' + tagName)
      return { dataset: {} }
    }),
    head: {
      appendChild: vi.fn((script: FakeScript) => {
        appendedScripts.push(script)
        return script
      }),
    },
  }

  runInNewContext(DEFERRED_GTAG_BOOTSTRAP, {
    window: fakeWindow,
    document: fakeDocument,
  })

  return {
    appendedScripts,
    emit(name: string) {
      for (const listener of [...(listeners.get(name) ?? [])]) listener()
    },
    fakeDocument,
    fakeWindow,
    timers,
  }
}

describe('deferred GA4 bootstrap', () => {
  it('keeps only the inline bootstrap in Nuxt head, with no eager vendor script', () => {
    const config = readFileSync(join(__dirname, '..', 'nuxt.config.ts'), 'utf8')

    expect(config).toMatch(/innerHTML:\s*DEFERRED_GTAG_BOOTSTRAP/)
    expect(config).not.toMatch(
      /src:\s*['"]https:\/\/www\.googletagmanager\.com\/gtag\/js/,
    )
  })

  it('preserves the dataLayer and queues config plus events before gtag.js loads', () => {
    const priorEvent = { event: 'pre-bootstrap' }
    const harness = createHarness('loading', [priorEvent])
    const queuedCalls = harness.fakeWindow.dataLayer
      .slice(1)
      .map(call => Array.from(call as ArrayLike<unknown>))

    expect(harness.fakeWindow.dataLayer[0]).toBe(priorEvent)
    expect(queuedCalls[0]?.[0]).toBe('js')
    // The bootstrap runs in a VM realm, whose Date constructor is distinct
    // from Vitest's realm even though the queued value is a genuine Date.
    expect(Object.prototype.toString.call(queuedCalls[0]?.[1])).toBe('[object Date]')
    expect(queuedCalls[1]).toEqual([
      'config',
      GTAG_MEASUREMENT_ID,
      { send_page_view: false },
    ])

    harness.fakeWindow.gtag?.('event', 'page_view', { campaign: 'summer' })

    expect(
      Array.from(harness.fakeWindow.dataLayer.at(-1) as ArrayLike<unknown>),
    ).toEqual(['event', 'page_view', { campaign: 'summer' }])
    expect(harness.appendedScripts).toHaveLength(0)
  })

  it.each(['pointerdown', 'touchstart', 'keydown', 'scroll'])(
    'loads gtag.js once on the first %s interaction',
    interaction => {
      const harness = createHarness()

      expect(harness.appendedScripts).toHaveLength(0)
      harness.emit(interaction)
      harness.emit(interaction)
      harness.emit('scroll')

      expect(harness.appendedScripts).toHaveLength(1)
      expect(harness.appendedScripts[0]).toMatchObject({
        async: true,
        src: 'https://www.googletagmanager.com/gtag/js?id=' + GTAG_MEASUREMENT_ID,
        dataset: { deferredGtag: '' },
      })
    },
  )

  it('uses an eight-second post-load fallback when there is no interaction', () => {
    const harness = createHarness()

    harness.emit('load')
    expect(harness.appendedScripts).toHaveLength(0)
    expect(harness.timers).toHaveLength(1)
    expect(harness.timers[0]?.delay).toBe(GTAG_FALLBACK_DELAY_MS)

    harness.timers[0]?.callback()

    expect(harness.appendedScripts).toHaveLength(1)
  })
})
