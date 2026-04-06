/**
 * Google Search Console Data Fetcher
 *
 * Este script actualiza los datos de GSC en docs/seo/data/performance.json
 *
 * Requisitos:
 * 1. Configurar OAuth credentials (ver docs/seo/setup/gsc-oauth-setup.md)
 * 2. Instalar dependencias: pnpm add googleapis
 * 3. Ejecutar: npx ts-node docs/seo/tools/update-gsc-data.ts
 */

import { google } from 'googleapis'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const SITE_URL = 'sc-domain:alquilatucarro.com' // Domain property
const DATA_PATH = join(process.cwd(), 'docs/seo/data/performance.json')
const CREDENTIALS_PATH = join(process.cwd(), 'gsc-credentials.json')
const TOKEN_PATH = join(process.cwd(), '.gsc-token.json')

// City slugs to track
const CITY_SLUGS = [
  'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena',
  'bucaramanga', 'pereira', 'santa-marta', 'cucuta', 'ibague',
  'villavicencio', 'manizales', 'neiva', 'monteria', 'armenia',
  'valledupar', 'floridablanca', 'palmira', 'soledad'
]

interface GSCRow {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

interface PerformanceData {
  gsc: {
    last28d: {
      impressions: number | null
      clicks: number | null
      ctr: number | null
      avgPosition: number | null
    }
    previousPeriod: {
      impressions: number | null
      clicks: number | null
      ctr: number | null
    }
    topPages: Array<{
      page: string
      clicks: number
      impressions: number
      ctr: number
      position: number
    }>
    topQueries: Array<{
      query: string
      clicks: number
      impressions: number
      ctr: number
      position: number
    }>
    cityPages: Array<{
      city: string
      clicks: number
      impressions: number
      ctr: number
      position: number
    }>
    lastUpdated: string | null
    status: string
  }
  cwv: unknown
  indexation: unknown
}

async function getAuthClient() {
  if (!existsSync(CREDENTIALS_PATH)) {
    console.error('❌ Error: gsc-credentials.json not found')
    console.log('   Sigue la guía en docs/seo/setup/gsc-oauth-setup.md')
    process.exit(1)
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'))
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  // Check for existing token
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'))
    oauth2Client.setCredentials(token)
    return oauth2Client
  }

  // Need to authorize
  console.log('⚠️  No token found. Please authorize:')
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  console.log(`\n1. Open this URL: ${authUrl}`)
  console.log('\n2. After authorization, run this script with the code:')
  console.log('   GSC_AUTH_CODE=<your-code> npx ts-node scripts/seo/update-gsc-data.ts')
  process.exit(0)
}

async function fetchGSCData() {
  console.log('🔄 Fetching GSC data...')

  const auth = await getAuthClient()
  const searchconsole = google.searchconsole({ version: 'v1', auth })

  const today = new Date()
  const endDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago (data delay)
  const startDate28d = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000)
  const startDatePrev = new Date(startDate28d.getTime() - 28 * 24 * 60 * 60 * 1000)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  // Fetch last 28 days - overall metrics
  const overallResponse = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate28d),
      endDate: formatDate(endDate),
      dimensions: [],
    },
  })

  // Fetch previous 28 days for comparison
  const prevResponse = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDatePrev),
      endDate: formatDate(startDate28d),
      dimensions: [],
    },
  })

  // Fetch top queries
  const queriesResponse = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate28d),
      endDate: formatDate(endDate),
      dimensions: ['query'],
      rowLimit: 20,
    },
  })

  // Fetch top pages
  const pagesResponse = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: formatDate(startDate28d),
      endDate: formatDate(endDate),
      dimensions: ['page'],
      rowLimit: 20,
    },
  })

  // Fetch city pages data
  console.log('🏙️  Fetching city pages data...')
  const cityPagesData: Array<{ city: string; clicks: number; impressions: number; ctr: number; position: number }> = []

  for (const city of CITY_SLUGS) {
    try {
      const cityResponse = await searchconsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: formatDate(startDate28d),
          endDate: formatDate(endDate),
          dimensions: ['page'],
          dimensionFilterGroups: [{
            filters: [{
              dimension: 'page',
              operator: 'contains',
              expression: `/${city}`
            }]
          }],
          rowLimit: 1,
        },
      })

      const row = cityResponse.data.rows?.[0] as GSCRow | undefined
      cityPagesData.push({
        city,
        clicks: row?.clicks || 0,
        impressions: row?.impressions || 0,
        ctr: row?.ctr ? Math.round(row.ctr * 10000) / 100 : 0,
        position: row?.position ? Math.round(row.position * 10) / 10 : 0,
      })
    } catch (error) {
      console.log(`   ⚠️  Error fetching ${city}:`, error)
      cityPagesData.push({ city, clicks: 0, impressions: 0, ctr: 0, position: 0 })
    }
  }

  // Read existing data
  const existing: PerformanceData = JSON.parse(readFileSync(DATA_PATH, 'utf-8'))

  // Extract overall metrics
  const overallRow = overallResponse.data.rows?.[0] as GSCRow | undefined
  const prevRow = prevResponse.data.rows?.[0] as GSCRow | undefined

  // Update GSC data
  existing.gsc = {
    last28d: {
      impressions: overallRow?.impressions ?? null,
      clicks: overallRow?.clicks ?? null,
      ctr: overallRow?.ctr ? Math.round(overallRow.ctr * 10000) / 100 : null,
      avgPosition: overallRow?.position ? Math.round(overallRow.position * 10) / 10 : null,
    },
    previousPeriod: {
      impressions: prevRow?.impressions ?? null,
      clicks: prevRow?.clicks ?? null,
      ctr: prevRow?.ctr ? Math.round(prevRow.ctr * 10000) / 100 : null,
    },
    topQueries: (queriesResponse.data.rows as GSCRow[] || []).map(r => ({
      query: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr ? Math.round(r.ctr * 10000) / 100 : 0,
      position: r.position ? Math.round(r.position * 10) / 10 : 0,
    })),
    topPages: (pagesResponse.data.rows as GSCRow[] || []).map(r => ({
      page: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr ? Math.round(r.ctr * 10000) / 100 : 0,
      position: r.position ? Math.round(r.position * 10) / 10 : 0,
    })),
    cityPages: cityPagesData.sort((a, b) => b.clicks - a.clicks), // Sort by clicks descending
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'connected',
  }

  // Save updated data
  writeFileSync(DATA_PATH, JSON.stringify(existing, null, 2))

  console.log('✅ GSC data updated successfully!')
  console.log(`   Impressions: ${existing.gsc.last28d.impressions?.toLocaleString()}`)
  console.log(`   Clicks: ${existing.gsc.last28d.clicks?.toLocaleString()}`)
  console.log(`   CTR: ${existing.gsc.last28d.ctr}%`)
  console.log(`   Avg Position: ${existing.gsc.last28d.avgPosition}`)
  console.log(`   City pages: ${existing.gsc.cityPages.length}`)

  // Show top 5 cities by clicks
  const topCities = existing.gsc.cityPages.slice(0, 5)
  if (topCities.length > 0 && topCities[0].clicks > 0) {
    console.log('\n🏙️  Top 5 cities by clicks:')
    topCities.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.city}: ${c.clicks} clicks, pos ${c.position}`)
    })
  }
}

// Handle auth code if provided
async function handleAuthCode() {
  const authCode = process.env.GSC_AUTH_CODE
  if (!authCode) return false

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'))
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  const { tokens } = await oauth2Client.getToken(authCode)
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
  console.log('✅ Token saved successfully!')
  return true
}

// Main
async function main() {
  try {
    await handleAuthCode()
    await fetchGSCData()
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
