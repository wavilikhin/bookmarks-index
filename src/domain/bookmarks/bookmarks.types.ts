// Bookmark entity types
import type { BaseEntity } from '@/types'

// Bookmark entity
export interface Bookmark extends BaseEntity {
  userId: string // Denormalized
  spaceId: string // Denormalized
  groupId: string
  title: string
  url: string
  faviconUrl?: string
  description?: string
  order: number
  isPinned: boolean
  isArchived: boolean
}

// Input types for CRUD operations
export type CreateBookmarkInput = Pick<Bookmark, 'spaceId' | 'groupId' | 'title' | 'url' | 'description'>
export type UpdateBookmarkInput = Partial<Omit<Bookmark, 'id' | 'userId' | 'createdAt'>>
