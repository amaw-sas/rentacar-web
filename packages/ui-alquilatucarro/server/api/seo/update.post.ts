import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { isGscConnected, queryGscSearchAnalytics, queryGscSearchAnalyticsWithFilter } from '../../utils/gsc'

// City slugs to track
const CITY_SLUGS = [
  'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena',
  'bucaramanga', 'pereira', 'santa-marta', 'cucuta', 'ibague',
  'villavicencio', 'manizales', 'neiva', 'monteria', 'armenia',
  'valledupar', 'floridablanca', 'palmira', 'soledad'
]

interface UpdateResult {
  success: boolean
  updated: string[]
  errors: string[]
  data: {
    moz?: {
      domainAuthority?: number
      pageAuthority?: number
      spamScore?: number
      backlinksTotal?: number
      linkingDomains?: number
    }
    gsc?: {
      impressions?: number
      clicks?: number
      ctr?: number
      avgPosition?: number
    }
  }
  timestamp: string
}

export default defineEventHandler(async (event): Promise<UpdateResult> => {
  const body = await readBody(event)
  const services = body?.services || ['moz', 'gsc'] // Default: update all

  const result: UpdateResult = {
    success: true,
    updated: [],
    errors: [],
    data: {},
    timestamp: new Date().toISOString()
  }

  const dataDir = resolve(process.cwd(), 'server/data')

  // Read current data files
  const readJsonFile = (filename: string) => {
    try {
      const content = readFileSync(resolve(dataDir, filename), 'utf-8')
      return JSON.parse(content)
    } catch (e) {
      return null
    }
  }

  const writeJsonFile = (filename: string, data: object) => {
    try {
      writeFileSync(resolve(dataDir, filename), JSON.stringify(data, null, 2))
      return true
    } catch (e) {
      return false
    }
  }

  const tools = readJsonFile('tools.json')
  const today = new Date().toISOString().split('T')[0]

  // --- MOZ UPDATE ---
  if (services.includes('moz')) {
    try {
      // Check if Moz MCP is available
      if (!tools?.moz?.mcp?.installed) {
        result.errors.push('Moz MCP no instalado - usando datos simulados')
      }

      // Check quotas
      const mozQuotas = tools?.moz?.quotas?.domainOverview
      if (mozQuotas && mozQuotas.used >= mozQuotas.limit) {
        result.errors.push(`Moz quota agotada (${mozQuotas.used}/${mozQuotas.limit})`)
      } else {
        // For now, simulate Moz API response
        // In production, this would call the actual Moz API
        const mozData = {
          domainAuthority: 53,
          pageAuthority: 39,
          spamScore: 1,
          backlinksTotal: 6994,
          linkingDomains: 433,
          rootDomainsToRootDomain: 433
        }

        // Update metrics.json
        const metrics = readJsonFile('metrics.json')
        if (metrics) {
          metrics.current = {
            ...metrics.current,
            domainAuthority: mozData.domainAuthority,
            pageAuthority: mozData.pageAuthority,
            spamScore: mozData.spamScore,
            backlinksTotal: mozData.backlinksTotal,
            linkingDomains: mozData.linkingDomains,
            lastUpdated: today
          }

          if (writeJsonFile('metrics.json', metrics)) {
            result.updated.push('metrics.json')
            result.data.moz = mozData
          }
        }

        // Update quota usage
        if (tools && mozQuotas) {
          tools.moz.quotas.domainOverview.used += 1
          tools.lastUpdated = today
          writeJsonFile('tools.json', tools)
        }
      }
    } catch (error: any) {
      result.errors.push(`Moz error: ${error.message}`)
    }
  }

  // --- GSC UPDATE ---
  if (services.includes('gsc')) {
    try {
      // Check if GSC is connected via OAuth tokens
      const gscConnected = await isGscConnected()

      if (!gscConnected) {
        result.errors.push('GSC no conectado - usa el botón "Conectar GSC" para autorizar')
      } else {
        // Calculate date range (last 28 days)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 28)

        const siteUrl = tools?.gsc?.property || 'https://alquilatucarro.com'

        // Query real GSC API
        const gscResponse = await queryGscSearchAnalytics({
          siteUrl,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: 1000
        })

        if (!gscResponse) {
          result.errors.push('GSC API no disponible - token puede haber expirado')
        } else {
          // Aggregate data from all rows
          let totalClicks = 0
          let totalImpressions = 0
          let totalPosition = 0
          let rowCount = 0

          if (gscResponse.rows) {
            for (const row of gscResponse.rows) {
              totalClicks += row.clicks
              totalImpressions += row.impressions
              totalPosition += row.position
              rowCount++
            }
          }

          const gscData = {
            impressions: totalImpressions,
            clicks: totalClicks,
            ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
            avgPosition: rowCount > 0 ? Math.round((totalPosition / rowCount) * 10) / 10 : 0
          }

          // Update performance.json
          const performance = readJsonFile('performance.json')
          if (performance) {
            performance.gsc.last28d = {
              impressions: gscData.impressions,
              clicks: gscData.clicks,
              ctr: gscData.ctr,
              avgPosition: gscData.avgPosition
            }
            performance.gsc.lastUpdated = today

            // Fetch city pages data
            const cityPagesData: Array<{ city: string; clicks: number; impressions: number; ctr: number; position: number }> = []

            for (const city of CITY_SLUGS) {
              try {
                const cityResponse = await queryGscSearchAnalyticsWithFilter({
                  siteUrl,
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  dimensions: ['page'],
                  urlFilter: `/${city}`,
                  rowLimit: 1
                })

                const row = cityResponse?.rows?.[0]
                cityPagesData.push({
                  city,
                  clicks: row?.clicks || 0,
                  impressions: row?.impressions || 0,
                  ctr: row?.ctr ? Math.round(row.ctr * 10000) / 100 : 0,
                  position: row?.position ? Math.round(row.position * 10) / 10 : 0,
                })
              } catch {
                cityPagesData.push({ city, clicks: 0, impressions: 0, ctr: 0, position: 0 })
              }
            }

            // Sort by clicks descending
            performance.gsc.cityPages = cityPagesData.sort((a, b) => b.clicks - a.clicks)

            if (writeJsonFile('performance.json', performance)) {
              result.updated.push('performance.json')
              result.data.gsc = gscData
            }
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`GSC error: ${error.message}`)
    }
  }

  // Log activity
  try {
    const activity = readJsonFile('activity.json') || { entries: [] }
    activity.entries.unshift({
      id: Date.now().toString(),
      type: 'update',
      description: `Datos actualizados: ${result.updated.join(', ') || 'ninguno'}`,
      timestamp: result.timestamp,
      services: services,
      success: result.errors.length === 0
    })
    // Keep only last 50 entries
    activity.entries = activity.entries.slice(0, 50)
    writeJsonFile('activity.json', activity)
  } catch (e) {
    // Activity logging is optional
  }

  result.success = result.errors.length === 0

  return result
})
