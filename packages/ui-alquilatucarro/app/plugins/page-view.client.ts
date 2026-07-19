import { createSpaPageViewTracker } from '@rentacar-main/logic/utils'

export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute()
  const { franchise } = useAppConfig()
  const tracker = createSpaPageViewTracker(
    franchise.shortname as string,
    document.referrer,
  )

  const trackFinalRoute = () => {
    queueMicrotask(() => {
      tracker.track({
        routeKey: route.fullPath,
        pageLocation: window.location.href,
        pageTitle: document.title,
      })
    })
  }

  // app:mounted is the initial-load fallback; page:finish covers the resolved
  // first page and every later Nuxt navigation. The shared tracker deduplicates
  // whichever initial hook wins.
  nuxtApp.hook('app:mounted', trackFinalRoute)
  nuxtApp.hook('page:finish', trackFinalRoute)
})
