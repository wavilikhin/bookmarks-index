import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { spaces } from './spaces'
import { groups } from './groups'

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: text('id').primaryKey(), // bookmark_xxx
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    groupId: text('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    url: text('url').notNull(),
    faviconUrl: text('favicon_url'),
    description: text('description'),
    order: integer('order').notNull().default(0),
    isPinned: boolean('is_pinned').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('bookmarks_user_id_idx').on(table.userId),
    index('bookmarks_group_id_idx').on(table.groupId),
    index('bookmarks_url_idx').on(table.url)
  ]
)
