// Auth atoms for Clerk integration
// userId is synced from Clerk via ClerkUserSync component
import { atom, computed } from '@reatom/core'

// Core auth state - just the userId from Clerk
export const userIdAtom = atom<string | null>(null, 'auth.userId')

// Computed auth state - derived from userIdAtom
export const isAuthenticatedAtom = computed(() => userIdAtom() !== null, 'auth.isAuthenticated')
