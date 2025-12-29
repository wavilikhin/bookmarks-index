import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { reatomComponent, useWrap } from '@reatom/react'
import { SpacesSidebar } from './ui/spaces-sidebar'
import { GroupTabs } from './ui/group-tabs'
import { BookmarkGrid } from './ui/bookmark-grid'
import { UserMenu } from './ui/user-menu'
import { AddEditModal } from './ui/add-edit-modal'
import { EmptyState } from './ui/empty-state'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogMedia
} from '@/shared/ui'
import type { Space, Group, Bookmark, EntityType } from '@/types'

// Reatom atoms and actions
import { activeSpaceIdAtom, selectedGroupIdAtom } from '@/stores/ui/atoms'
import { createSpace, updateSpace, deleteSpace, spacesAtom } from '@/domain/spaces'
import { groupsAtom, createGroup, updateGroup, deleteGroup } from '@/domain/groups'
import { bookmarksAtom, createBookmark, deleteBookmark, updateBookmark } from '@/domain/bookmarks'
import { setActiveSpace, setSelectedGroup } from '@/stores'

interface ModalState {
  isOpen: boolean
  mode: 'create' | 'edit'
  entityType: EntityType
  entity?: Space | Group | Bookmark
}

interface DeleteState {
  isOpen: boolean
  entityType: EntityType
  entity?: Space | Group | Bookmark
}

/**
 * NewTabPage - Main layout component for the bookmark manager
 *
 * Architecture:
 * - Left sidebar: Spaces navigation
 * - Top: Group tabs + User menu
 * - Center: Bookmark grid
 *
 * State management uses Reatom stores with IndexedDB persistence.
 * Authentication is handled by Clerk (wrapped in AuthGuard).
 */
export const MainScreen = reatomComponent(() => {
  // UI state from atoms
  const activeSpaceId = activeSpaceIdAtom()
  const selectedGroupId = selectedGroupIdAtom()

  const allSpaces = spacesAtom()
  const allGroups = groupsAtom()
  const allBookmarks = bookmarksAtom()

  // Filter groups and bookmarks based on selection
  const groups = activeSpaceId ? allGroups.filter((g) => g().spaceId === activeSpaceId) : []
  const bookmarks = selectedGroupId ? allBookmarks.filter((b) => b().groupId === selectedGroupId) : []

  // Modal states
  const [modalState, setModalState] = React.useState<ModalState>({
    isOpen: false,
    mode: 'create',
    entityType: 'space'
  })
  const [deleteState, setDeleteState] = React.useState<DeleteState>({
    isOpen: false,
    entityType: 'space'
  })

  // 1. Set initial active space when spaces load

  // 2. Set initial selected group when space changes or groups load

  // 3. Reset selected group when space changes
  // Modal handlers
  const openCreateModal = (entityType: EntityType) => {
    setModalState({ isOpen: true, mode: 'create', entityType })
  }

  const openEditModal = (entityType: EntityType, entity: Space | Group | Bookmark) => {
    setModalState({ isOpen: true, mode: 'edit', entityType, entity })
  }

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }

  const openDeleteDialog = (entityType: EntityType, entity: Space | Group | Bookmark) => {
    setDeleteState({ isOpen: true, entityType, entity })
  }

  const closeDeleteDialog = () => {
    setDeleteState((prev) => ({ ...prev, isOpen: false }))
  }

  // CRUD handlers
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      if (modalState.mode === 'create') {
        switch (modalState.entityType) {
          case 'space': {
            const newSpace = createSpace({
              name: data.name,
              icon: data.icon || '📁',
              color: data.color
            })
            setActiveSpace(newSpace.id)
            break
          }
          case 'group': {
            if (activeSpaceId) {
              const newGroupId = createGroup({
                spaceId: activeSpaceId,
                name: data.name,
                icon: data.icon
              })
              setSelectedGroup(newGroupId)
            }
            break
          }
          case 'bookmark':
            if (selectedGroupId) {
              if (!activeSpaceId) return

              createBookmark({
                spaceId: activeSpaceId,
                groupId: selectedGroupId,
                title: data.title,
                url: data.url,
                description: data.description
              })
            }
            break
        }
      } else {
        // Edit mode
        const entity = modalState.entity
        if (!entity) return

        switch (modalState.entityType) {
          case 'space':
            updateSpace(entity.id, {
              name: data.name,
              icon: data.icon,
              color: data.color
            })
            break
          case 'group':
            await updateGroup(entity.id, {
              name: data.name,
              icon: data.icon
            })
            break
          case 'bookmark':
            await updateBookmark(entity.id, {
              title: data.title,
              url: data.url,
              description: data.description
            })
            break
        }
      }
      closeModal()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleDelete = async () => {
    const entity = deleteState.entity
    if (!entity) return

    try {
      switch (deleteState.entityType) {
        case 'space': {
          deleteSpace(entity.id)
          // Select another space if available
          const remainingSpaces = allSpaces.filter((s) => s().id !== entity.id)
          if (remainingSpaces.length > 0) {
            setActiveSpace(remainingSpaces[0]().id)
          } else {
            setActiveSpace(null)
          }
          break
        }
        case 'group': {
          deleteGroup(entity.id)
          // Select another group if available
          const remainingGroups = groups.filter((g) => g()!.id !== entity.id)
          if (remainingGroups.length > 0) {
            setSelectedGroup(remainingGroups[0]().id)
          } else {
            setSelectedGroup(null)
          }
          break
        }
        case 'bookmark':
          await deleteBookmark(entity.id)
          break
      }
      closeDeleteDialog()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  // Determine empty state
  const getEmptyState = () => {
    if (allSpaces.length === 0) return 'no-spaces'
    if (groups.length === 0) return 'no-groups'
    if (bookmarks.length === 0) return 'no-bookmarks'
    return null
  }

  const emptyState = getEmptyState()

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left sidebar - Spaces */}
      <SpacesSidebar
        spaces={allSpaces}
        activeSpaceId={activeSpaceId}
        onSelectSpace={setActiveSpace}
        onAddSpace={() => openCreateModal('space')}
        onEditSpace={(space) => openEditModal('space', space)}
        onDeleteSpace={(space) => openDeleteDialog('space', space)}
      />

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar - Groups tabs + User menu */}
        <header className="flex items-center justify-between border-b border-border/50 bg-background">
          <div className="flex-1">
            {activeSpaceId && (
              <GroupTabs
                groups={groups}
                activeGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroup}
                onAddGroup={() => openCreateModal('group')}
                onEditGroup={(group) => openEditModal('group', group)}
                onDeleteGroup={(group) => openDeleteDialog('group', group)}
              />
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2 px-4 py-2">
            <UserMenu onSettings={() => console.log('Open settings')} theme={theme} onThemeChange={setTheme} />
          </div>
        </header>

        {/* Content area - Bookmark grid or empty state */}
        <div className="flex flex-1 overflow-auto">
          {emptyState ? (
            <EmptyState
              type={emptyState}
              onAction={() => {
                if (emptyState === 'no-spaces') openCreateModal('space')
                else if (emptyState === 'no-groups') openCreateModal('group')
                else openCreateModal('bookmark')
              }}
            />
          ) : (
            <BookmarkGrid
              bookmarks={bookmarks}
              onAddBookmark={() => openCreateModal('bookmark')}
              onEditBookmark={(bookmark) => openEditModal('bookmark', bookmark)}
              onDeleteBookmark={(bookmark) => openDeleteDialog('bookmark', bookmark)}
            />
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <AddEditModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        entityType={modalState.entityType}
        mode={modalState.mode}
        entity={modalState.entity}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteState.isOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash2 className="size-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {deleteState.entityType}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState.entityType === 'space' && (
                <>
                  This will permanently delete this space and all its groups and bookmarks. This action cannot be
                  undone.
                </>
              )}
              {deleteState.entityType === 'group' && (
                <>This will permanently delete this group and all its bookmarks. This action cannot be undone.</>
              )}
              {deleteState.entityType === 'bookmark' && (
                <>This will permanently delete this bookmark. This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}, 'NewTabPage')
