/**
 * Firebase Admin stub — disabled pending migration to Supabase (Phase 3)
 * Only getFirestoreDb remains (used by gsc.ts for Google Search Console tokens).
 * getFirebaseApp is exported from firebase-storage.ts instead.
 */

const DISABLED_MSG = 'Firebase Admin is disabled. Pending migration to Supabase.'

export function getFirestoreDb() {
  throw new Error(DISABLED_MSG)
}
