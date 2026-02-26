import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getServerSession() {
  return await auth()
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  return await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true, provider: true },
  })
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  return session.user
}

export async function requireRole(role: string | string[]) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(session.user.role)) throw new Error('Unauthorized')
  return session.user
}
