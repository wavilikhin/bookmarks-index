import { verifyToken } from '@clerk/backend'
import type { MiddlewareHandler } from 'hono'
import { logger } from './logger'

const authLogger = logger.child('auth')

export async function verifyClerkToken(authHeader: string | null): Promise<{ userId: string | null }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    authLogger.debug('No valid auth header provided')
    return { userId: null }
  }

  const token = authHeader.slice(7) // "Bearer ".length === 7

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })
    authLogger.debug('Token verified successfully', { userId: payload.sub })
    return { userId: payload.sub }
  } catch (error) {
    authLogger.warn('Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return { userId: null }
  }
}

/**
 * Hono middleware that extracts userId from Authorization header
 * and stores it in Hono's context for use by other middleware (e.g., request logger)
 */
export function authMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('authorization') ?? null
    const { userId } = await verifyClerkToken(authHeader)

    if (userId) {
      c.set('userId', userId)
    }

    await next()
  }
}
