import * as React from 'react'
import { useAuth } from '@clerk/clerk-react'
import { userIdAtom } from '@/stores'

/**
 * ClerkUserSync - Syncs Clerk authentication state to Reatom userIdAtom
 *
 * This component bridges Clerk's authentication with our Reatom data layer.
 * When a user signs in/out via Clerk, it updates userIdAtom and loads/clears data.
 */
export function ClerkUserSync({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth()

  React.useEffect(() => {
    if (!isLoaded) return
    if (!userId) {
      userIdAtom.set(null)
      return
    }

    userIdAtom.set(userId)
  }, [userId, isLoaded])

  return <>{children}</>
}
