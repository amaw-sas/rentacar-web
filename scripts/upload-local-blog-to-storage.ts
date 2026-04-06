/**
 * One-time script: upload local content/blog/*.md files to Firebase Storage.
 *
 * Usage:
 *   npx tsx scripts/upload-local-blog-to-storage.ts [--dry-run] [--franchise alquilatucarro]
 *
 * Requires env vars (same as NUXT_FIREBASE_* in .env.local):
 *   NUXT_FIREBASE_PROJECT_ID
 *   NUXT_FIREBASE_CLIENT_EMAIL
 *   NUXT_FIREBASE_PRIVATE_KEY
 *   NUXT_FIREBASE_STORAGE_BUCKET
 *
 * Uploads each .md file to: blog-posts/{franchise}/{slug}.md
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Parse CLI args
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const franchiseArg = args.findIndex(a => a === '--franchise')
const FRANCHISE = franchiseArg !== -1 ? args[franchiseArg + 1] : 'alquilatucarro'

// Validate env vars
const projectId = process.env.NUXT_FIREBASE_PROJECT_ID
const clientEmail = process.env.NUXT_FIREBASE_CLIENT_EMAIL
const privateKey = process.env.NUXT_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const storageBucket = process.env.NUXT_FIREBASE_STORAGE_BUCKET

if (!projectId || !clientEmail || !privateKey || !storageBucket) {
  console.error('Missing required env vars:')
  if (!projectId) console.error('  NUXT_FIREBASE_PROJECT_ID')
  if (!clientEmail) console.error('  NUXT_FIREBASE_CLIENT_EMAIL')
  if (!privateKey) console.error('  NUXT_FIREBASE_PRIVATE_KEY')
  if (!storageBucket) console.error('  NUXT_FIREBASE_STORAGE_BUCKET')
  process.exit(1)
}

// Resolve content/blog directory for the given franchise
const contentDir = path.join(ROOT, 'packages', `ui-${FRANCHISE}`, 'content', 'blog')

if (!fs.existsSync(contentDir)) {
  console.error(`Content directory not found: ${contentDir}`)
  process.exit(1)
}

const mdFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'))

if (mdFiles.length === 0) {
  console.log('No .md files found in', contentDir)
  process.exit(0)
}

console.log(`\nFound ${mdFiles.length} .md files in ${contentDir}`)
console.log(`Target: blog-posts/${FRANCHISE}/ in bucket ${storageBucket}`)
if (DRY_RUN) console.log('DRY RUN — no files will be uploaded\n')
else console.log('')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  })
}

const bucket = admin.storage().bucket()

async function uploadFile(filename: string): Promise<void> {
  const slug = filename.replace('.md', '')
  const storagePath = `blog-posts/${FRANCHISE}/${filename}`
  const localPath = path.join(contentDir, filename)
  const content = fs.readFileSync(localPath)

  console.log(`  ${DRY_RUN ? '[dry]' : '[up]'} ${storagePath} (${content.length} bytes)`)

  if (DRY_RUN) return

  const file = bucket.file(storagePath)
  await file.save(content, {
    metadata: {
      contentType: 'text/markdown; charset=utf-8',
      cacheControl: 'no-cache',
    },
  })
}

async function run() {
  let uploaded = 0
  let failed = 0

  for (const filename of mdFiles) {
    try {
      await uploadFile(filename)
      uploaded++
    } catch (err) {
      console.error(`  [error] ${filename}:`, err instanceof Error ? err.message : err)
      failed++
    }
  }

  console.log(`\nDone. ${uploaded} uploaded, ${failed} failed.`)
  if (!DRY_RUN && uploaded > 0) {
    console.log('\nNext: verify with pnpm dev:alquilatucarro → /api/blog/posts-dynamic')
  }
}

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
