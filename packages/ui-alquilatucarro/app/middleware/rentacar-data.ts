export default defineNuxtRouteMiddleware(async () => {
  await useRentacarData()
})
