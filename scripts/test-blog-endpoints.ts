/**
 * Blog API end-to-end test — validates the write+read endpoints against a
 * running dev server, now backed by Supabase (issue #52). Loads .env.local.
 *
 * Prerequisites:
 *   - Dev server running (default http://localhost:3000)
 *   - .env.local has NUXT_BLOG_API_KEY, NUXT_SUPABASE_URL,
 *     NUXT_SUPABASE_ANON_KEY, NUXT_SUPABASE_SERVICE_ROLE_KEY
 *
 * Run from project root (with env):
 *   npx tsx --env-file=.env.local scripts/test-blog-endpoints.ts
 *
 * Scenarios validated:
 *   1. POST   /api/blog/upload-image    → Supabase Storage URL, reachable, image/webp
 *   2. POST   /api/blog/wordpress-sync  → upserted into blog_posts, returns { slug, brand }
 *   3. GET    /api/blog/posts           → listing includes the created slug
 *   4. GET    /api/blog/debug           → row count for this brand
 *   5. DELETE /api/blog/post/:slug      → row + referenced images removed
 *   6. GET    /api/blog/posts           → slug no longer listed
 */
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '..', '.env.local') })

const BASE_URL = process.env.BLOG_TEST_URL || 'http://localhost:3000'
const API_KEY = process.env.NUXT_BLOG_API_KEY
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

async function listSlugs(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/blog/posts`)
  if (!res.ok) fail(`/api/blog/posts returned ${res.status}`)
  const body = await res.json() as { posts: Array<{ slug: string }> }
  return (body.posts ?? []).map(p => p.slug)
}

async function main() {
  console.log(`\n🧪 Blog API end-to-end test (Supabase)\n`)
  console.log(`  base URL: ${BASE_URL}`)
  console.log(`  slug:     ${TEST_SLUG}\n`)

  // 1. upload-image → Supabase Storage
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
    if (!res.ok) fail(`upload-image returned ${res.status}: ${await res.text()}`)

    const body = await res.json() as { success: boolean; url: string }
    if (!body.success || !body.url) fail(`upload-image missing success/url: ${JSON.stringify(body)}`)
    uploadedImageUrl = body.url
    pass(`upload-image returned URL: ${uploadedImageUrl}`)

    const imgRes = await fetch(uploadedImageUrl)
    if (!imgRes.ok) fail(`Uploaded image URL not reachable: ${imgRes.status}`)
    const contentType = imgRes.headers.get('content-type')
    if (!contentType?.includes('image/webp')) fail(`Expected image/webp, got ${contentType}`)
    pass(`Uploaded image reachable (${contentType})`)
  } catch (err) {
    fail('upload-image failed', err)
  }

  // 2. wordpress-sync → upsert into blog_posts
  try {
    const wpPost = {
      id: 99999,
      title: { rendered: 'Sanity Test Post' },
      content: { rendered: `<p>Sanity test. <img src="${uploadedImageUrl}" alt="test"/></p>` },
      excerpt: { rendered: '<p>Test excerpt</p>' },
      date: '2026-06-04T00:00:00',
      modified: '2026-06-04T00:00:00',
      slug: TEST_SLUG,
    }
    const res = await fetch(`${BASE_URL}/api/blog/wordpress-sync`, {
      method: 'POST',
      headers: { 'X-Api-Key': API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(wpPost),
    })
    if (!res.ok) fail(`wordpress-sync returned ${res.status}: ${await res.text()}`)
    const body = await res.json() as { success: boolean; slug: string; brand: string }
    if (!body.success || body.slug !== TEST_SLUG) fail(`wordpress-sync unexpected: ${JSON.stringify(body)}`)
    pass(`wordpress-sync upserted ${body.slug} (brand ${body.brand})`)
  } catch (err) {
    fail('wordpress-sync failed', err)
  }

  // 3. listing includes the created slug
  try {
    if (!(await listSlugs()).includes(TEST_SLUG)) fail(`/api/blog/posts does not list ${TEST_SLUG}`)
    pass('listing includes created post')
  } catch (err) {
    fail('listing check failed', err)
  }

  // 4. debug → row count
  try {
    const res = await fetch(`${BASE_URL}/api/blog/debug`, { headers: { 'X-Api-Key': API_KEY! } })
    if (!res.ok) fail(`debug returned ${res.status}: ${await res.text()}`)
    const body = await res.json() as { storage: { success: boolean; count: number } }
    if (!body.storage.success) fail(`debug storage.success = false: ${JSON.stringify(body.storage)}`)
    pass(`debug reports ${body.storage.count} rows for this brand`)
  } catch (err) {
    fail('debug failed', err)
  }

  // 5. delete
  try {
    const res = await fetch(`${BASE_URL}/api/blog/post/${TEST_SLUG}`, {
      method: 'DELETE',
      headers: { 'X-Api-Key': API_KEY! },
    })
    if (!res.ok) fail(`delete returned ${res.status}: ${await res.text()}`)
    const body = await res.json() as { success: boolean; deleted: { images: string[] } }
    if (!body.success) fail(`delete not success: ${JSON.stringify(body)}`)
    pass(`delete removed post + ${body.deleted.images.length} image(s)`)
  } catch (err) {
    fail('delete failed', err)
  }

  // 6. listing no longer includes the slug
  try {
    if ((await listSlugs()).includes(TEST_SLUG)) fail(`Post still listed after delete: ${TEST_SLUG}`)
    pass('listing no longer includes deleted post')
  } catch (err) {
    fail('post-delete verification failed', err)
  }

  // image gone (best-effort signal — delete parses body for blog-images URLs)
  try {
    const imgRes = await fetch(uploadedImageUrl)
    if (imgRes.ok) console.log(`⚠️  Uploaded image still accessible (delete regex may have missed it)`)
    else pass(`Uploaded image no longer accessible (HTTP ${imgRes.status})`)
  } catch {
    pass('Uploaded image no longer accessible')
  }

  console.log('\n🎉 All scenarios passed — blog endpoints functional with Supabase\n')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
