/**
 * Captures the bot conversation id (`?chat=<id>` on the link the bot sends) into
 * the reservation store on the initial load and on every client-side navigation,
 * so a later link with another `chat` replaces the earlier one (last wins). The
 * store persists it (utils/chatRef/chatRefStorage.ts) and the record composable
 * forwards it as `chat_ref`. Shared by the three brands through the layer.
 *
 * No network, and every failure is swallowed: a tracker must never break the site.
 */
import { CHAT_REF_QUERY_KEY } from '@rentacar-main/logic/utils';

export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  try {
    const store = useStoreReservationForm();
    store.captureChatRef(new URLSearchParams(window.location.search).get(CHAT_REF_QUERY_KEY));
    // afterEach also fires for the initial navigation (idempotent: same value);
    // failures (aborted/duplicated navigations) are not landings.
    useRouter().afterEach((to, _from, failure) => {
      if (!failure) store.captureChatRef(to.query[CHAT_REF_QUERY_KEY]);
    });
  } catch {
    /* tracker is best-effort */
  }
});
