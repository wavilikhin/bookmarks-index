import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './routers'
import { createContext } from './context'

const app = new Hono()

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']

app.use(
  '/*',
  cors({
    origin: (origin) => {
      // Allow Chrome extension origins (chrome-extension://xxx)
      if (origin?.startsWith('chrome-extension://')) return origin
      // Allow configured origins
      if (allowedOrigins.includes(origin || '')) return origin
      return null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS']
  })
)

// Health check
app.get('/health', (c) => c.text('OK'))

// tRPC endpoint
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext
  })
)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch
}

export type { AppRouter } from './routers'
