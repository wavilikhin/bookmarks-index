import { router, publicProcedure } from '../trpc'

// Placeholder router - will be expanded in Phase 2
export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok' }
  })
})

export type AppRouter = typeof appRouter
