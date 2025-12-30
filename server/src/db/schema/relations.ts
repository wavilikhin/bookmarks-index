import { relations } from 'drizzle-orm'
import { users } from './users'
import { spaces } from './spaces'
import { groups } from './groups'
import { bookmarks } from './bookmarks'

export const usersRelations = relations(users, ({ many }) => ({
  spaces: many(spaces),
  groups: many(groups),
  bookmarks: many(bookmarks)
}))

export const spacesRelations = relations(spaces, ({ one, many }) => ({
  user: one(users, {
    fields: [spaces.userId],
    references: [users.id]
  }),
  groups: many(groups),
  bookmarks: many(bookmarks)
}))

export const groupsRelations = relations(groups, ({ one, many }) => ({
  user: one(users, {
    fields: [groups.userId],
    references: [users.id]
  }),
  space: one(spaces, {
    fields: [groups.spaceId],
    references: [spaces.id]
  }),
  bookmarks: many(bookmarks)
}))

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id]
  }),
  space: one(spaces, {
    fields: [bookmarks.spaceId],
    references: [spaces.id]
  }),
  group: one(groups, {
    fields: [bookmarks.groupId],
    references: [groups.id]
  })
}))
