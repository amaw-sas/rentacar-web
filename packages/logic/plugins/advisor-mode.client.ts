/**
 * Activates the sales-advisor mode from `?asesor=<code>` on ANY page: once on
 * the initial load, then on every client-side navigation that carries the param.
 * Consumers read the result through useAdvisorMode().
 *
 * The start waits for `onNuxtReady` (after hydration, so state changes never
 * cause mismatches and the toaster is ready) AND `router.isReady()`, so it never
 * reads the landing query before the router has resolved it. A navigation that
 * carries `?asesor` before the start is kept and applied by the start. Visitors (no param, nothing stored) make no network call.
 * See utils/advisor/advisorSession.ts for the rules. Failures never break the site.
 */
import type { LocationQuery } from 'vue-router';
import { createAdvisorSession } from '@rentacar-main/logic/utils/advisor/advisorSession';

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return;

  try {
    const router = useRouter();
    const advisor = useState<{ code: string; name: string } | null>('rentacar:advisor', () => null);
    let session: ReturnType<typeof createAdvisorSession> | undefined;
    // A navigation with ?asesor that lands before the start (onNuxtReady waits
    // for idle) would otherwise be lost: the start applies it instead.
    let pending: LocationQuery | undefined;

    onNuxtReady(async () => {
      try {
        await router.isReady();
        const toast = nuxtApp.runWithContext(() => useToast());
        session = createAdvisorSession({
          setAdvisor: (a) => {
            advisor.value = a;
          },
          replaceQuery: (query) => {
            void router.replace({ query });
          },
          notify: (title) => {
            toast.add({ title, color: 'error' });
          },
        });
        // Only the code is carried over from an earlier navigation: the strip must
        // act on the route the user is on now, never restore an older query.
        const current = router.currentRoute.value.query;
        const carried = current.asesor === undefined && pending ? { asesor: pending.asesor } : {};
        session.start({ ...current, ...carried });
        pending = undefined;
      } catch {
        /* advisor mode is best-effort */
      }
    });

    // afterEach also fires for the initial navigation, before the start: the
    // session does not exist yet, so the landing param is applied only by start().
    router.afterEach((to, _from, failure) => {
      if (failure) return;
      if (session) session.onNavigate(to.query);
      else if (to.query.asesor !== undefined) pending = to.query;
    });
  } catch {
    /* advisor mode is best-effort */
  }
});
