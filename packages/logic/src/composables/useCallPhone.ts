/**
 * useCallPhone — the phone number that call (tel:) links should use.
 *
 * Normally the brand's own number. On alquilatucarro, when Google Ads' phone
 * snippet returns a forwarding number for a visitor who came from an ad, the
 * `call-forwarding.client.ts` plugin stores it under CALL_FORWARDING_STATE_KEY
 * and every call link switches to it. WhatsApp links and JSON-LD must keep
 * using `franchise.phone` directly — never this composable.
 * Spec: docs/specs/2026-09-23-website-call-forwarding/design.md
 */
import { computed } from 'vue'
import {
  CALL_FORWARDING_STATE_KEY,
  resolveCallPhone,
  type CallForwardingNumber,
} from '../utils/callForwarding'

export function useCallPhone() {
  const { franchise } = useAppConfig()
  const forwarding = useState<CallForwardingNumber | null>(CALL_FORWARDING_STATE_KEY, () => null)
  const resolved = computed(() => resolveCallPhone(String(franchise.phone ?? ''), forwarding.value))
  return {
    display: computed(() => resolved.value.display),
    tel: computed(() => resolved.value.tel),
    telHref: computed(() => resolved.value.telHref),
  }
}
