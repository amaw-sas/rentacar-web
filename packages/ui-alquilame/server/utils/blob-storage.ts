/**
 * Blog storage via Vercel Blob
 * Requires BLOB_READ_WRITE_TOKEN env var (auto-set by Vercel Blob integration)
 */
import { put, del, list, get } from '@vercel/blob'

export async function uploadToStorage(
  data: Buffer,
  path: string,
  contentType: string,
  cacheControlMaxAge?: number,
): Promise<string> {
  const options = {
    access: 'public' as const,
    contentType,
    allowOverwrite: true,
    ...(cacheControlMaxAge !== undefined ? { cacheControlMaxAge } : {}),
  }
  const blob = await put(path, data, options)
  return blob.url
}

export async function downloadFromStorage(path: string): Promise<Buffer> {
  const result = await get(path, { access: 'public' })
  if (!result) {
    throw new Error(`Blob not found: ${path}`)
  }
  const reader = result.stream.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

export async function deleteFromStorage(pathOrUrl: string): Promise<void> {
  await del(pathOrUrl)
}

export async function listFilesInStorage(prefix: string): Promise<string[]> {
  const allPaths: string[] = []
  let cursor: string | undefined

  do {
    const result = await list({ prefix, cursor })
    for (const blob of result.blobs) {
      allPaths.push(blob.pathname)
    }
    cursor = result.hasMore ? result.cursor : undefined
  } while (cursor)

  return allPaths
}
