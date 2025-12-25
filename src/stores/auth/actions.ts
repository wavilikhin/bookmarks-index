// Auth actions for authentication operations
import { action, wrap } from "@reatom/core"
import { userAtom, isLoadingAtom, isInitializedAtom } from "./atoms"
import {
  getCurrentUserId,
  setCurrentUserId,
  clearCurrentUserId,
  getUser,
  setUser,
} from "@/lib/storage/idb"
import { createTimestamps } from "@/lib/utils/entity"
import type { User, UserSettings } from "@/types"

/**
 * Initialize auth - check for existing session on app start
 */
export const initializeAuth = action(async () => {
  if (isInitializedAtom()) return

  isLoadingAtom.set(true)

  try {
    const currentUserId = await wrap(getCurrentUserId())

    if (currentUserId) {
      const user = await wrap(getUser(currentUserId))
      if (user) {
        userAtom.set(user)
      }
    }
  } catch (error) {
    console.error("Failed to initialize auth:", error)
  } finally {
    isLoadingAtom.set(false)
    isInitializedAtom.set(true)
  }
}, "auth.initialize")

/**
 * Login - create or find existing user by username
 */
export const login = action(async (username: string) => {
  isLoadingAtom.set(true)

  try {
    // Generate a deterministic user ID from username
    // This allows the same username to access the same data
    const userId = `user_${username.toLowerCase()}`

    // Check if user exists
    let user = await wrap(getUser(userId))

    if (!user) {
      // Create new user
      user = {
        id: userId,
        username,
        settings: {
          theme: "system",
        },
        ...createTimestamps(),
      }
      await wrap(setUser(user))
    }

    // Set session
    await wrap(setCurrentUserId(userId))
    userAtom.set(user)
  } catch (error) {
    console.error("Failed to login:", error)
    throw error
  } finally {
    isLoadingAtom.set(false)
  }
}, "auth.login")

/**
 * Logout - clear session but preserve data
 */
export const logout = action(async () => {
  isLoadingAtom.set(true)

  try {
    await wrap(clearCurrentUserId())
    userAtom.set(null)
  } catch (error) {
    console.error("Failed to logout:", error)
    throw error
  } finally {
    isLoadingAtom.set(false)
  }
}, "auth.logout")

/**
 * Update user settings (e.g., theme preference)
 */
export const updateSettings = action(async (newSettings: Partial<UserSettings>) => {
  const user = userAtom()
  if (!user) return

  try {
    const updatedUser: User = {
      ...user,
      settings: { ...user.settings, ...newSettings },
      updatedAt: new Date().toISOString(),
    }

    await wrap(setUser(updatedUser))
    userAtom.set(updatedUser)
  } catch (error) {
    console.error("Failed to update settings:", error)
    throw error
  }
}, "auth.updateSettings")
