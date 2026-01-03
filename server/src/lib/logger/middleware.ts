import type { MiddlewareHandler } from 'hono'
import { logger } from './index'

// Generate a simple request ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export interface RequestLoggerOptions {
  /**
   * Paths to skip logging (e.g., health checks)
   */
  skip?: string[]
}

/**
 * Hono middleware for request logging
 * Logs method, path, status, duration, request ID, and user ID
 */
export function requestLogger(options: RequestLoggerOptions = {}): MiddlewareHandler {
  const httpLogger = logger.child('http')
  const skipPaths = new Set(options.skip || [])

  return async (c, next) => {
    const { method, path } = c.req

    // Skip logging for specified paths
    if (skipPaths.has(path)) {
      return next()
    }

    const requestId = generateRequestId()
    const startTime = Date.now()

    // Add request ID to response headers for tracing
    c.header('X-Request-ID', requestId)

    // Store request ID in context for use in handlers
    c.set('requestId', requestId)

    // Log request start for tracing hung/slow requests
    httpLogger.debug('Request started', {
      requestId,
      method,
      path
    })

    try {
      await next()
    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      httpLogger.error('Request failed', error instanceof Error ? error : undefined, {
        requestId,
        method,
        path,
        duration,
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }

    const duration = Date.now() - startTime
    const status = c.res.status

    // Get user ID from context if available (set by auth)
    const userId = c.get('userId') as string | undefined

    const logData = {
      requestId,
      method,
      path,
      status,
      duration,
      ...(userId && { userId })
    }

    // Log at appropriate level based on status code
    if (status >= 500) {
      httpLogger.error('Request completed with server error', logData)
    } else if (status >= 400) {
      httpLogger.warn('Request completed with client error', logData)
    } else {
      httpLogger.info('Request completed', logData)
    }
  }
}

// Type augmentation for Hono context
declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
    userId?: string
  }
}
