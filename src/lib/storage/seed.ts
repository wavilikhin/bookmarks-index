// Sample data seeding for first-time users
import { getSeedBookmarks } from '@/domain/bookmarks'
import { getSeedGroups } from '@/domain/groups'
import { getSeedSpaces } from '@/domain/spaces'

// Re-export space seed function from domain
export { getSeedSpaces } from '@/domain/spaces'

// Re-export bookmark seed function from domain
export { getSeedBookmarks } from '@/domain/bookmarks'

// Re-export groups seed function from domain
export { getSeedGroups } from '@/domain/groups'

/**
 * Seed all user data (called on first login)
 */
export function createSeedData(userId: string) {
  const spaces = getSeedSpaces(userId)
  const groups = getSeedGroups(userId, spaces)
  const bookmarks = getSeedBookmarks(userId, spaces, groups)

  return { spaces, groups, bookmarks }
}
