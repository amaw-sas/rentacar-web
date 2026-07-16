import { clearSeoSessionCookie } from '../../utils/seoAuth'

export default defineEventHandler((event) => {
  clearSeoSessionCookie(event)
  return { success: true }
})
