import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Per-brand visibility windows for the contact FAB's WhatsApp option. Keys are
 * lowercase 3-letter weekdays; each value is a list of `'HH:MM-HH:MM'` ranges in
 * Bogota civil time during which WhatsApp is SHOWN. A missing day (or `[]`) hides
 * WhatsApp that day; a `null`/absent schedule keeps it always visible.
 */
export interface WhatsappSchedule {
  mon?: string[]
  tue?: string[]
  wed?: string[]
  thu?: string[]
  fri?: string[]
  sat?: string[]
  sun?: string[]
}

// Index matches Date.prototype.getUTCDay(): 0 = Sunday … 6 = Saturday.
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

// Colombia is UTC−5 all year (no DST), so a fixed offset is exact. Shifting the
// epoch back 5h and then reading the UTC parts of the result yields Bogota wall
// time — the same trick the reservation date code uses (see useDateFunctions).
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000

/**
 * Parses a single `'HH:MM-HH:MM'` window into `[startMinute, endMinute)` of the
 * day, or `null` when it is malformed. `24:00` is accepted only as an end (a
 * midnight close). A window never wraps past midnight (start must precede end).
 */
function parseRangeToMinutes(range: unknown): [number, number] | null {
  if (typeof range !== 'string') return null
  const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(range.trim())
  if (!match) return null
  const startH = Number(match[1])
  const startM = Number(match[2])
  const endH = Number(match[3])
  const endM = Number(match[4])
  if (startM > 59 || endM > 59) return null
  if (startH > 23) return null
  // 24:00 is the only allowed 24-hour value, and only as an end-of-day close.
  if (endH > 24 || (endH === 24 && endM !== 0)) return null
  const start = startH * 60 + startM
  const end = endH * 60 + endM
  if (end <= start) return null
  return [start, end]
}

/**
 * Pure predicate: is WhatsApp visible at `nowUtc` given `schedule`?
 *
 * Canonical semantics (shared contract with the dashboard that serves the field):
 *   - `null` / `undefined` (no schedule configured) → always visible.
 *   - `{}` — a VALID but empty schedule → hidden all week. An operator who saves
 *     a schedule with no windows means "never show", not "always show".
 *   - day key absent, or an empty list → hidden that day.
 *   - otherwise visible only inside one of that day's `[start, end)` windows.
 *
 * A malformed range inside an otherwise valid day is IGNORED — it simply opens no
 * window — so one typo (`'8:00-16:00'`) cannot swing the whole day open.
 *
 * Fail-open is reserved for shape violations that mean "we could not read a
 * schedule at all": a non-object payload, a NON-EMPTY object that names no
 * weekday we recognize (`{monday: […]}`, `{lunes: […]}`, `{version: 2, days: {…}}`),
 * a day whose value is not a list, or an unusable `nowUtc`. Those keep WhatsApp
 * visible so a backend or decoding fault never silently removes the button.
 *
 * The empty object is the one case where "no recognizable weekday" still means
 * hidden, because `{}` is what the producer stores for "saved, no windows". It is
 * therefore checked before the readability rule.
 */
export function evaluateWhatsappVisibility(schedule: unknown, nowUtc: Date): boolean {
  if (schedule === null || schedule === undefined) return true
  if (typeof schedule !== 'object' || Array.isArray(schedule)) return true

  const record = schedule as Record<string, unknown>

  // Order matters here. `{}` is the canonical "saved with no windows" value and
  // must hide all week, so it is settled BEFORE the readability check below —
  // otherwise it would look like a schedule naming no weekday and fail open.
  if (Object.keys(record).length === 0) return false

  // A non-empty object that names no weekday we understand (`{monday: […]}`,
  // `{lunes: […]}`, `{version: 2, days: {…}}`) is a shape we cannot read, not a
  // schedule that closes every day. Reading it as "closed" would silently remove
  // the button on a producer rename — the exact failure fail-open exists to stop.
  if (!DAY_KEYS.some(key => key in record)) return true

  const bogota = new Date(nowUtc.getTime() - BOGOTA_OFFSET_MS)
  const dayKey = DAY_KEYS[bogota.getUTCDay()]
  // An unusable clock (Invalid Date → NaN) leaves no day to evaluate → fail-open.
  if (!dayKey) return true
  const nowMinutes = bogota.getUTCHours() * 60 + bogota.getUTCMinutes()

  const ranges = record[dayKey]
  if (ranges === undefined) return false // no window configured today → hidden.
  if (!Array.isArray(ranges)) return true // day is not a list → shape fault → fail-open.
  if (ranges.length === 0) return false // explicit empty window → hidden today.

  for (const range of ranges) {
    const parsed = parseRangeToMinutes(range)
    if (parsed === null) continue // malformed range opens nothing; other ranges still count.
    if (nowMinutes >= parsed[0] && nowMinutes < parsed[1]) return true
  }
  return false
}

interface ChatStatusResult {
  enabled: boolean | null
  whatsappSchedule: unknown
}

/**
 * Single source-of-truth fetch for the dashboard chat switch:
 * `GET {apiBase}/api/chat/status?brand=` → `{ enabled, whatsappSchedule? }`.
 * Returns `null` when the request fails or has no usable brand, letting callers
 * distinguish a transient error from an authoritative response. `enabled` is
 * `null` when the payload omits a boolean; `whatsappSchedule` is passed through
 * untyped and validated downstream by {@link evaluateWhatsappVisibility}.
 */
export async function fetchChatStatus(apiBase: string, brand: string): Promise<ChatStatusResult | null> {
  if (!brand) return null
  try {
    const res = await $fetch<{ brand: string; enabled: boolean; whatsappSchedule?: unknown }>(
      `${apiBase}/api/chat/status`,
      { query: { brand } },
    )
    return {
      enabled: typeof res?.enabled === 'boolean' ? res.enabled : null,
      whatsappSchedule: res?.whatsappSchedule,
    }
  } catch {
    return null
  }
}

/**
 * Asks the dashboard whether the chat is enabled for a brand. Awaitable, works
 * on SSR and client. `apiBase` is passed in so `useRuntimeConfig()` is read in
 * the caller's synchronous setup scope (never after an await). `null` means the
 * request failed, allowing callers to distinguish a transient error from an
 * authoritative OFF.
 */
export async function fetchChatEnabled(apiBase: string, brand: string): Promise<boolean | null> {
  const status = await fetchChatStatus(apiBase, brand)
  return status ? status.enabled : null
}

/**
 * Per-brand chat visibility for the contact FAB, driven by the dashboard's on/off
 * switch (the dashboard toggle is the source of truth: on/off there shows/hides the
 * chat with no redeploy). Client-only fetch (the widget is wrapped in <ClientOnly>);
 * `enabled` starts `false` and only flips `true` when the backend confirms it. Never
 * throws.
 *
 * `whatsappVisible` gates the FAB's WhatsApp option against per-brand visibility
 * windows returned in the same response. It is fail-OPEN (opposite of `enabled`):
 * it starts `true` and stays `true` until an authoritative schedule says otherwise,
 * so a network error never makes the WhatsApp button disappear. It re-evaluates on
 * a 60s timer and on the existing focus revalidation.
 */
export function useChatStatus(brand: string) {
  const enabled = ref(false)
  const resolved = ref(false)
  const whatsappVisible = ref(true)
  const { rentacarPublicApiBase } = useRuntimeConfig().public
  let refreshGeneration = 0
  let whatsappSchedule: unknown
  let scheduleResolved = false

  function reevaluateWhatsapp() {
    // Before the first authoritative response the schedule is unknown → stay
    // fail-open (visible). Afterwards the timer keeps visibility in sync as the
    // active window opens/closes without another network round-trip.
    if (!scheduleResolved) return
    whatsappVisible.value = evaluateWhatsappVisibility(whatsappSchedule, new Date())
  }

  async function refresh() {
    const generation = ++refreshGeneration
    const status = await fetchChatStatus(rentacarPublicApiBase as string, brand)
    // A slow earlier request must never overwrite a newer focus revalidation.
    if (generation !== refreshGeneration) return
    // A transient error preserves the last authoritative chat ON/OFF and the last
    // known WhatsApp schedule instead of tearing down a live surface or hiding a
    // button that was legitimately shown.
    if (status === null) return
    if (status.enabled !== null) {
      enabled.value = status.enabled
      resolved.value = true
    }
    whatsappSchedule = status.whatsappSchedule
    scheduleResolved = true
    reevaluateWhatsapp()
  }

  // Revalidate when a visitor returns to an already-open tab. This makes an OFF
  // toggle close an open surface instead of leaving stale chat UI alive forever,
  // and picks up a schedule edit made while the tab sat in the background.
  function onFocus() {
    void refresh()
  }

  // Mobile browsers throttle background timers and do not reliably fire `focus`
  // when a tab is restored, so a visitor could see up to a minute of stale state.
  // `visibilitychange` covers that path: re-evaluate the window immediately on
  // return, and refresh the schedule itself in the background.
  function onVisibilityChange() {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    reevaluateWhatsapp()
    void refresh()
  }

  let whatsappTimer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    void refresh()
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
    // Re-evaluate the active window each minute so WhatsApp appears/disappears at
    // the boundary without a page reload. Unref so it never keeps a process alive.
    whatsappTimer = setInterval(reevaluateWhatsapp, 60_000)
    ;(whatsappTimer as { unref?: () => void })?.unref?.()
  })
  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    if (whatsappTimer !== undefined) clearInterval(whatsappTimer)
  })

  return { enabled, resolved, whatsappVisible, refresh }
}
