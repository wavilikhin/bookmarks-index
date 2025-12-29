// Group entity types
import type { BaseEntity } from '@/types'

// Group entity
export interface Group extends BaseEntity {
  userId: string // Denormalized for queries
  spaceId: string
  name: string
  icon?: string
  order: number
  isArchived: boolean
}

// Input types for CRUD operations
export type CreateGroupInput = Pick<Group, 'spaceId' | 'name' | 'icon'>
export type UpdateGroupInput = Partial<Omit<Group, 'id' | 'userId' | 'createdAt'>>
