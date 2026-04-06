import { getFirestoreDb } from './firebase'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const LOCAL_TOKENS_PATH = resolve(process.cwd(), 'server/data/.tokens/gsc-tokens.json')

interface GscTokens {
  access_token: string
  refresh_token?: string
  expires_at: number
  token_type: string
  scope: string
  created_at: string
}

interface GscSearchAnalyticsResponse {
  rows?: Array<{
    keys: string[]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  responseAggregationType?: string
}

const TOKENS_COLLECTION = 'seo_config'
const TOKENS_DOC = 'gsc_tokens'

export async function getGscTokens(): Promise<GscTokens | null> {
  // Try Firestore first
  try {
    const db = getFirestoreDb()
    const doc = await db.collection(TOKENS_COLLECTION).doc(TOKENS_DOC).get()

    if (doc.exists) {
      return doc.data() as GscTokens
    }
  } catch (error) {
    console.error('Error getting GSC tokens from Firestore:', error)
  }

  // Fallback to local file
  try {
    if (existsSync(LOCAL_TOKENS_PATH)) {
      const content = readFileSync(LOCAL_TOKENS_PATH, 'utf-8')
      const tokens = JSON.parse(content) as GscTokens
      console.log('Using local GSC tokens from:', LOCAL_TOKENS_PATH)
      return tokens
    }
  } catch (error) {
    console.error('Error reading local GSC tokens:', error)
  }

  return null
}

export async function saveGscTokens(tokens: GscTokens): Promise<void> {
  // Try Firestore first
  try {
    const db = getFirestoreDb()
    await db.collection(TOKENS_COLLECTION).doc(TOKENS_DOC).set(tokens)
    return
  } catch (error) {
    console.error('Error saving GSC tokens to Firestore:', error)
  }

  // Fallback to local file
  try {
    const { writeFileSync, mkdirSync } = await import('fs')
    const { dirname } = await import('path')
    mkdirSync(dirname(LOCAL_TOKENS_PATH), { recursive: true })
    writeFileSync(LOCAL_TOKENS_PATH, JSON.stringify(tokens, null, 2))
    console.log('Saved GSC tokens to local file:', LOCAL_TOKENS_PATH)
  } catch (error) {
    console.error('Error saving local GSC tokens:', error)
    throw error
  }
}

export async function refreshGscToken(refreshToken: string): Promise<GscTokens | null> {
  const config = useRuntimeConfig()

  try {
    const response = await $fetch<{
      access_token: string
      expires_in: number
      token_type: string
      scope: string
    }>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        client_id: config.gscClientId,
        client_secret: config.gscClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }
    })

    const tokens: GscTokens = {
      access_token: response.access_token,
      refresh_token: refreshToken, // Keep the same refresh token
      expires_at: Date.now() + (response.expires_in * 1000),
      token_type: response.token_type,
      scope: response.scope,
      created_at: new Date().toISOString()
    }

    await saveGscTokens(tokens)
    return tokens
  } catch (error) {
    console.error('Failed to refresh GSC token:', error)
    return null
  }
}

export async function getValidGscToken(): Promise<string | null> {
  let tokens = await getGscTokens()

  if (!tokens) {
    return null
  }

  // Check if token is expired (with 5 min buffer)
  if (tokens.expires_at < Date.now() + 300000) {
    if (!tokens.refresh_token) {
      return null
    }
    tokens = await refreshGscToken(tokens.refresh_token)
    if (!tokens) {
      return null
    }
  }

  return tokens.access_token
}

export async function queryGscSearchAnalytics(options: {
  siteUrl: string
  startDate: string
  endDate: string
  dimensions?: string[]
  rowLimit?: number
}): Promise<GscSearchAnalyticsResponse | null> {
  const accessToken = await getValidGscToken()

  if (!accessToken) {
    return null
  }

  try {
    const response = await $fetch<GscSearchAnalyticsResponse>(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(options.siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          startDate: options.startDate,
          endDate: options.endDate,
          dimensions: options.dimensions || ['query'],
          rowLimit: options.rowLimit || 100
        }
      }
    )

    return response
  } catch (error) {
    console.error('GSC API error:', error)
    return null
  }
}

export async function isGscConnected(): Promise<boolean> {
  const tokens = await getGscTokens()
  return tokens !== null && !!tokens.refresh_token
}

export async function queryGscSearchAnalyticsWithFilter(options: {
  siteUrl: string
  startDate: string
  endDate: string
  dimensions?: string[]
  rowLimit?: number
  urlFilter?: string
}): Promise<GscSearchAnalyticsResponse | null> {
  const accessToken = await getValidGscToken()

  if (!accessToken) {
    return null
  }

  try {
    const body: Record<string, unknown> = {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions || ['page'],
      rowLimit: options.rowLimit || 10
    }

    // Add URL filter if provided
    if (options.urlFilter) {
      body.dimensionFilterGroups = [{
        filters: [{
          dimension: 'page',
          operator: 'contains',
          expression: options.urlFilter
        }]
      }]
    }

    const response = await $fetch<GscSearchAnalyticsResponse>(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(options.siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body
      }
    )

    return response
  } catch (error) {
    console.error('GSC API error:', error)
    return null
  }
}
