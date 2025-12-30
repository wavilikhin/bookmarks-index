// Sample space data seeding for first-time users
import { generateId, createTimestamps } from '@/lib/utils/entity'

import type { Space } from '../spaces.types'

/**
 * Generate sample spaces for a new user
 */
export function getSeedSpaces(userId: string): Space[] {
  const timestamps = createTimestamps()

  return [
    {
      id: generateId('space'),
      userId,
      name: 'Work',
      icon: '💼',
      order: 0,
      isArchived: false,
      ...timestamps
    },
    {
      id: generateId('space'),
      userId,
      name: 'Personal',
      icon: '🏠',
      order: 1,
      isArchived: false,
      ...timestamps
    },
    {
      id: generateId('space'),
      userId,
      name: 'Learning',
      icon: '📚',
      order: 2,
      isArchived: false,
      ...timestamps
    }
  ]
}
