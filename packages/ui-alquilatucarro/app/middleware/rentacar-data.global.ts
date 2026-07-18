export default defineNuxtRouteMiddleware(async (to) => {
  if (routeNeedsRentacarData(to.path)) {
    await useRentacarData()
  }
})
