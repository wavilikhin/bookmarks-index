// Group atoms
import { atom, withIndexedDb, type Atom } from '@reatom/core'
import { StorageKeys } from '@/lib/storage/keys'
// Group CRUD actions
import { action, withAsync } from '@reatom/core'
import { generateId, createTimestamps, updateTimestamp } from '@/lib/utils/entity'
import type { Group, CreateGroupInput, UpdateGroupInput } from './group.types'
import { userIdAtom } from '@/stores/auth/atoms'
import { bookmarksAtom } from '@/domain/bookmarks'

// Entity array
export const groupsAtom = atom<Atom<Group>[]>([], 'groups.groups').extend(
  withIndexedDb({ key: StorageKeys.groups(userIdAtom()!) })
)

/**
 * Create a new group
 */
export const createGroup = action((newGroup: CreateGroupInput) => {
  const userId = userIdAtom()
  // TODO: create UnauthorizedError instance and catch it to redirect to login page
  if (!userId) throw new Error('User not authenticated')

  const groupDraft: Group = {
    id: generateId('group'),
    userId,
    spaceId: newGroup.spaceId,
    name: newGroup.name,
    icon: newGroup.icon,
    order: groupsAtom().filter((g) => g().spaceId === newGroup.spaceId).length,
    isArchived: false,
    ...createTimestamps()
  }

  groupsAtom.set((currentGroups) => [...currentGroups, atom(groupDraft)])
  return groupDraft.id
}, 'groups.createGroup')

/**
 * Update an existing group
 */
export const updateGroup = action(async (id: string, input: UpdateGroupInput) => {
  const groupToUpdateAtom = groupsAtom().find((g) => g().id === id)
  if (!groupToUpdateAtom) throw new Error('Group not found')

  groupToUpdateAtom.set((currentGroup) => ({ ...currentGroup, ...input, ...updateTimestamp() }))
}, 'groups.updateGroup').extend(withAsync())

/**
 * Delete a group
 */
export const deleteGroup = action(async (groupId: string) => {
  groupsAtom.set((currentGroups) => currentGroups.filter((g) => g().id !== groupId))
  bookmarksAtom.set((currentBookmarks) => currentBookmarks.filter((b) => b().groupId !== groupId))
}, 'groups.deleteGroup').extend(withAsync())
