import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { spaces } from './spaces'

export const groups = pgTable(
  'groups',
  {
    id: text('id').primaryKey(), // group_xxx
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    icon: text('icon'),
    order: integer('order').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index('groups_user_id_idx').on(table.userId), index('groups_space_id_idx').on(table.spaceId)]
)
