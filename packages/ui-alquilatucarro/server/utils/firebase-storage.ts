/**
 * Firebase Storage stub — disabled pending migration to Supabase Storage (Phase 7)
 * Blog upload/download endpoints will return errors until migration is complete.
 */

const DISABLED_MSG = 'Firebase Storage is disabled. Pending migration to Supabase Storage.'

export function getFirebaseApp() {
  throw new Error(DISABLED_MSG)
}

export async function uploadToStorage(_path: string, _data: Buffer, _contentType: string) {
  throw new Error(DISABLED_MSG)
}

export async function downloadFromStorage(_path: string): Promise<Buffer> {
  throw new Error(DISABLED_MSG)
}

export async function deleteFromStorage(_path: string) {
  throw new Error(DISABLED_MSG)
}

export async function listFilesInStorage(_prefix: string): Promise<string[]> {
  throw new Error(DISABLED_MSG)
}
