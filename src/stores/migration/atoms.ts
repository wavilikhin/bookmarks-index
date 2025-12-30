// Migration state atoms for local-to-server data migration
import { atom, action, withAsync } from '@reatom/core'

import type { MigrationState, MigrationChoice } from '@/lib/storage/migration'

// Migration state atom
export const migrationStateAtom = atom<MigrationState | null>(null, 'migration.state')

// Migration dialog visibility
export const migrationDialogOpenAtom = atom(false, 'migration.dialogOpen')

// Migration in progress flag
export const migrationInProgressAtom = atom(false, 'migration.inProgress')

// Migration error
export const migrationErrorAtom = atom<string | null>(null, 'migration.error')

// User's migration choice (null until they choose)
export const migrationChoiceAtom = atom<MigrationChoice | null>(null, 'migration.choice')

/**
 * Set migration state from check result
 */
export const setMigrationState = action((state: MigrationState | null) => {
  migrationStateAtom.set(state)
}, 'migration.setState')

/**
 * Open migration dialog
 */
export const openMigrationDialog = action(() => {
  migrationDialogOpenAtom.set(true)
}, 'migration.openDialog')

/**
 * Close migration dialog
 */
export const closeMigrationDialog = action(() => {
  migrationDialogOpenAtom.set(false)
}, 'migration.closeDialog')

/**
 * Set migration in progress
 */
export const setMigrationInProgress = action((inProgress: boolean) => {
  migrationInProgressAtom.set(inProgress)
}, 'migration.setInProgress')

/**
 * Set migration error
 */
export const setMigrationError = action((error: string | null) => {
  migrationErrorAtom.set(error)
}, 'migration.setError')

/**
 * Reset migration state (after completion or skip)
 */
export const resetMigrationState = action(() => {
  migrationStateAtom.set(null)
  migrationDialogOpenAtom.set(false)
  migrationInProgressAtom.set(false)
  migrationErrorAtom.set(null)
  migrationChoiceAtom.set(null)
}, 'migration.reset')

/**
 * Check if migration is needed and set state
 */
export const checkMigration = action(async (userId: string) => {
  const { checkMigrationState, shouldShowMigrationDialog } = await import('@/lib/storage/migration')

  const state = await checkMigrationState(userId)
  setMigrationState(state)

  const shouldShow = await shouldShowMigrationDialog(userId)
  if (shouldShow) {
    openMigrationDialog()
  }

  return { state, shouldShowDialog: shouldShow }
}, 'migration.check').extend(withAsync())

/**
 * Execute migration based on user choice
 */
export const executeMigration = action(async (params: { userId: string; choice: MigrationChoice }) => {
  const { userId, choice } = params
  const { migrateToServer, useServerData, mergeData, setMigrationStatus } = await import('@/lib/storage/migration')

  setMigrationInProgress(true)
  setMigrationError(null)
  migrationChoiceAtom.set(choice)

  try {
    switch (choice) {
      case 'upload':
        // Upload local data to server
        await migrateToServer(userId)
        break

      case 'use_cloud':
        // Discard local, use server data
        await useServerData(userId)
        break

      case 'keep_both':
        // Merge: push local to server (server handles conflicts)
        await mergeData(userId)
        break
    }

    // Mark as completed
    await setMigrationStatus(userId, 'completed')

    // Close dialog and reset state
    closeMigrationDialog()
    resetMigrationState()

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed'
    setMigrationError(message)
    throw error
  } finally {
    setMigrationInProgress(false)
  }
}, 'migration.execute').extend(withAsync())

/**
 * Skip migration (user chose not to migrate)
 */
export const skipMigrationAction = action(async (userId: string) => {
  const { skipMigration } = await import('@/lib/storage/migration')

  await skipMigration(userId)
  closeMigrationDialog()
  resetMigrationState()
}, 'migration.skip').extend(withAsync())
