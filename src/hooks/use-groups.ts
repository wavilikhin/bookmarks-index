// Groups hook - Reatom migration
// Note: These hooks are designed to be used inside reatomComponent wrappers
// where atom calls are automatically tracked

import { groupsAtom } from "@/stores/data/atoms"
import { getGroupsBySpaceId } from "@/stores/data/computed"
import { selectedGroupIdAtom } from "@/stores/ui/atoms"
import { userAtom } from "@/stores/auth/atoms"
import {
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
} from "@/stores/data/actions"
import { setSelectedGroup } from "@/stores/ui/actions"
import type { CreateGroupInput, UpdateGroupInput } from "@/types"

/**
 * useGroups - Returns groups for a specific space
 * Must be called inside a reatomComponent
 */
export function useGroups(spaceId: string | null) {
  if (!spaceId) return []
  return getGroupsBySpaceId(spaceId)()
}

/**
 * useSelectedGroup - Returns the currently selected group
 * Must be called inside a reatomComponent
 */
export function useSelectedGroup() {
  const selectedGroupId = selectedGroupIdAtom()
  const groups = groupsAtom()

  return selectedGroupId ? groups.find((g) => g.id === selectedGroupId) : undefined
}

/**
 * useGroupActions - Returns CRUD actions for groups
 * Can be called inside or outside reatomComponent
 */
export function useGroupActions() {
  const user = userAtom()

  return {
    createGroup: async (input: CreateGroupInput) => {
      if (!user) throw new Error("User not authenticated")
      return createGroup(user.id, input)
    },
    updateGroup: async (id: string, input: UpdateGroupInput) => {
      return updateGroup(id, input)
    },
    deleteGroup: async (id: string, hard?: boolean) => {
      if (!user) throw new Error("User not authenticated")
      return deleteGroup(user.id, id, hard)
    },
    reorderGroups: async (spaceId: string, orderedIds: string[]) => {
      if (!user) throw new Error("User not authenticated")
      return reorderGroups(user.id, spaceId, orderedIds)
    },
    setSelectedGroup: (groupId: string | null) => setSelectedGroup(groupId),
  }
}
