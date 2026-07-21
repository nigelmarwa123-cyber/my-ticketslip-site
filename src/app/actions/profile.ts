'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const username = formData.get('username') as string
  if (!username || username.trim().length < 3) {
    return { error: 'Username must be at least 3 characters long' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: username.trim() })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') { // PostgreSQL unique violation code
      return { error: 'Username is already taken' }
    }
    return { error: error.message }
  }

  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}
