// Capture marketing attribution (click-ids + utm + external referrer) on each
// client load and persist it last-touch for exactly 30 days in localStorage, so the
// reservation payload can forward it to the dashboard as the `attribution`
// object. See issue #121 and the receiver contract (Apéndice A de
// rentacar-dashboard#113). The capture itself lives in `packages/logic`
// (store action + pure util), shared by the three brands; only this trigger
// is per-package because Nuxt plugins are not part of the layer.
export default defineNuxtPlugin(() => {
  try {
    useStoreReservationForm().captureAttribution()
  } catch {
    /* never block hydration on attribution capture */
  }
})
