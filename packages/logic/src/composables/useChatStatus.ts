import { onBeforeUnmount, onMounted, ref } from 'vue'

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000
const DAY_BY_UTC_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const SCHEDULE_RANGE_RE = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-4]):([0-5]\d)$/

type WhatsappScheduleDay = (typeof DAY_BY_UTC_INDEX)[number]
export type WhatsappSchedule = Partial<Record<WhatsappScheduleDay, string[]>>

export interface ContactChannelStatus {
  enabled: boolean
  whatsappEnabled: boolean
  whatsappSchedule: WhatsappSchedule | null
}

interface StatusResponse {
  brand?: unknown
  enabled?: unknown
  whatsappEnabled?: unknown
  whatsappSchedule?: unknown
}

function rangeToMinutes(range: string): [number, number] | null {
  const match = SCHEDULE_RANGE_RE.exec(range)
  if (!match) return null

  const [, fromHour = '0', fromMinute = '0', toHour = '0', toMinute = '0'] = match
  return [
    Number(fromHour) * 60 + Number(fromMinute),
    Number(toHour) * 60 + Number(toMinute),
  ]
}

/**
 * Treat malformed public payloads like an absent schedule (always visible).
 * The dashboard sanitizes too, but the anonymous response is still untrusted.
 */
function normalizeWhatsappSchedule(value: unknown): WhatsappSchedule | null {
  if (value == null) return null
  if (typeof value !== 'object' || Array.isArray(value)) return null

  const schedule = value as Record<string, unknown>
  if (Object.keys(schedule).some(key => !DAY_BY_UTC_INDEX.includes(key as WhatsappScheduleDay))) {
    return null
  }

  for (const ranges of Object.values(schedule)) {
    if (!Array.isArray(ranges)) return null
    for (const range of ranges) {
      if (typeof range !== 'string') return null
      const minutes = rangeToMinutes(range)
      if (!minutes || minutes[0] >= minutes[1] || minutes[1] > 1440) return null
    }
  }

  return schedule as WhatsappSchedule
}

/**
 * WhatsApp is schedule-visible at a UTC instant. Colombia is UTC-5 year-round.
 * null = no schedule = visible; {} or an absent/empty current day = hidden.
 */
export function evaluateWhatsappVisibility(
  schedule: WhatsappSchedule | null,
  nowUtc: Date,
): boolean {
  if (schedule === null) return true

  const bogota = new Date(nowUtc.getTime() - BOGOTA_OFFSET_MS)
  const day = DAY_BY_UTC_INDEX[bogota.getUTCDay()]!
  const ranges = schedule[day]
  if (!ranges || ranges.length === 0) return false

  const minutes = bogota.getUTCHours() * 60 + bogota.getUTCMinutes()
  return ranges.some((range: string) => {
    const parsed = rangeToMinutes(range)
    return parsed !== null && minutes >= parsed[0] && minutes < parsed[1]
  })
}

/**
 * Fetches the two independent contact-channel switches from the dashboard.
 * `whatsappEnabled` is additive: an older endpoint without it is treated as ON
 * after a successful response so a staggered deployment does not hide WhatsApp.
 */
export async function fetchContactChannelStatus(
  apiBase: string,
  brand: string,
): Promise<ContactChannelStatus | null> {
  if (!brand) return null
  try {
    const res = await $fetch<StatusResponse>(
      `${apiBase}/api/chat/status`,
      { query: { brand } },
    )
    if (typeof res?.enabled !== 'boolean') return null
    return {
      enabled: res.enabled,
      whatsappEnabled:
        typeof res.whatsappEnabled === 'boolean' ? res.whatsappEnabled : true,
      whatsappSchedule: normalizeWhatsappSchedule(res.whatsappSchedule),
    }
  } catch {
    return null
  }
}

/** Backwards-compatible single-value helper for callers/tests outside the FAB. */
export async function fetchChatEnabled(apiBase: string, brand: string): Promise<boolean | null> {
  return (await fetchContactChannelStatus(apiBase, brand))?.enabled ?? null
}

/**
 * Per-brand visibility for the two direct floating buttons.
 *
 * WhatsApp fails OPEN: a wa.me link works with the dashboard down, so it shows
 * from the first paint and only an authoritative OFF hides it (F0 review: the
 * previous fail-closed start made the main conversion channel depend on a
 * remote fetch). Chat fails CLOSED — its panel needs the backend to function.
 * Both preserve last-known-good state across transient errors and revalidate
 * on mount and window focus (no background polling).
 */
export function useChatStatus(brand: string) {
  const enabled = ref(false)
  const whatsappEnabled = ref(true)
  const whatsappSchedule = ref<WhatsappSchedule | null>(null)
  const whatsappVisible = ref(true)
  const resolved = ref(false)
  const { rentacarPublicApiBase } = useRuntimeConfig().public
  let refreshGeneration = 0

  function updateWhatsappVisibility() {
    whatsappVisible.value =
      whatsappEnabled.value &&
      evaluateWhatsappVisibility(whatsappSchedule.value, new Date())
  }

  async function refresh() {
    const generation = ++refreshGeneration
    const next = await fetchContactChannelStatus(
      rentacarPublicApiBase as string,
      brand,
    )
    if (generation !== refreshGeneration || next === null) return

    enabled.value = next.enabled
    whatsappEnabled.value = next.whatsappEnabled
    whatsappSchedule.value = next.whatsappSchedule
    updateWhatsappVisibility()
    resolved.value = true
  }

  function onFocus() {
    updateWhatsappVisibility()
    void refresh()
  }

  onMounted(() => {
    void refresh()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
    }
  })
  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onFocus)
    }
  })

  return {
    enabled,
    whatsappEnabled,
    whatsappVisible,
    resolved,
    refresh,
  }
}
