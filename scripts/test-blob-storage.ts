/**
 * Vercel Blob sanity check — validates BLOB_READ_WRITE_TOKEN and SDK primitives.
 *
 * Run from project root:
 *   cd packages/ui-alquilatucarro && npx tsx ../../scripts/test-blob-storage.ts
 *
 * Scenarios validated:
 *   1. put() uploads a buffer and returns a public URL
 *   2. The returned URL is reachable via HTTP and contains the uploaded content
 *   3. get() retrieves the blob stream with matching content
 *   4. list({ prefix }) includes the uploaded blob
 *   5. del() removes the blob
 *   6. list({ prefix }) no longer includes it after delete
 */
import { put, get, del, list } from '@vercel/blob'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '..', '.env.local') })

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not set in .env.local')
  process.exit(1)
}

const TEST_PREFIX = 'test/sanity/'
const TEST_KEY = `${TEST_PREFIX}${Date.now()}.txt`
const TEST_CONTENT = 'hello from vercel blob sanity check'

async function readStreamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

function pass(msg: string) { console.log(`✅ ${msg}`) }
function fail(msg: string, err?: unknown): never {
  console.error(`❌ ${msg}`)
  if (err) console.error(err)
  process.exit(1)
}

async function main() {
  console.log(`\n🧪 Vercel Blob sanity check — key: ${TEST_KEY}\n`)

  // Scenario 1: put
  let url: string
  try {
    const blob = await put(TEST_KEY, Buffer.from(TEST_CONTENT), {
      access: 'public',
      contentType: 'text/plain',
      allowOverwrite: true,
    })
    url = blob.url
    pass(`put() returned URL: ${url}`)
  } catch (err) {
    fail('put() failed', err)
  }

  // Scenario 2: HTTP fetch of returned URL
  try {
    const res = await fetch(url)
    if (!res.ok) fail(`HTTP fetch failed with status ${res.status}`)
    const text = await res.text()
    if (text !== TEST_CONTENT) fail(`HTTP content mismatch: expected "${TEST_CONTENT}", got "${text}"`)
    pass('URL fetched over HTTP returns correct content')
  } catch (err) {
    fail('HTTP fetch failed', err)
  }

  // Scenario 3: get()
  try {
    const result = await get(TEST_KEY, { access: 'public' })
    if (!result) fail('get() returned null')
    if (result.statusCode !== 200) fail(`get() returned statusCode ${result.statusCode}`)
    const content = await readStreamToString(result.stream)
    if (content !== TEST_CONTENT) fail(`get() content mismatch: "${content}"`)
    pass('get() returns matching content')
  } catch (err) {
    fail('get() failed', err)
  }

  // Scenario 4: list includes our blob
  try {
    const result = await list({ prefix: TEST_PREFIX })
    const found = result.blobs.find(b => b.pathname === TEST_KEY)
    if (!found) fail(`list() did not include ${TEST_KEY}. Found: ${result.blobs.map(b => b.pathname).join(', ')}`)
    pass(`list() includes uploaded blob (${result.blobs.length} total with prefix)`)
  } catch (err) {
    fail('list() failed', err)
  }

  // Scenario 5: del()
  try {
    await del(url)
    pass('del() completed')
  } catch (err) {
    fail('del() failed', err)
  }

  // Scenario 6: list() no longer includes it
  try {
    const result = await list({ prefix: TEST_PREFIX })
    const found = result.blobs.find(b => b.pathname === TEST_KEY)
    if (found) fail(`Blob still in list after delete: ${found.pathname}`)
    pass('list() no longer includes deleted blob')
  } catch (err) {
    fail('list() after delete failed', err)
  }

  console.log('\n🎉 All 6 scenarios passed — Vercel Blob is functional\n')
}

main().catch(err => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
