import {
  analyticsPageType,
  createContactClickHandler,
} from '@rentacar-main/logic/utils'

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const { franchise } = useAppConfig()
  const handler = createContactClickHandler(franchise.shortname as string, () => {
    const rawCity = route.params.city
    const city = Array.isArray(rawCity) ? rawCity[0] : rawCity
    const inferredPageType = analyticsPageType(route.path)
    return {
      pageType: inferredPageType === 'other' && city ? 'city' : inferredPageType,
      ...(typeof city === 'string' && city ? { city } : {}),
    }
  })
  document.addEventListener('click', handler, true)
})
