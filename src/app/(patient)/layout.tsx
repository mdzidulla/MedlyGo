import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PatientHeader } from '@/components/layout/patient-header'
import { ChatWidget } from '@/components/chat'

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Get user profile data from the database
  const userProfile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true, avatarUrl: true, phone: true },
  })

  // Build user object for header
  const userData = {
    name: userProfile?.fullName || session.user.email?.split('@')[0] || 'Patient',
    email: session.user.email || '',
    avatar: userProfile?.avatarUrl || undefined,
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PatientHeader user={userData} />
      <main className="flex-1">
        {children}
      </main>
      <ChatWidget />
    </div>
  )
}
