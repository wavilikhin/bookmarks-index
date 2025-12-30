import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const spaces = pgTable(
  'spaces',
  {
    id: text('id').primaryKey(), // space_xxx
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon').notNull().default('📁'),
    color: text('color'),
    order: integer('order').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('spaces_user_id_idx').on(table.userId),
    index('spaces_user_order_idx').on(table.userId, table.order)
  ]
)
