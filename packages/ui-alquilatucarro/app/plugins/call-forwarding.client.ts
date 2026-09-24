// Google Ads website call conversion ("Llamada (+57 301 672 9250)", secondary,
// category "Cliente potencial por teléfono"). For visitors who arrived from an
// ad, Google returns a forwarding number; call links switch to it through
// useCallPhone(). WhatsApp links keep the real number.
// Spec: docs/specs/2026-09-23-website-call-forwarding/design.md
import {
  buildPhoneConversionConfig,
  CALL_FORWARDING_STATE_KEY,
  type CallForwardingNumber,
} from '@rentacar-main/logic/utils'

const ADS_TAG_ID = 'AW-18234487332'
const CALL_CONVERSION_LABEL = 'SC3KCKnx7YIdEKTk8PZD'

type Gtag = (...args: unknown[]) => void

export default defineNuxtPlugin((nuxtApp) => {
  const { franchise } = useAppConfig()
  const forwarding = useState<CallForwardingNumber | null>(CALL_FORWARDING_STATE_KEY, () => null)

  // After mount, like page-view.client.ts, so the Ads tag stays off the
  // hydration path.
  nuxtApp.hook('app:mounted', () => {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag
    if (typeof gtag !== 'function') return
    try {
      gtag('config', ADS_TAG_ID)
      gtag(
        'config',
        `${ADS_TAG_ID}/${CALL_CONVERSION_LABEL}`,
        buildPhoneConversionConfig(franchise.phone as string, (number) => {
          forwarding.value = number
        }),
      )
    } catch {
      // Analytics must never break the page; call links keep the real number.
    }
  })
})
