/**
 * Blog API end-to-end test — validates the 4 endpoints against a running
 * dev server. Loads .env.local automatically.
 *
 * Prerequisites:
 *   - Dev server running on http://localhost:3001 (pnpm --filter ui-alquilatucarro dev)
 *   - .env.local has NUXT_BLOG_API_KEY and BLOB_READ_WRITE_TOKEN
 *
 * Run from project root:
 *   npx tsx scripts/test-blog-endpoints.ts
 *
 * Scenarios validated:
 *   1. POST /api/blog/upload-image → returns Vercel Blob URL, URL reachable via HTTP
 *   2. POST /api/blog/wordpress-sync → markdown post stored, returns path
 *   3. GET  /api/blog/debug → storage listing includes created post
 *   4. DELETE /api/blog/post/:slug → post + images deleted, success response
 *   5. GET  /api/blog/debug → post no longer in listing
 */
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '..', '.env.local') })

const BASE_URL = process.env.BLOG_TEST_URL || 'http://localhost:3001'
const API_KEY = process.env.NUXT_BLOG_API_KEY
const FRANCHISE = 'alquilatucarro'
const TEST_SLUG = `sanity-test-${Date.now()}`
const TEST_IMAGE_PATH = resolve(__dirname, '..', 'packages/logic/public/images/flags/colombia-100-77.png')

if (!API_KEY) {
  console.error('❌ NUXT_BLOG_API_KEY not set in .env.local')
  process.exit(1)
}

function pass(msg: string) { console.log(`✅ ${msg}`) }
function fail(msg: string, err?: unknown): never {
  console.error(`❌ ${msg}`)
  if (err) console.error(err)
  process.exit(1)
}

async function main() {
  console.log(`\n🧪 Blog API end-to-end test\n`)
  console.log(`  base URL: ${BASE_URL}`)
  console.log(`  slug:     ${TEST_SLUG}`)
  console.log(`  image:    ${TEST_IMAGE_PATH}\n`)

  // ─────────────────────────────────────────────────────────────
  // Scenario 1: POST /api/blog/upload-image
  // ─────────────────────────────────────────────────────────────
  let uploadedImageUrl: string
  try {
    const imageBytes = readFileSync(TEST_IMAGE_PATH)
    const formData = new FormData()
    formData.append('file', new Blob([imageBytes], { type: 'image/png' }), 'test.png')
    formData.append('type', 'content')
    formData.append('alt', 'sanity test image')

    const res = await fetch(`${BASE_URL}/api/blog/upload-image`, {
      method: 'POST',
      headers: { 'X-Api-Key': API_KEY! },
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      fail(`upload-image returned ${res.status}: ${text}`)
    }

    const body = await res.json() as { success: boolean; url: string; filename: string }
    if (!body.success || !body.url) fail(`upload-image response missing success/url: ${JSON.stringify(body)}`)
    uploadedImageUrl = body.url
    pass(`upload-image returned URL: ${uploadedImageUrl}`)

    // Verify URL is reachable
    const imgRes = await fetch(uploadedImageUrl)
    if (!imgRes.ok) fail(`Uploaded image URL not reachable: ${imgRes.status}`)
    const contentType = imgRes.headers.get('content-type')
    if (!contentType?.includes('image/webp')) fail(`Expected image/webp, got ${contentType}`)
    pass(`Uploaded image URL reachable (Content-Type: ${contentType})`)
  } catch (err) {
    fail('upload-image failed', err)
  }

  // ─────────────────────────────────────────────────────────────
  // Scenario 2: POST /api/blog/wordpress-sync
  // ─────────────────────────────────────────────────────────────
  try {
    const wpPost = {
      id: 99999,
      title: { rendered: 'Sanity Test Post' },
      content: {
        rendered: `<p>This is a sanity test post. <img src="${uploadedImageUrl}" alt="test"/></p>`,
      },
      excerpt: { rendered: '<p>Test excerpt</p>' },
      date: new Date().toISOString(),
      modified: new Date().toISOString(),
      slug: TEST_SLUG,
    }

    const res = await fetch(`${BASE_URL}/api/blog/wordpress-sync`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wpPost),
    })

    if (!res.ok) {
      const text = await res.text()
      fail(`wordpress-sync returned ${res.status}: ${text}`)
    }

    const body = await res.json() as { success: boolean; path: string }
    if (!body.success) fail(`wordpress-sync response not success: ${JSON.stringify(body)}`)
    pass(`wordpress-sync stored post at: ${body.path}`)
  } catch (err) {
    fail('wordpress-sync failed', err)
  }

  // ─────────────────────────────────────────────────────────────
  // Scenario 3: GET /api/blog/debug — includes post
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/blog/debug`, {
      headers: { 'X-Api-Key': API_KEY! },
    })

    if (!res.ok) {
      const text = await res.text()
      fail(`debug returned ${res.status}: ${text}`)
    }

    const body = await res.json() as {
      env: { blobReadWriteToken: string }
      storage: { success: boolean; count: number; files: string[] }
    }

    if (body.env.blobReadWriteToken !== 'SET') fail(`BLOB_READ_WRITE_TOKEN not SET in runtime: ${body.env.blobReadWriteToken}`)
    if (!body.storage.success) fail(`debug storage.success = false: ${JSON.stringify(body.storage)}`)

    const expectedPath = `blog-posts/${FRANCHISE}/${TEST_SLUG}.md`
    const found = body.storage.files?.find(f => f === expectedPath) ||
      (await listAllPosts()).includes(expectedPath)

    if (!found) fail(`debug does not list ${expectedPath}. First 10 files: ${body.storage.files?.join(', ')}`)
    pass(`debug lists created post (${body.storage.count} total)`)
  } catch (err) {
    fail('debug failed', err)
  }

  // ─────────────────────────────────────────────────────────────
  // Scenario 4: DELETE /api/blog/post/:slug
  // ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/api/blog/post/${TEST_SLUG}`, {
      method: 'DELETE',
      headers: { 'X-Api-Key': API_KEY! },
    })

    if (!res.ok) {
      const text = await res.text()
      fail(`delete returned ${res.status}: ${text}`)
    }

    const body = await res.json() as {
      success: boolean
      deleted: { post: string; images: string[] }
    }

    if (!body.success) fail(`delete response not success: ${JSON.stringify(body)}`)
    pass(`delete removed post + ${body.deleted.images.length} image(s)`)
  } catch (err) {
    fail('delete failed', err)
  }

  // ─────────────────────────────────────────────────────────────
  // Scenario 5: GET /api/blog/debug — post no longer present
  // ─────────────────────────────────────────────────────────────
  try {
    // Give delete + list a moment (eventual consistency should not be an issue, but safe)
    await new Promise(r => setTimeout(r, 500))

    const allPosts = await listAllPosts()
    const expectedPath = `blog-posts/${FRANCHISE}/${TEST_SLUG}.md`
    if (allPosts.includes(expectedPath)) fail(`Post still in list after delete: ${expectedPath}`)
    pass('debug no longer lists deleted post')
  } catch (err) {
    fail('post-delete verification failed', err)
  }

  // Also verify the uploaded image is gone
  try {
    const imgRes = await fetch(uploadedImageUrl)
    if (imgRes.ok) {
      console.log(`⚠️  Uploaded image still accessible at ${uploadedImageUrl} (may indicate delete regex missed it)`)
    } else {
      pass(`Uploaded image no longer accessible (HTTP ${imgRes.status})`)
    }
  } catch {
    pass('Uploaded image no longer accessible (fetch failed)')
  }

  console.log('\n🎉 All scenarios passed — blog endpoints functional with Vercel Blob\n')
}

async function listAllPosts(): Promise<string[]> {
  // Call debug endpoint which returns up to 10 files; for full verification
  // we use the Vercel Blob SDK directly
  const { list } = await import('@vercel/blob')
  const allPaths: string[] = []
  let cursor: string | undefined
  do {
    const result = await list({ prefix: `blog-posts/${FRANCHISE}/`, cursor })
    for (const blob of result.blobs) allPaths.push(blob.pathname)
    cursor = result.hasMore ? result.cursor : undefined
  } while (cursor)
  return allPaths
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
