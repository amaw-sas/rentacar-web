export const logger = {
  info: (operation: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      operation,
      data
    }))
  },

  error: (operation: string, error: unknown, context?: any) => {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error)
    const errorStack = error instanceof Error
      ? error.stack
      : undefined

    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      operation,
      error: errorMessage,
      ...(errorStack && { stack: errorStack }),
      context
    }))
  },

  warn: (operation: string, data?: any) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      operation,
      data
    }))
  },

  metric: (operation: string, duration: number, metadata?: any) => {
    console.log(JSON.stringify({
      level: 'METRIC',
      timestamp: new Date().toISOString(),
      operation,
      durationMs: duration,
      metadata
    }))
  }
}
