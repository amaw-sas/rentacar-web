/**
 * Native HTML form-validation bubbles — e.g. "El valor debe ser igual o
 * posterior a …" shown by a date <input> whose value is below its `min` — are
 * browser/OS-drawn chrome. They cannot be styled (Chrome removed the
 * `::-webkit-validation-bubble*` pseudo-elements years ago) and render
 * dark-on-dark under Android Chrome's force-dark "auto dark theme", even when
 * the page declares `color-scheme: light`.
 *
 * This app does its real validation through valibot + <UForm>/<UFormField>,
 * which surface their own light-themed inline messages. The native bubble is
 * therefore never the intended feedback — it is unreadable noise. Suppress it
 * site-wide.
 *
 * The `invalid` event does NOT bubble, so we listen in the capture phase on
 * `window` to catch it for every current and future field. `preventDefault()`
 * stops the browser from popping its bubble. Field validity is untouched, so
 * UForm's schema validation and submit-blocking keep working exactly as before.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  window.addEventListener(
    'invalid',
    (event) => event.preventDefault(),
    true,
  );
});
