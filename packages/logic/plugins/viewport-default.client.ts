/**
 * Nuxt renders the default `<meta name="viewport">` (app.head) on the server
 * only, so the client head has no entry for it. A page that overrides the
 * viewport with useHead — /chat opts into `interactive-widget=resizes-content`
 * so the Android keyboard shrinks the page instead of covering the header —
 * takes the tag with it when it unmounts: navigating away without a reload left
 * the document with no viewport at all (the site drawn as a zoomed-out desktop
 * page). Registering the same default on the client gives the head something to
 * fall back to; a page's own useHead still wins because it is pushed later.
 * Keep the content equal to the server default (Nuxt's built-in app.head
 * viewport; no brand overrides it today).
 */
export default defineNuxtPlugin(() => {
  useHead({
    meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  });
});
