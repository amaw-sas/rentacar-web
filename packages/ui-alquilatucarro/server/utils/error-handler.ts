import { logger } from './logger'

export class BlogApiError extends Error {
  statusCode: number
  context?: any

  constructor(message: string, statusCode: number, context?: any) {
    super(message)
    this.statusCode = statusCode
    this.context = context
    this.name = 'BlogApiError'
  }
}

export function handleBlogApiError(error: unknown, operation: string) {
  logger.error(operation, error)

  if (error instanceof BlogApiError) {
    throw createError({
      statusCode: error.statusCode,
      message: error.message,
      data: error.context
    })
  }

  // Error genérico
  throw createError({
    statusCode: 500,
    message: 'Internal server error',
    data: { operation }
  })
}
