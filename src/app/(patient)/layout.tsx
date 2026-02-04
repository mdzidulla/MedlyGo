import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PatientHeader } from '@/components/layout/patient-header'
import { ChatWidget } from '@/components/chat'

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get user profile data from the users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name, avatar_url, phone')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null; avatar_url: string | null; phone: string | null } | null }

  // Build user object for header
  const userData = {
    name: userProfile?.full_name || user.email?.split('@')[0] || 'Patient',
    email: user.email || '',
    avatar: userProfile?.avatar_url || undefined,
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
