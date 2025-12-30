import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './routers'
import { createContext } from './context'

// Run migrations on startup if enabled
async function runMigrations() {
  if (process.env.RUN_MIGRATIONS !== 'true') {
    console.log('[migrations] Skipped (RUN_MIGRATIONS != true)')
    return
  }

  const { drizzle } = await import('drizzle-orm/postgres-js')
  const { migrate } = await import('drizzle-orm/postgres-js/migrator')
  const postgres = (await import('postgres')).default

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for migrations')
  }

  console.log('[migrations] Starting database migrations...')
  const migrationClient = postgres(connectionString, { max: 1 })
  const db = drizzle(migrationClient)

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('[migrations] Completed successfully')
  } catch (error) {
    console.error('[migrations] Failed:', error)
    throw error
  } finally {
    await migrationClient.end()
  }
}

// Initialize app
const app = new Hono()

// CORS configuration - Chrome extension only in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || []
const isDev = process.env.NODE_ENV !== 'production'

app.use(
  '/*',
  cors({
    origin: (origin) => {
      // Allow Chrome extension origins (chrome-extension://xxx)
      if (origin?.startsWith('chrome-extension://')) {
        // In production, validate against configured extension IDs
        if (!isDev && allowedOrigins.length > 0) {
          return allowedOrigins.includes(origin) ? origin : null
        }
        // In dev or if no specific IDs configured, allow any extension
        return origin
      }
      // Allow configured web origins (for development)
      if (allowedOrigins.includes(origin || '')) return origin
      // Allow localhost in development
      if (isDev && origin?.includes('localhost')) return origin
      return null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS']
  })
)

// Health check endpoint (for container health checks)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'dev'
  })
})

// Readiness check endpoint (includes DB connectivity)
app.get('/ready', async (c) => {
  try {
    const { db } = await import('./db/client')
    // Simple query to check DB connection
    await db.execute('SELECT 1')
    return c.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json(
      {
        status: 'not_ready',
        database: 'disconnected',
        error: message,
        timestamp: new Date().toISOString()
      },
      503
    )
  }
})

// tRPC endpoint
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext
  })
)

// Run migrations before starting server
await runMigrations()

console.log(`[server] Starting on port ${process.env.PORT || 3000}`)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch
}

export type { AppRouter } from './routers'
