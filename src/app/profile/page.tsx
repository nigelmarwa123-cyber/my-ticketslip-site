import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfileIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect(`/profile/${user.id}`)
  } else {
    redirect('/login')
  }
}
