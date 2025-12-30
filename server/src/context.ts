import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { verifyClerkToken } from './lib/auth'
import { db } from './db/client'

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const authHeader = req.headers.get('authorization')
  const { userId } = await verifyClerkToken(authHeader)
  return { db, userId }
}

export type Context = Awaited<ReturnType<typeof createContext>>
