// External dependencies
import { onMounted, nextTick } from 'vue';

/**
 * Fire a GA4 `page_view` for a reservation-result page (`/reservado`,
 * `/pendiente`, `/sindisponibilidad`) when it is reached via CLIENT-SIDE
 * navigation.
 *
 * Those pages are only reached by the programmatic `navigateTo` that runs right
 * after the reservation POST. GA4's automatic (Enhanced Measurement) page_view
 * does NOT fire for that navigation — verified live: a completed reservation
 * lands on `/reservado/<code>` but GA4 never records the page, so
 * `reserva_confirmada` (a GA4 create-rule built from a page_view whose
 * page_location contains `/reservado/`) never fires and the main conversion is
 * lost. We send the page_view ourselves.
 *
 * Skipped while hydrating (a full load / refresh / direct link), where the gtag
 * `config` snippet already sent the automatic page_view — firing again would
 * double-count the conversion. So this only fills the SPA-navigation gap.
 *
 * No-ops on the server and when gtag is absent (ad blocker, consent, etc.).
 */
export default function useResultPageView() {
  const nuxtApp = useNuxtApp();

  onMounted(async () => {
    // Full load / refresh: the gtag config already auto-sent the page_view.
    if (nuxtApp.isHydrating) return;

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== 'function') return;

    // Let useHead apply this page's <title> before we read document.title.
    await nextTick();

    gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  });
}
