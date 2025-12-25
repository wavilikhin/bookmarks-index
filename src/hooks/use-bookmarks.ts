// Bookmarks hook - Reatom migration
// Note: These hooks are designed to be used inside reatomComponent wrappers
// where atom calls are automatically tracked

import { getBookmarksByGroupId } from "@/stores/data/computed"
import { userAtom } from "@/stores/auth/atoms"
import {
  createBookmark,
  updateBookmark,
  deleteBookmark,
  reorderBookmarks,
} from "@/stores/data/actions"
import type { CreateBookmarkInput, UpdateBookmarkInput } from "@/types"

/**
 * useBookmarks - Returns bookmarks for a specific group
 * Must be called inside a reatomComponent
 */
export function useBookmarks(groupId: string | null) {
  if (!groupId) return []
  return getBookmarksByGroupId(groupId)()
}

/**
 * useBookmarkActions - Returns CRUD actions for bookmarks
 * Can be called inside or outside reatomComponent
 */
export function useBookmarkActions() {
  const user = userAtom()

  return {
    createBookmark: async (input: CreateBookmarkInput) => {
      if (!user) throw new Error("User not authenticated")
      return createBookmark(user.id, input)
    },
    updateBookmark: async (id: string, input: UpdateBookmarkInput) => {
      return updateBookmark(id, input)
    },
    deleteBookmark: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated")
      return deleteBookmark(user.id, id, hard)
    },
    reorderBookmarks: async (groupId: string, orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated")
      return reorderBookmarks(user.id, groupId, orderedIds)
    },
  }
}
