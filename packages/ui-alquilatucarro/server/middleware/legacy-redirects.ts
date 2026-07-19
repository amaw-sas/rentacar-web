import { getLegacyRedirectTarget } from '../utils/legacyRedirect'

export default defineEventHandler((event) => {
  const target = getLegacyRedirectTarget(event.path || '', event.method)
  if (!target) return

  return sendRedirect(event, target, 301)
})
