import { defineConfig } from 'drizzle-kit'

// DATABASE_URL is only required for db:push, db:migrate, db:studio
// db:generate only needs the schema files
const databaseUrl = process.env.DATABASE_URL || 'postgres://placeholder:placeholder@localhost:5432/placeholder'

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl
  },
  verbose: true,
  strict: true
})
