import * as React from 'react'
import { reatomComponent, useWrap } from '@reatom/react'
import { Cloud, Upload, Merge, Loader2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  Button
} from '@/shared/ui'
import {
  migrationDialogOpenAtom,
  migrationStateAtom,
  migrationInProgressAtom,
  migrationErrorAtom,
  executeMigration,
  closeMigrationDialog
} from '@/stores'
import { userIdAtom } from '@/stores/auth/atoms'

import type { MigrationChoice } from '@/lib/storage/migration'

interface MigrationOptionProps {
  icon: React.ReactNode
  title: string
  description: string
  choice: MigrationChoice
  onSelect: (choice: MigrationChoice) => void
  disabled?: boolean
}

function MigrationOption({ icon, title, description, choice, onSelect, disabled }: MigrationOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(choice)}
      disabled={disabled}
      className="flex w-full items-start gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">{icon}</div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </button>
  )
}

/**
 * Migration Dialog Component
 *
 * Shows when user has local IndexedDB data and needs to decide how to handle
 * migration to the server backend.
 */
export const MigrationDialog = reatomComponent(() => {
  const isOpen = migrationDialogOpenAtom()
  const state = migrationStateAtom()
  const inProgress = migrationInProgressAtom()
  const error = migrationErrorAtom()
  const userId = userIdAtom()

  const wrappedExecute = useWrap(executeMigration)

  const handleSelect = React.useCallback(
    async (choice: MigrationChoice) => {
      if (!userId) return
      await wrappedExecute({ userId, choice })
    },
    [userId, wrappedExecute]
  )

  const handleClose = React.useCallback(() => {
    if (!inProgress) {
      closeMigrationDialog()
    }
  }, [inProgress])

  // Don't render if no state
  if (!state) return null

  const { localDataCounts, hasServerData } = state

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Migrate Your Data</AlertDialogTitle>
          <AlertDialogDescription>
            We found local data on this device. Choose how you want to handle it:
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Local data summary */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Local data found:</p>
          <p className="text-sm">
            {localDataCounts.spaces} spaces, {localDataCounts.groups} groups, {localDataCounts.bookmarks} bookmarks
          </p>
          {hasServerData && <p className="mt-1 text-xs text-amber-600">You also have data saved in the cloud.</p>}
        </div>

        {/* Error display */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Migration options */}
        <div className="flex flex-col gap-2">
          <MigrationOption
            icon={<Upload className="size-5" />}
            title="Upload my data"
            description="Send your local data to the cloud"
            choice="upload"
            onSelect={handleSelect}
            disabled={inProgress}
          />

          {hasServerData && (
            <>
              <MigrationOption
                icon={<Cloud className="size-5" />}
                title="Use cloud data"
                description="Discard local data and use what's in the cloud"
                choice="use_cloud"
                onSelect={handleSelect}
                disabled={inProgress}
              />

              <MigrationOption
                icon={<Merge className="size-5" />}
                title="Keep both"
                description="Merge local data with cloud (cloud wins on conflicts)"
                choice="keep_both"
                onSelect={handleSelect}
                disabled={inProgress}
              />
            </>
          )}
        </div>

        {/* Loading indicator */}
        {inProgress && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Migrating data...</span>
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={inProgress}>
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}, 'MigrationDialog')
