import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { logger } from '../lib/logger'

const dbLogger = logger.child('database')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

dbLogger.debug('Initializing database connection')

const client = postgres(connectionString)

export const db = drizzle(client, { schema })

dbLogger.info('Database client initialized')
