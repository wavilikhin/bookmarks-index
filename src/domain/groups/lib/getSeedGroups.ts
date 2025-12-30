// Sample group data seeding
import { generateId, createTimestamps } from '@/lib/utils/entity'
import type { Group } from '../group.types'
import type { Space } from '@/types'

/**
 * Generate sample groups for seed spaces
 */
export function getSeedGroups(userId: string, spaces: Space[]): Group[] {
  const timestamps = createTimestamps()
  const workSpace = spaces.find((s) => s.name === 'Work')
  const personalSpace = spaces.find((s) => s.name === 'Personal')
  const learningSpace = spaces.find((s) => s.name === 'Learning')

  const groups: Group[] = []

  if (workSpace) {
    groups.push(
      {
        id: generateId('group'),
        userId,
        spaceId: workSpace.id,
        name: 'Development',
        order: 0,
        isArchived: false,
        ...timestamps
      },
      {
        id: generateId('group'),
        userId,
        spaceId: workSpace.id,
        name: 'Design',
        order: 1,
        isArchived: false,
        ...timestamps
      },
      {
        id: generateId('group'),
        userId,
        spaceId: workSpace.id,
        name: 'Documentation',
        order: 2,
        isArchived: false,
        ...timestamps
      }
    )
  }

  if (personalSpace) {
    groups.push(
      {
        id: generateId('group'),
        userId,
        spaceId: personalSpace.id,
        name: 'Social',
        order: 0,
        isArchived: false,
        ...timestamps
      },
      {
        id: generateId('group'),
        userId,
        spaceId: personalSpace.id,
        name: 'Shopping',
        order: 1,
        isArchived: false,
        ...timestamps
      }
    )
  }

  if (learningSpace) {
    groups.push(
      {
        id: generateId('group'),
        userId,
        spaceId: learningSpace.id,
        name: 'Courses',
        order: 0,
        isArchived: false,
        ...timestamps
      },
      {
        id: generateId('group'),
        userId,
        spaceId: learningSpace.id,
        name: 'Articles',
        order: 1,
        isArchived: false,
        ...timestamps
      }
    )
  }

  return groups
}
