import { verifyToken } from '@clerk/backend'

export async function verifyClerkToken(authHeader: string | null): Promise<{ userId: string | null }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { userId: null }

  const token = authHeader.slice(7) // "Bearer ".length === 7

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })
    return { userId: payload.sub }
  } catch {
    return { userId: null }
  }
}
