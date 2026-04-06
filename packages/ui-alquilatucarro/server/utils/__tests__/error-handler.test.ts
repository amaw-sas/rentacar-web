import { describe, it, expect } from 'vitest'
import { BlogApiError, handleBlogApiError } from '../error-handler'

describe('BlogApiError', () => {
  it('should create error with statusCode and context', () => {
    const error = new BlogApiError('Invalid format', 400, { format: 'gif' })

    expect(error.message).toBe('Invalid format')
    expect(error.statusCode).toBe(400)
    expect(error.context).toEqual({ format: 'gif' })
    expect(error.name).toBe('BlogApiError')
  })
})

describe('handleBlogApiError', () => {
  it('should throw createError with BlogApiError details', () => {
    const blogError = new BlogApiError('Test error', 403, { ip: '1.2.3.4' })

    expect(() => {
      handleBlogApiError(blogError, 'test-operation')
    }).toThrow()
  })

  it('should throw generic 500 error for unknown errors', () => {
    const genericError = new Error('Unknown error')

    expect(() => {
      handleBlogApiError(genericError, 'test-operation')
    }).toThrow()
  })
})
