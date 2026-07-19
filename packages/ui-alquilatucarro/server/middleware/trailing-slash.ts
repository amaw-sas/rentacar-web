import { getSlashlessContentRedirect } from '@rentacar-main/logic/utils/trailingSlashRedirect'

export default defineEventHandler((event) => {
  const target = getSlashlessContentRedirect(event.path || '', event.method, 'alquilatucarro')
  if (!target) return

  return sendRedirect(event, target, 301)
})
