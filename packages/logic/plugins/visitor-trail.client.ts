/**
 * Records the visitor's pages for the chat context (see utils/visitorTrail.ts):
 * the landing path once on load, then every client-side navigation. The chat
 * forwards it so an advisor sees where the visitor came in and what they browsed.
 *
 * Local sessionStorage only — no network, and every failure is swallowed: a
 * tracker must never break the site.
 */
import { recordVisit } from '@rentacar-main/logic/utils';

export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  try {
    recordVisit(window.location.pathname);
    useRouter().afterEach((to) => recordVisit(to.path));
  } catch {
    /* tracker is best-effort */
  }
});
