export default defineEventHandler((event) => {
  const reserveCode = getRouterParam(event, 'reserveCode')

  if (reserveCode === 'FOUND123') return { exists: true }
  if (reserveCode === 'MISSING123') return { exists: false }

  throw createError({
    statusCode: 503,
    statusMessage: 'Validator unavailable in HTTP fixture',
  })
})
