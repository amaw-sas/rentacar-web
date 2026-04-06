import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  let consoleLogSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('info', () => {
    it('should log structured JSON with required fields', () => {
      logger.info('test-operation', { custom: 'data' })

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(loggedData).toMatchObject({
        level: 'INFO',
        operation: 'test-operation',
        data: { custom: 'data' }
      })
      expect(loggedData.timestamp).toBeDefined()
    })
  })

  describe('error', () => {
    it('should handle Error instances correctly', () => {
      const error = new Error('Test error')
      logger.error('test-op', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(loggedData).toMatchObject({
        level: 'ERROR',
        operation: 'test-op',
        error: 'Test error'
      })
      expect(loggedData.stack).toBeDefined()
    })

    it('should handle non-Error values safely', () => {
      logger.error('test-op', 'string error')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(loggedData).toMatchObject({
        level: 'ERROR',
        operation: 'test-op',
        error: 'string error'
      })
      expect(loggedData.stack).toBeUndefined()
    })
  })

  describe('metric', () => {
    it('should log metrics with duration', () => {
      logger.metric('upload-image', 250, { size: '2MB' })

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(loggedData).toMatchObject({
        level: 'METRIC',
        operation: 'upload-image',
        durationMs: 250,
        metadata: { size: '2MB' }
      })
    })
  })
})
