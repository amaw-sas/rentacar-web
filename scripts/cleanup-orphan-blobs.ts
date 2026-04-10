/**
 * Cleanup orphan blobs — removes test posts left by failed test runs.
 * Run: npx tsx scripts/cleanup-orphan-blobs.ts
 */
import { config } from 'dotenv'
import { del, list } from '@vercel/blob'
config({ path: '.env.local' })

async function main() {
  const prefixes = [
    'blog-posts/alquilame/sanity-test-',
    'blog-posts/alquicarros/sanity-test-',
    'blog-posts/alquilatucarro/sanity-test-',
  ]

  for (const prefix of prefixes) {
    const result = await list({ prefix })
    console.log(`[${prefix}] found ${result.blobs.length} blobs`)
    for (const blob of result.blobs) {
      console.log(`  delete: ${blob.pathname}`)
      await del(blob.url)
    }
  }
  console.log('Cleanup done')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
