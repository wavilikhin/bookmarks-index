// Core entity types for the bookmark management system

// Base entity with common fields
export interface BaseEntity {
  id: string // Prefixed nanoid (e.g., "space_x7k2m9p4")
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
}

// User settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  defaultSpaceId?: string
}

// User entity
export interface User extends BaseEntity {
  username: string
  email?: string
  avatarUrl?: string
  settings: UserSettings
}

// Re-export Space types from domain
export type { Space, CreateSpaceInput, UpdateSpaceInput } from '@/domain/spaces'

// Re-export Group types from domain
export type { Group, CreateGroupInput, UpdateGroupInput } from '@/domain/groups'

// UI state types
export type EntityType = 'space' | 'group' | 'bookmark'

// Re-export Bookmark types from domain
export type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from '@/domain/bookmarks'

export type ModalType =
  | 'createSpace'
  | 'editSpace'
  | 'createGroup'
  | 'editGroup'
  | 'createBookmark'
  | 'editBookmark'
  | 'deleteConfirm'
  | 'settings'
  | null

export interface ModalState {
  type: ModalType
  entity?: import('@/domain/spaces').Space | import('@/domain/groups').Group | import('@/domain/bookmarks').Bookmark
}
