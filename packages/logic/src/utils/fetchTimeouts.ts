/**
 * Explicit $fetch timeouts for money-moving paths (issue 322 PR2).
 * Availability is a catalog lookup; record waits on Localiza/admin.
 */
export const AVAILABILITY_FETCH_TIMEOUT_MS = 15_000
export const RECORD_FETCH_TIMEOUT_MS = 45_000
