import * as React from "react"
import { Loader2 } from "lucide-react"
import { reatomComponent } from "@reatom/react"
import {
  userAtom,
  isAuthenticatedAtom,
  isLoadingAtom,
  isInitializedAtom,
} from "@/stores/auth/atoms"
import { isDataLoadingAtom } from "@/stores/data/atoms"
import { initializeAuth } from "@/stores/auth/actions"
import { loadAllData } from "@/stores/data/actions"
import { LoginForm } from "./login-form"

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Wrapper component that handles authentication flow
 *
 * - Initializes auth state on mount
 * - Shows loading spinner during initialization
 * - Redirects to login if not authenticated
 * - Loads user data when authenticated
 * - Renders children when ready
 */
export const AuthGuard = reatomComponent<AuthGuardProps>(({ children }) => {
  const user = userAtom()
  const isAuthenticated = isAuthenticatedAtom()
  const isLoading = isLoadingAtom()
  const isInitialized = isInitializedAtom()
  const isDataLoading = isDataLoadingAtom()
  const [isDataLoaded, setIsDataLoaded] = React.useState(false)

  // Initialize auth on mount
  React.useEffect(() => {
    initializeAuth()
  }, [])

  // Load user data when authenticated
  React.useEffect(() => {
    if (isAuthenticated && user && !isDataLoaded) {
      loadAllData(user.id).then(() => {
        setIsDataLoaded(true)
      })
    }
  }, [isAuthenticated, user, isDataLoaded])

  // Reset data loaded state on logout
  React.useEffect(() => {
    if (!isAuthenticated) {
      setIsDataLoaded(false)
    }
  }, [isAuthenticated])

  // Show loading during initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />
  }

  // Show loading while data is being fetched
  if (isDataLoading || !isDataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your bookmarks...</p>
        </div>
      </div>
    )
  }

  // Render children when everything is ready
  return <>{children}</>
}, "AuthGuard")
