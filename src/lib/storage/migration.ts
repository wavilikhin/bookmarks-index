// Migration service for local IndexedDB to server migration
import { get, set, del } from 'idb-keyval'

import { api } from '@/api'
import { StorageKeys } from './keys'

import type { Space } from '@/domain/spaces'
import type { Group } from '@/domain/groups'
import type { Bookmark } from '@/domain/bookmarks'

// Migration status key prefix
const MIGRATION_KEY = 'bookmarks:migration:status'

export type MigrationStatus = 'pending' | 'completed' | 'skipped'

export type MigrationChoice = 'upload' | 'use_cloud' | 'keep_both'

export interface MigrationState {
  status: MigrationStatus
  hasLocalData: boolean
  hasServerData: boolean
  localDataCounts: {
    spaces: number
    groups: number
    bookmarks: number
  }
}

/**
 * Get migration status key for a user
 */
function getMigrationKey(userId: string): string {
  return `${MIGRATION_KEY}:${userId}`
}

/**
 * Get migration status for a user
 */
export async function getMigrationStatus(userId: string): Promise<MigrationStatus> {
  const status = await get(getMigrationKey(userId))
  return (status as MigrationStatus) || 'pending'
}

/**
 * Set migration status for a user
 */
export async function setMigrationStatus(userId: string, status: MigrationStatus): Promise<void> {
  await set(getMigrationKey(userId), status)
}

/**
 * Get local data from IndexedDB
 */
export async function getLocalData(userId: string): Promise<{
  spaces: Space[]
  groups: Group[]
  bookmarks: Bookmark[]
}> {
  const [spaces, groups, bookmarks] = await Promise.all([
    get(StorageKeys.spaces(userId)),
    get(StorageKeys.groups(userId)),
    get(StorageKeys.bookmarks(userId))
  ])

  return {
    spaces: Array.isArray(spaces) ? (spaces as Space[]) : [],
    groups: Array.isArray(groups) ? (groups as Group[]) : [],
    bookmarks: Array.isArray(bookmarks) ? (bookmarks as Bookmark[]) : []
  }
}

/**
 * Check if user has local data in IndexedDB
 */
export async function checkLocalData(userId: string): Promise<{
  hasData: boolean
  counts: { spaces: number; groups: number; bookmarks: number }
}> {
  const { spaces, groups, bookmarks } = await getLocalData(userId)

  return {
    hasData: spaces.length > 0 || groups.length > 0 || bookmarks.length > 0,
    counts: {
      spaces: spaces.length,
      groups: groups.length,
      bookmarks: bookmarks.length
    }
  }
}

/**
 * Check if user has server data
 */
export async function checkServerData(): Promise<boolean> {
  try {
    const status = await api.sync.status.query()
    return status.hasServerData
  } catch (error) {
    console.error('Failed to check server data status:', error)
    return false
  }
}

/**
 * Check full migration state for a user
 */
export async function checkMigrationState(userId: string): Promise<MigrationState> {
  const migrationStatus = await getMigrationStatus(userId)

  // If already completed or skipped, return early
  if (migrationStatus !== 'pending') {
    return {
      status: migrationStatus,
      hasLocalData: false,
      hasServerData: false,
      localDataCounts: { spaces: 0, groups: 0, bookmarks: 0 }
    }
  }

  // Check both local and server data
  const [localCheck, hasServerData] = await Promise.all([checkLocalData(userId), checkServerData()])

  return {
    status: 'pending',
    hasLocalData: localCheck.hasData,
    hasServerData,
    localDataCounts: localCheck.counts
  }
}

/**
 * Determine if migration dialog should be shown
 * Only show if:
 * 1. Migration status is 'pending'
 * 2. User has local data
 */
export async function shouldShowMigrationDialog(userId: string): Promise<boolean> {
  const state = await checkMigrationState(userId)
  return state.status === 'pending' && state.hasLocalData
}

/**
 * Upload local data to server (migration)
 */
export async function migrateToServer(userId: string): Promise<void> {
  const { spaces, groups, bookmarks } = await getLocalData(userId)

  // Prepare data for server - strip userId as server will add it
  const serverSpaces = spaces.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    color: s.color || null,
    order: s.order,
    isArchived: s.isArchived,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }))

  const serverGroups = groups.map((g) => ({
    id: g.id,
    spaceId: g.spaceId,
    name: g.name,
    icon: g.icon || null,
    order: g.order,
    isArchived: g.isArchived,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt
  }))

  const serverBookmarks = bookmarks.map((b) => ({
    id: b.id,
    spaceId: b.spaceId,
    groupId: b.groupId,
    title: b.title,
    url: b.url,
    faviconUrl: b.faviconUrl || null,
    description: b.description || null,
    order: b.order,
    isPinned: b.isPinned,
    isArchived: b.isArchived,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt
  }))

  await api.sync.push.mutate({
    spaces: serverSpaces,
    groups: serverGroups,
    bookmarks: serverBookmarks
  })

  // Mark migration as completed
  await setMigrationStatus(userId, 'completed')
}

/**
 * Normalize timestamp to ISO string
 */
function normalizeTimestamp(timestamp: string | Date): string {
  return typeof timestamp === 'string' ? timestamp : timestamp.toISOString()
}

/**
 * Pull data from server and store locally (for cache)
 */
export async function pullFromServer(userId: string): Promise<{
  spaces: Space[]
  groups: Group[]
  bookmarks: Bookmark[]
}> {
  const data = await api.sync.pull.query()

  // Convert server data to local format with userId
  const spaces = data.spaces.map((s: { createdAt: string | Date; updatedAt: string | Date }) => ({
    ...s,
    userId,
    createdAt: normalizeTimestamp(s.createdAt),
    updatedAt: normalizeTimestamp(s.updatedAt)
  })) as Space[]

  const groups = data.groups.map((g: { createdAt: string | Date; updatedAt: string | Date }) => ({
    ...g,
    userId,
    createdAt: normalizeTimestamp(g.createdAt),
    updatedAt: normalizeTimestamp(g.updatedAt)
  })) as Group[]

  const bookmarks = data.bookmarks.map((b: { createdAt: string | Date; updatedAt: string | Date }) => ({
    ...b,
    userId,
    createdAt: normalizeTimestamp(b.createdAt),
    updatedAt: normalizeTimestamp(b.updatedAt)
  })) as Bookmark[]

  // Store in IndexedDB as cache
  await Promise.all([
    set(StorageKeys.spaces(userId), spaces),
    set(StorageKeys.groups(userId), groups),
    set(StorageKeys.bookmarks(userId), bookmarks)
  ])

  // Mark migration as completed
  await setMigrationStatus(userId, 'completed')

  return { spaces, groups, bookmarks }
}

/**
 * Discard local data and use server data
 */
export async function useServerData(userId: string): Promise<void> {
  // Clear local data
  await Promise.all([
    del(StorageKeys.spaces(userId)),
    del(StorageKeys.groups(userId)),
    del(StorageKeys.bookmarks(userId))
  ])

  // Mark migration as completed (will pull from server on load)
  await setMigrationStatus(userId, 'completed')
}

/**
 * Keep both - merge local data to server (local data is pushed, server data wins on conflicts)
 */
export async function mergeData(userId: string): Promise<void> {
  // Push local data to server - server handles conflicts with onConflictDoUpdate
  await migrateToServer(userId)
}

/**
 * Skip migration (for users who don't want to migrate)
 */
export async function skipMigration(userId: string): Promise<void> {
  await setMigrationStatus(userId, 'skipped')
}

/**
 * Clear local data after successful migration
 */
export async function clearLocalData(userId: string): Promise<void> {
  await Promise.all([
    del(StorageKeys.spaces(userId)),
    del(StorageKeys.groups(userId)),
    del(StorageKeys.bookmarks(userId))
  ])
}
