// Bookmark atoms
import { atom, withIndexedDb, type Atom } from '@reatom/core'
import type { Bookmark } from './bookmarks.types'
import { StorageKeys } from '@/lib/storage/keys'
import { userIdAtom } from '@/stores/auth/atoms'
// Bookmark actions for CRUD operations
import { action } from '@reatom/core'
import { generateId, createTimestamps, updateTimestamp } from '@/lib/utils/entity'
import type { CreateBookmarkInput, UpdateBookmarkInput } from './bookmarks.types'

export const bookmarksAtom = atom<Atom<Bookmark>[]>([], 'bookmarks.atom').extend(
  withIndexedDb({ key: StorageKeys.bookmarks(userIdAtom()!) })
)

/**
 * Create a new bookmark
 */
export const createBookmark = action((newBookmark: CreateBookmarkInput) => {
  const bookmarkDraft: Bookmark = {
    id: generateId('bookmark'),
    userId: userIdAtom()!,
    spaceId: newBookmark.spaceId,
    groupId: newBookmark.groupId,
    title: newBookmark.title,
    url: newBookmark.url,
    description: newBookmark.description,
    order: bookmarksAtom().filter((b) => b().groupId === newBookmark.groupId).length,
    isPinned: false,
    isArchived: false,
    ...createTimestamps()
  }

  bookmarksAtom.set((currentBookmarks) => [...currentBookmarks, atom(bookmarkDraft)])
}, 'bookmarks.create')

/**
 * Update an existing bookmark
 */
export const updateBookmark = action(async (bookmarkId: string, partialBookmark: UpdateBookmarkInput) => {
  const bookmarkToUpdateAtom = bookmarksAtom().find((b) => b().id === bookmarkId)
  if (!bookmarkToUpdateAtom) throw new Error('Bookmark not found')

  bookmarkToUpdateAtom.set((currentBookmark) => ({ ...currentBookmark, ...partialBookmark, ...updateTimestamp() }))
}, 'bookmarks.update')

/**
 * Delete a bookmark (soft or hard delete)
 */
export const deleteBookmark = action(async (bookmarkId: string) => {
  bookmarksAtom.set((currentBookmarks) => currentBookmarks.filter((b) => b().id !== bookmarkId))
}, 'bookmarks.delete')
