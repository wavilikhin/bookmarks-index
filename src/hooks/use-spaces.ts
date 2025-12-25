// Spaces hook - Reatom migration
// Note: These hooks are designed to be used inside reatomComponent wrappers
// where atom calls are automatically tracked

import { sortedSpacesAtom, getSpaceById } from "@/stores/data/computed"
import { activeSpaceIdAtom } from "@/stores/ui/atoms"
import { userAtom } from "@/stores/auth/atoms"
import {
  createSpace,
  updateSpace,
  deleteSpace,
  reorderSpaces,
} from "@/stores/data/actions"
import { setActiveSpace } from "@/stores/ui/actions"
import type { CreateSpaceInput, UpdateSpaceInput } from "@/types"

/**
 * useSpaces - Returns all non-archived spaces (sorted)
 * Must be called inside a reatomComponent
 */
export function useSpaces() {
  return sortedSpacesAtom()
}

/**
 * useActiveSpace - Returns the currently active space
 * Must be called inside a reatomComponent
 */
export function useActiveSpace() {
  const activeSpaceId = activeSpaceIdAtom()
  if (!activeSpaceId) return undefined
  return getSpaceById(activeSpaceId)()
}

/**
 * useSpaceActions - Returns CRUD actions for spaces
 * Can be called inside or outside reatomComponent
 */
export function useSpaceActions() {
  const user = userAtom()

  return {
    createSpace: async (input: CreateSpaceInput) => {
      if (!user) throw new Error("User not authenticated")
      return createSpace(user.id, input)
    },
    updateSpace: async (id: string, input: UpdateSpaceInput) => {
      return updateSpace(id, input)
    },
    deleteSpace: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated")
      return deleteSpace(user.id, id, hard)
    },
    reorderSpaces: async (orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated")
      return reorderSpaces(user.id, orderedIds)
    },
    setActiveSpace: (spaceId: string | null) => setActiveSpace(spaceId),
  }
}
