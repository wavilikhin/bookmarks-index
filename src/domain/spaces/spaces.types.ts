// Space entity types
import type { BaseEntity } from '@/types'

// Space entity
export interface Space extends BaseEntity {
  userId: string
  name: string
  icon: string // Emoji (e.g., "💼")
  color?: string // Optional accent color
  order: number
  isArchived: boolean
}

// Input types for CRUD operations
export type CreateSpaceInput = Pick<Space, 'name' | 'icon' | 'color'>
export type UpdateSpaceInput = Partial<Omit<Space, 'id' | 'userId' | 'createdAt'>>
