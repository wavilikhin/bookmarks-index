// Space atoms and actions
import { atom, action, withAsync, withIndexedDb, type Atom } from '@reatom/core'

import { StorageKeys } from '@/lib/storage/keys'
import { userIdAtom } from '@/stores/auth/atoms'
import { generateId, createTimestamps, updateTimestamp } from '@/lib/utils/entity'
import { groupsAtom } from '@/domain/groups'
import { bookmarksAtom } from '@/domain/bookmarks'

import type { Space, CreateSpaceInput, UpdateSpaceInput } from './spaces.types'

// Entity array - each space is wrapped in its own atom for granular updates
export const spacesAtom = atom<Atom<Space>[]>([], 'spaces.atom').extend(
  withIndexedDb({ key: StorageKeys.spaces(userIdAtom()!) }),
  (target) => target().sort((a, b) => a().order - b().order)
)

/**
 * Get space atom by ID
 */
export function getSpaceById(id: string) {
  return spacesAtom().find((s) => s().id === id)
}

/**
 * Create a new space
 */
export const createSpace = action((input: CreateSpaceInput) => {
  const userId = userIdAtom()
  if (!userId) throw new Error('User not authenticated')

  const spaceDraft: Space = {
    id: generateId('space'),
    userId,
    name: input.name,
    icon: input.icon,
    color: input.color,
    order: spacesAtom().length,
    isArchived: false,
    ...createTimestamps()
  }

  spacesAtom.set((currentSpaces) => [...currentSpaces, atom(spaceDraft)])

  return spaceDraft
}, 'spaces.create')

/**
 * Update an existing space
 */
export const updateSpace = action((spaceId: string, partialSpace: UpdateSpaceInput) => {
  const spaceToUpdateAtom = spacesAtom().find((s) => s().id === spaceId)
  if (!spaceToUpdateAtom) throw new Error('Space not found')

  spaceToUpdateAtom.set((currentSpace) => ({
    ...currentSpace,
    ...partialSpace,
    ...updateTimestamp()
  }))
}, 'spaces.update')

/**
 * Delete a space (and related groups/bookmarks)
 */
export const deleteSpace = action((spaceId: string) => {
  spacesAtom.set((currentSpaces) => currentSpaces.filter((s) => s().id !== spaceId))
  groupsAtom.set((currentGroups) => currentGroups.filter((g) => g().spaceId !== spaceId))
  bookmarksAtom.set((currentBookmarks) => currentBookmarks.filter((b) => b().spaceId !== spaceId))
}, 'spaces.delete')

/**
 * Reorder spaces
 */
export const reorderSpaces = action((orderedIds: string[]) => {
  orderedIds.forEach((id, index) => {
    const spaceAtom = spacesAtom().find((s) => s().id === id)
    if (spaceAtom) {
      spaceAtom.set((currentSpace) => ({
        ...currentSpace,
        order: index,
        ...updateTimestamp()
      }))
    }
  })
}, 'spaces.reorder').extend(withAsync())
