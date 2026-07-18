import { chromium } from 'playwright'

const baseURL = (process.env.CLS_BASE_URL ?? 'http://127.0.0.1:4178').replace(/\/$/, '')
const route = process.env.CLS_ROUTE ?? '/bogota/buscar-vehiculos/lugar-recogida/bogota-aeropuerto/lugar-devolucion/bogota-aeropuerto/fecha-recogida/2026-08-20/fecha-devolucion/2026-08-23/hora-recogida/12:00pm/hora-devolucion/12:00pm'
const maxInsertionShift = Number(process.env.CLS_MAX_INSERTION_SHIFT ?? '0.001')
const shouldAssert = process.env.CLS_ASSERT !== '0'
const settleMs = Number(process.env.CLS_SETTLE_MS ?? '4000')

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1461, height: 900 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

await page.addInitScript(() => {
  const rect = value => value
    ? {
        x: value.x,
        y: value.y,
        width: value.width,
        height: value.height,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        left: value.left,
      }
    : null

  window.__vehicleResultsLayoutShifts = []
  window.__vehicleResultsHandoffAt = null

  const observeResultsHandoff = () => {
    const recordLoadedResults = () => {
      if (
        window.__vehicleResultsHandoffAt === null
        && document.querySelector('[data-testid="vehicle-result-card-slot"], .categoria')
      ) {
        window.__vehicleResultsHandoffAt = performance.now()
      }
    }
    recordLoadedResults()
    new MutationObserver(recordLoadedResults).observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeResultsHandoff, { once: true })
  } else {
    observeResultsHandoff()
  }

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const sources = (entry.sources ?? []).map((source) => {
        const node = source.node instanceof Element ? source.node : null
        const className = typeof node?.className === 'string' ? node.className : ''
        // Attribute only the two reproduced regressions: the description root
        // being displaced by results-shell insertion, or geometry inside a
        // vehicle card. Descendants of #descripcion may move for unrelated
        // responsive/critical-CSS reasons and are intentionally not counted.
        const resultRelated = Boolean(
          node?.id === 'descripcion'
          || node?.closest('[data-testid="vehicle-results-shell"], .categoria'),
        )

        return {
          node: node?.id ? `#${node.id}` : className || node?.tagName || null,
          resultRelated,
          previousRect: rect(source.previousRect),
          currentRect: rect(source.currentRect),
        }
      })

      window.__vehicleResultsLayoutShifts.push({
        value: entry.value,
        hadRecentInput: entry.hadRecentInput,
        startTime: entry.startTime,
        sources,
      })
    }
  }).observe({ type: 'layout-shift', buffered: true })
})

const startedAt = Date.now()
const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' })
const serverHTML = response ? await response.text() : ''
await page.locator('[data-testid="category-solicitar-test"]').first().waitFor({
  state: 'visible',
  timeout: 45_000,
})
await page.waitForTimeout(settleMs)

const measurement = await page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector)
    if (!element) return null
    const value = element.getBoundingClientRect()
    return {
      x: value.x,
      y: value.y,
      width: value.width,
      height: value.height,
      top: value.top,
      right: value.right,
      bottom: value.bottom,
      left: value.left,
    }
  }

  const entries = window.__vehicleResultsLayoutShifts ?? []
  const noInputEntries = entries.filter(entry => !entry.hadRecentInput)
  const resultEntries = noInputEntries.filter(entry =>
    entry.sources.some(source => source.resultRelated),
  )
  const handoffAt = window.__vehicleResultsHandoffAt
  // Attribute the reproduced regression to the loading-to-results transition,
  // including async carousel paint immediately after card insertion. Earlier
  // critical-CSS movement remains visible in totalNoInputShift but is not a
  // result-list insertion regression.
  const insertionEntries = resultEntries.filter(entry =>
    handoffAt !== null
    && entry.startTime >= handoffAt - 100
    && entry.startTime <= handoffAt + 1000,
  )

  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      deviceScaleFactor: window.devicePixelRatio,
    },
    totalNoInputShift: noInputEntries.reduce((sum, entry) => sum + entry.value, 0),
    // Diagnostic only: a result node can be a source because an ancestor such
    // as the hero moved. listInsertionShift is the scoped regression metric.
    resultSourceShift: resultEntries.reduce((sum, entry) => sum + entry.value, 0),
    resultsHandoffAt: handoffAt,
    listInsertionShift: insertionEntries.reduce((sum, entry) => sum + entry.value, 0),
    entries,
    geometry: {
      resultsShell: rect('[data-testid="vehicle-results-shell"], #seleccion-categorias'),
      description: rect('#descripcion'),
      loadedCards: [...document.querySelectorAll('.categoria')].map((element) => {
        const value = element.getBoundingClientRect()
        return { width: value.width, height: value.height }
      }),
    },
  }
})

const output = {
  url: page.url(),
  status: response?.status() ?? null,
  elapsedMs: Date.now() - startedAt,
  threshold: maxInsertionShift,
  serverHTMLReservation: {
    hasResultsShell: serverHTML.includes('data-testid="vehicle-results-shell"'),
    placeholderCards: serverHTML.split('data-testid="vehicle-result-placeholder"').length - 1,
  },
  ...measurement,
}

console.log(JSON.stringify(output, null, 2))
await browser.close()

if (shouldAssert && output.listInsertionShift > maxInsertionShift) {
  console.error(
    `Vehicle-results insertion shift ${output.listInsertionShift} exceeds ${maxInsertionShift}`,
  )
  process.exitCode = 1
}
